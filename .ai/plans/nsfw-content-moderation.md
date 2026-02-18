# NSFW Content Moderation Solutions

## Overview

Preventing users from uploading inappropriate content (NSFW - Not Safe For Work) is critical for maintaining a safe, family-friendly environment in k9d8. This document outlines various technical solutions to automatically detect and prevent NSFW image uploads.

**Current Risk Areas:**
- Dog profile photos
- User profile pictures
- Direct message images (if implemented)
- Playdate/cover photos

---

## Solution Comparison

| Solution | Accuracy | Cost | Speed | Privacy | Setup Complexity |
|----------|----------|------|-------|---------|------------------|
| **AWS Rekognition** | High | Pay per image | Fast | Data leaves app | Medium |
| **Google Vision API** | High | Pay per image | Fast | Data leaves app | Medium |
| **Azure Content Moderator** | High | Pay per image | Fast | Data leaves app | Medium |
| **Supabase + ModerateJS** | Medium | Free tier available | Medium | Self-hosted option | Low |
| **nsfwjs (TensorFlow.js)** | Medium | Free | Medium | On-device/client | Low |
| **Human Moderation** | Very High | High (labor) | Slow | Internal | High |

---

## Solution 1: AWS Rekognition (Recommended)

Amazon Rekognition provides comprehensive image and video analysis, including explicit content detection.

### Pros
- Industry-leading accuracy
- Scales automatically
- Comprehensive API (also supports face detection, text extraction)
- Well-documented
- Pay-per-use pricing

### Cons
- Images leave your infrastructure
- AWS vendor lock-in
- Can be expensive at scale
- Requires AWS account setup

### Implementation

#### Step 1: Set Up AWS Account
1. Create AWS account
2. Set up IAM user with Rekognition permissions
3. Store credentials securely

#### Step 2: Install AWS SDK
```bash
npm install @aws-sdk/client-rekognition
```

#### Step 3: Create Moderation Service
```typescript
// lib/moderation/aws-rekognition.ts
import { RekognitionClient, DetectModerationLabelsCommand } from '@aws-sdk/client-rekognition';

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface ModerationResult {
  isSafe: boolean;
  confidence: number;
  labels: string[];
  reasons: string[];
}

export async function moderateImage(imageBuffer: Buffer): Promise<ModerationResult> {
  const command = new DetectModerationLabelsCommand({
    Image: { Bytes: imageBuffer },
    MinConfidence: 60, // Adjust threshold (0-100)
  });

  const response = await rekognition.send(command);
  
  const inappropriateLabels = response.ModerationLabels?.filter(label => {
    // Categories to block
    const blockedCategories = [
      'Explicit Nudity',
      'Suggestive',
      'Violence',
      'Visually Disturbing',
      'Rude Gestures',
      'Drugs',
      'Tobacco',
      'Alcohol',
      'Gambling',
      'Hate Symbols',
    ];
    
    return blockedCategories.includes(label.Name || '') ||
           blockedCategories.includes(label.ParentName || '');
  }) || [];

  const isSafe = inappropriateLabels.length === 0;
  
  return {
    isSafe,
    confidence: Math.max(...inappropriateLabels.map(l => l.Confidence || 0), 0),
    labels: inappropriateLabels.map(l => l.Name || ''),
    reasons: inappropriateLabels.map(l => 
      `${l.Name} (${Math.round(l.Confidence || 0)}% confidence)`
    ),
  };
}
```

#### Step 4: Supabase Storage Hook
```typescript
// supabase/functions/image-moderation/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  const { record } = await req.json();
  
  // Get image from storage
  const imageUrl = record.url;
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  
  // Call moderation API
  const moderationResult = await moderateImage(Buffer.from(imageBuffer));
  
  if (!moderationResult.isSafe) {
    // Delete the inappropriate image
    await supabase.storage
      .from('dog-photos')
      .remove([record.path]);
    
    // Log the violation
    await supabase.from('moderation_logs').insert({
      user_id: record.owner,
      image_path: record.path,
      violation_type: 'nsfw',
      confidence: moderationResult.confidence,
      labels: moderationResult.labels,
      created_at: new Date().toISOString(),
    });
    
    // Notify user (optional)
    await sendNotification(record.owner, 'Your uploaded image was removed due to inappropriate content.');
    
    return new Response(JSON.stringify({ blocked: true }), { status: 200 });
  }
  
  return new Response(JSON.stringify({ blocked: false }), { status: 200 });
});
```

#### Step 5: Client-Side Integration
```typescript
// hooks/useImageUpload.ts
import { moderateImage } from '@/lib/moderation/aws-rekognition';

export async function uploadDogPhoto(imageUri: string, dogId: string) {
  try {
    // Convert image to buffer
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Pre-check with moderation
    const moderationResult = await moderateImage(buffer);
    
    if (!moderationResult.isSafe) {
      throw new Error(
        `Image contains inappropriate content: ${moderationResult.reasons.join(', ')}`
      );
    }
    
    // Proceed with upload
    const { data, error } = await supabase.storage
      .from('dog-photos')
      .upload(`${dogId}/${Date.now()}.jpg`, buffer);
      
    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

### Pricing
- First 5,000 images/month: Free
- 5,001 - 1M images: $0.001 per image
- 1M+ images: Contact AWS

---

## Solution 2: Google Cloud Vision API

Google's Vision API offers similar content moderation capabilities with SafeSearch detection.

### Pros
- High accuracy
- Part of Google Cloud ecosystem
- Detailed likelihood ratings
- Also provides label detection, OCR, etc.

### Cons
- Images leave infrastructure
- Google Cloud pricing can be complex
- Requires Google Cloud account

### Implementation

```typescript
// lib/moderation/google-vision.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';

const client = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

interface SafeSearchResult {
  isSafe: boolean;
  adult: string;    // VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
  violence: string;
  racy: string;
  spoof: string;
  medical: string;
}

export async function checkSafeSearch(imageBuffer: Buffer): Promise<SafeSearchResult> {
  const [result] = await client.safeSearchDetection(imageBuffer);
  const detections = result.safeSearchAnnotation;
  
  if (!detections) {
    return { isSafe: true, adult: 'UNKNOWN', violence: 'UNKNOWN', racy: 'UNKNOWN', spoof: 'UNKNOWN', medical: 'UNKNOWN' };
  }
  
  const blockedLikelihoods = ['LIKELY', 'VERY_LIKELY'];
  
  const isSafe = !(
    blockedLikelihoods.includes(detections.adult || '') ||
    blockedLikelihoods.includes(detections.violence || '') ||
    blockedLikelihoods.includes(detections.racy || '')
  );
  
  return {
    isSafe,
    adult: detections.adult || 'UNKNOWN',
    violence: detections.violence || 'UNKNOWN',
    racy: detections.racy || 'UNKNOWN',
    spoof: detections.spoof || 'UNKNOWN',
    medical: detections.medical || 'UNKNOWN',
  };
}
```

### Pricing
- First 1,000 images/month: Free
- 1,001 - 5M images: $1.50 per 1,000 images
- 5M+ images: $1.00 per 1,000 images

---

## Solution 3: nsfwjs (Client-Side TensorFlow.js)

nsfwjs is a JavaScript library that runs a TensorFlow model in the browser/React Native to detect inappropriate content without sending images to external services.

### Pros
- **Privacy**: Images never leave the device
- **Free**: No per-image costs
- **Fast**: No network latency
- **Works offline**

### Cons
- **Lower accuracy** than cloud solutions
- **Bundle size**: Model adds ~4MB to app
- **Device performance**: Slower on older devices
- **Can be bypassed** by tech-savvy users (client-side only)

### Implementation

#### Step 1: Install Dependencies
```bash
npm install nsfwjs @tensorflow/tfjs-react-native
npx expo install expo-gl  # Required for TensorFlow
```

#### Step 2: Initialize Model
```typescript
// lib/moderation/nsfwjs.ts
import * as tf from '@tensorflow/tfjs-react-native';
import * as nsfwjs from 'nsfwjs';

let model: nsfwjs.NSFWJS | null = null;

export async function loadModel() {
  await tf.ready();
  model = await nsfwjs.load();
  return model;
}

interface Prediction {
  className: 'Drawing' | 'Hentai' | 'Neutral' | 'Porn' | 'Sexy';
  probability: number;
}

export async function classifyImage(imageTensor: tf.Tensor): Promise<Prediction[]> {
  if (!model) {
    await loadModel();
  }
  
  const predictions = await model!.classify(imageTensor);
  return predictions as Prediction[];
}

export function isSafeContent(predictions: Prediction[]): boolean {
  const unsafeClasses = ['Porn', 'Hentai', 'Sexy'];
  const threshold = 0.7; // 70% confidence
  
  return !predictions.some(pred => 
    unsafeClasses.includes(pred.className) && pred.probability > threshold
  );
}
```

#### Step 3: React Native Integration
```typescript
// components/ImagePickerWithModeration.tsx
import React, { useState, useEffect } from 'react';
import { Button, Image, View, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as tf from '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { loadModel, classifyImage, isSafeContent } from '@/lib/moderation/nsfwjs';

export function ImagePickerWithModeration({ onImageSelect }: { onImageSelect: (uri: string) => void }) {
  const [modelLoading, setModelLoading] = useState(true);
  
  useEffect(() => {
    loadModel().then(() => setModelLoading(false));
  }, []);
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      
      // Moderate image
      try {
        const response = await fetch(imageUri);
        const imageData = await response.arrayBuffer();
        const imageTensor = decodeJpeg(new Uint8Array(imageData));
        
        const predictions = await classifyImage(imageTensor);
        imageTensor.dispose(); // Clean up memory
        
        if (isSafeContent(predictions)) {
          onImageSelect(imageUri);
        } else {
          Alert.alert(
            'Inappropriate Content',
            'This image appears to contain inappropriate content and cannot be uploaded.'
          );
        }
      } catch (error) {
        console.error('Moderation error:', error);
        Alert.alert('Error', 'Failed to process image. Please try again.');
      }
    }
  };
  
  return (
    <Button 
      title={modelLoading ? "Loading..." : "Pick Image"} 
      onPress={pickImage}
      disabled={modelLoading}
    />
  );
}
```

#### ⚠️ Important: Client-Side Only Is Not Enough

Since client-side moderation can be bypassed, **always pair with server-side validation**:

```typescript
// Supabase Edge Function for server-side verification
// supabase/functions/verify-upload/index.ts

serve(async (req) => {
  const { imageUrl, userId } = await req.json();
  
  // Re-check with cloud service (AWS/Google)
  // This catches images that bypassed client-side check
  const isSafe = await moderateWithAWS(imageUrl);
  
  if (!isSafe) {
    // Remove image
    // Flag user account
    // Send warning
  }
});
```

---

## Solution 4: Azure Content Moderator

Microsoft Azure provides content moderation services including image analysis.

### Pros
- Good accuracy
- Part of Azure ecosystem
- Text moderation also available
- Competitive pricing

### Cons
- Azure account required
- Images leave infrastructure

### Implementation

```typescript
// lib/moderation/azure-moderator.ts
import { ContentModeratorClient } from '@azure/cognitiveservices-contentmoderator';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';

const credentials = new CognitiveServicesCredentials(process.env.AZURE_CONTENT_MODERATOR_KEY!);
const client = new ContentModeratorClient(credentials, process.env.AZURE_ENDPOINT!);

export async function moderateImageAzure(imageBuffer: Buffer) {
  const result = await client.imageModeration.evaluateFileInput(imageBuffer, {
    cacheImage: false,
  });
  
  return {
    isSafe: !result.isImageAdultClassified && !result.isImageRacyClassified,
    adultScore: result.adultClassificationScore,
    racyScore: result.racyClassificationScore,
    isAdult: result.isImageAdultClassified,
    isRacy: result.isImageRacyClassified,
  };
}
```

### Pricing
- First 5,000 images/month: Free
- 5,001 - 1M images: $0.40 per 1,000 images

---

## Solution 5: Human Moderation + Queue System

For the highest accuracy, implement a human review queue for flagged or random samples.

### Implementation

```typescript
// Database schema additions

// moderation_queue table
interface ModerationQueue {
  id: string;
  image_url: string;
  user_id: string;
  upload_timestamp: string;
  auto_moderation_result: 'safe' | 'flagged' | 'pending';
  auto_moderation_confidence: number;
  human_review_status: 'pending' | 'approved' | 'rejected';
  reviewer_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

// user_violations table
interface UserViolation {
  id: string;
  user_id: string;
  violation_type: 'nsfw' | 'spam' | 'harassment';
  image_url: string;
  timestamp: string;
  warning_sent: boolean;
  account_suspended: boolean;
}
```

### Workflow

```typescript
// lib/moderation/human-review.ts
export async function submitForHumanReview(
  imageUrl: string, 
  userId: string,
  autoResult: ModerationResult
) {
  // If auto-moderation is unsure (confidence 40-70%), flag for human review
  const needsHumanReview = autoResult.confidence >= 40 && autoResult.confidence < 70;
  
  if (needsHumanReview) {
    await supabase.from('moderation_queue').insert({
      image_url: imageUrl,
      user_id: userId,
      auto_moderation_result: 'flagged',
      auto_moderation_confidence: autoResult.confidence,
      human_review_status: 'pending',
    });
    
    // Make image temporarily private or blurred
    await blurImage(imageUrl);
  }
  
  return needsHumanReview;
}
```

### Admin Dashboard UI

```typescript
// app/admin/moderation.tsx (Admin-only screen)
export function ModerationDashboard() {
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  
  const approveImage = async (itemId: string) => {
    await supabase
      .from('moderation_queue')
      .update({ human_review_status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', itemId);
      
    // Unblur image
  };
  
  const rejectImage = async (itemId: string, userId: string) => {
    await supabase
      .from('moderation_queue')
      .update({ human_review_status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', itemId);
    
    // Delete image
    // Log violation
    await logViolation(userId, 'nsfw', itemId);
    
    // Check violation count for account action
    await checkAndApplySanctions(userId);
  };
  
  return (
    <FlatList
      data={queue}
      renderItem={({ item }) => (
        <View>
          <Image source={{ uri: item.image_url }} style={{ width: 200, height: 200 }} />
          <Text>Auto-confidence: {item.auto_moderation_confidence}%</Text>
          <Button title="Approve" onPress={() => approveImage(item.id)} />
          <Button title="Reject" onPress={() => rejectImage(item.id, item.user_id)} />
        </View>
      )}
    />
  );
}
```

---

## Recommended Hybrid Approach

For k9d8, we recommend a **three-layer defense**:

### Layer 1: Client-Side (nsfwjs)
- Immediate feedback to user
- Reduces API calls to backend
- Privacy-first for user
- **Not a security measure** (can be bypassed)

### Layer 2: Server-Side (AWS Rekognition)
- Definitive check before storage
- Runs in Supabase Edge Function
- Cannot be bypassed
- Logs all moderation attempts

### Layer 3: Human Review Queue
- Review flagged or borderline content
- Random sampling for quality assurance
- Appeals process for users
- Continuous model improvement

```typescript
// Complete workflow
export async function uploadImageWithModeration(imageUri: string, userId: string) {
  // 1. Client-side pre-check (optional, for UX)
  const clientSafe = await clientSideCheck(imageUri);
  if (!clientSafe) {
    throw new Error('Image may contain inappropriate content');
  }
  
  // 2. Upload to temporary storage
  const tempPath = await uploadToTemp(imageUri);
  
  // 3. Server-side moderation
  const moderationResult = await callModerationAPI(tempPath);
  
  if (!moderationResult.isSafe) {
    // Auto-reject high-confidence violations
    if (moderationResult.confidence > 80) {
      await deleteTempImage(tempPath);
      await logViolation(userId, 'nsfw', tempPath, moderationResult);
      throw new Error('Image violates content policy');
    }
    
    // Queue for human review if borderline
    await submitForHumanReview(tempPath, userId, moderationResult);
    return { pending: true, message: 'Image pending review' };
  }
  
  // 4. Move to permanent storage
  const permanentUrl = await moveToPermanent(tempPath);
  return { success: true, url: permanentUrl };
}
```

---

## Database Schema Additions

```sql
-- Moderation logs for tracking and compliance
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  image_url TEXT,
  violation_type TEXT NOT NULL,
  confidence DECIMAL(5,2),
  labels TEXT[],
  moderation_service TEXT, -- 'aws', 'google', 'nsfwjs', 'human'
  action_taken TEXT NOT NULL, -- 'blocked', 'flagged', 'approved'
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation logs
CREATE POLICY "Only admins can view moderation logs"
  ON moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- User violation tracking for progressive enforcement
CREATE TABLE user_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1, -- 1: warning, 2: temp ban, 3: permanent
  image_url TEXT,
  description TEXT,
  action_taken TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, created_at)
);

-- Function to check violation count
CREATE OR REPLACE FUNCTION check_user_violations(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_violations
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '90 days'
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-suspend repeat offenders
CREATE OR REPLACE FUNCTION handle_violation_insert()
RETURNS TRIGGER AS $$
DECLARE
  violation_count INTEGER;
BEGIN
  violation_count := check_user_violations(NEW.user_id);
  
  -- 3 violations in 90 days = temporary suspension
  IF violation_count >= 3 THEN
    UPDATE profiles
    SET is_suspended = true,
        suspension_reason = 'Multiple content violations',
        suspended_until = NOW() + INTERVAL '7 days'
    WHERE id = NEW.user_id;
  END IF;
  
  -- 5 violations = permanent ban
  IF violation_count >= 5 THEN
    UPDATE profiles
    SET is_suspended = true,
        suspension_reason = 'Repeated content violations',
        suspended_until = NULL -- permanent
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_violation
  AFTER INSERT ON user_violations
  FOR EACH ROW
  EXECUTE FUNCTION handle_violation_insert();
```

---

## User Communication

### Error Messages

```typescript
const MODERATION_MESSAGES = {
  NSFW_DETECTED: 'This image cannot be uploaded. Please ensure your photo follows our community guidelines.',
  BORDERLINE_CONTENT: 'This image is being reviewed by our team. You\'ll be notified once the review is complete.',
  APPEAL_REJECTED: 'Your appeal has been reviewed and the decision stands. Repeated violations may result in account suspension.',
  ACCOUNT_SUSPENDED: 'Your account has been suspended due to multiple content violations. Contact support@k9d8.app for more information.',
};
```

### In-App Guidelines

Display clear guidelines before upload:

```typescript
// components/UploadGuidelines.tsx
export function UploadGuidelines() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photo Guidelines</Text>
      <Text>✅ Clear photos of your dog(s)</Text>
      <Text>✅ Appropriate content only</Text>
      <Text>✅ Good lighting and focus</Text>
      <Text style={styles.negative}>❌ No explicit content</Text>
      <Text style={styles.negative}>❌ No violence or gore</Text>
      <Text style={styles.negative}>❌ No hate symbols</Text>
      <Text style={styles.footer}>
        Violations may result in photo removal and account suspension.
      </Text>
    </View>
  );
}
```

---

## Cost Estimates

Assuming 10,000 image uploads per month:

| Solution | Monthly Cost | Notes |
|----------|--------------|-------|
| **AWS Rekognition** | $5 | First 5K free, then $0.001/image |
| **Google Vision** | $13.50 | First 1K free, then $1.50/1K |
| **Azure** | $2 | First 5K free, then $0.40/1K |
| **nsfwjs** | $0 | Client-side only |
| **Hybrid (nsfwjs + AWS)** | ~$3 | Most client-side rejected, fewer AWS calls |

**Recommendation:** Start with **Azure Content Moderator** (best price/performance) or **AWS Rekognition** (best accuracy).

---

## Implementation Priority

### Phase 1 (MVP - Launch)
1. Implement AWS Rekognition in Supabase Edge Function
2. Block obvious violations (confidence > 70%)
3. Log all moderation attempts
4. Add basic violation tracking

### Phase 2 (Post-Launch)
1. Add client-side nsfwjs for immediate feedback
2. Implement human review queue
3. Add user violation tracking
4. Create admin moderation dashboard

### Phase 3 (Scale)
1. Implement progressive sanctions (warnings → suspension → ban)
2. Add appeal process
3. Machine learning improvement based on human decisions
4. Community reporting feature

---

## Legal Considerations

### Terms of Service Updates
Add to Terms of Service:
```
Content Moderation: By uploading content to k9d8, you agree that we may 
use automated tools and/or human review to screen for inappropriate content. 
We reserve the right to remove any content that violates our Community 
Guidelines without prior notice.
```

### Privacy Policy Updates
Add to Privacy Policy:
```
Content Analysis: We analyze uploaded images using automated systems to 
detect inappropriate content. This processing is necessary to maintain a 
safe environment and is based on our legitimate interest in platform safety.
```

---

## Monitoring & Metrics

Track these KPIs:

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| False Positive Rate | < 5% | Adjust confidence thresholds |
| False Negative Rate | < 1% | Improve model or add human review |
| Average Review Time | < 2 hours | Scale moderation team |
| User Appeal Rate | < 2% | Review guidelines clarity |
| Repeat Violation Rate | < 10% | Strengthen sanctions |

---

## Summary

| Approach | Best For | Recommendation |
|----------|----------|----------------|
| **AWS Rekognition** | Production apps, high accuracy needs | ⭐ Primary choice |
| **Azure Content Moderator** | Cost-conscious, Microsoft ecosystem | ⭐ Good alternative |
| **nsfwjs** | Privacy-focused, offline capability | ⚠️ Use as layer 1 only |
| **Human Moderation** | High-stakes content, compliance | ⭐ Essential for layer 3 |
| **Hybrid** | Best overall protection | ⭐ **Recommended for k9d8** |

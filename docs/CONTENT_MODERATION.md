# Content Moderation System

## Overview

The k9d8 app includes a client-side content moderation system to detect and block inappropriate images (NSFW content) before they are uploaded. This system uses **TensorFlow.js** with the **nsfwjs** model, running entirely on the device/browser with **zero cost**.

**Supported Platforms:**
- ✅ iOS (TensorFlow.js React Native)
- ✅ Android (TensorFlow.js React Native)
- ✅ Web (TensorFlow.js WebGL/CPU)

## How It Works

1. **Image Selection**: When a user selects an image, it's first analyzed locally
2. **AI Analysis**: The nsfwjs model classifies the image into 5 categories
3. **Threshold Check**: If any unsafe category exceeds its threshold, the upload is blocked
4. **User Feedback**: Clear messages explain why an image was rejected

## Categories & Thresholds

The model returns probabilities for these categories:

| Category  | Threshold | Action                                 |
|-----------|-----------|----------------------------------------|
| Drawing   | 100%      | Always allowed (sketches, cartoons)    |
| Hentai    | 30%       | Block adult animated content           |
| Neutral   | 100%      | Always allowed (safe content)          |
| Porn      | 30%       | Block explicit content                 |
| Sexy      | 70%       | Block suggestive content               |

## Implementation

### Platform-Specific Files

The moderation system uses platform-specific implementations:

- **`moderation.ts`** - Native (iOS/Android) implementation using `@tensorflow/tfjs-react-native`
- **`moderation.web.ts`** - Web implementation using `@tensorflow/tfjs` (WebGL/CPU)

Expo automatically picks the right file based on the platform.

### Using the ImagePickerWithModeration Component

The easiest way to add moderation to any image upload flow:

```tsx
import { ImagePickerWithModeration } from '@/src/components/ImagePickerWithModeration';

function MyScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  return (
    <ImagePickerWithModeration
      selectedImage={photoUri}
      onImageSelect={(uri) => setPhotoUri(uri)}
      onImageRemove={() => setPhotoUri(null)}
      size="large"
      shape="circle"
      moderationEnabled={true}
    />
  );
}
```

### Using the Hook Directly

For custom implementations:

```tsx
import { useModeration } from '@/src/hooks/useModeration';

function MyComponent() {
  const { isReady, checkImage } = useModeration({ preloadOnMount: true });

  const handleImage = async (uri: string) => {
    if (!isReady) {
      // Model still loading
      return;
    }

    const result = await checkImage(uri);
    
    if (!result.isSafe) {
      Alert.alert(
        'Content Not Allowed',
        `This image appears to contain ${result.highestRisk?.className.toLowerCase()} content.`
      );
      return;
    }

    // Proceed with upload
  };
}
```

### Using the Service Directly

For advanced use cases:

```tsx
import { 
  moderateImage, 
  isImageSafe,
  getModerationMessage 
} from '@/src/services/moderation';

// Full analysis
const result = await moderateImage(uri);
console.log(result.predictions);
console.log(result.isSafe);
console.log(result.highestRisk);

// Quick check
const safe = await isImageSafe(uri);

// Get user-friendly message
const message = getModerationMessage(result);
```

## Model Loading

The moderation model is preloaded when the app starts via the `ModerationProvider` in `_layout.tsx`. This ensures:

- No delay when users try to upload images
- Smooth UX with instant feedback
- Background loading doesn't block the UI

If the model fails to load (e.g., on older devices), the app will still work - images are allowed through with a console warning.

## Limitations & Considerations

### Client-Side Only

⚠️ **Important**: Client-side moderation can be bypassed by determined users. For apps handling sensitive content:

1. **Use this for UX** - provide immediate feedback and reduce inappropriate uploads
2. **Add server-side validation** - implement Supabase Edge Functions with AWS Rekognition or Azure Content Moderator for critical checks
3. **Consider hybrid approach** - client-side for speed, server-side for security

### Accuracy

- The nsfwjs model has ~90% accuracy on common content
- False positives can occur with certain dog breeds, shadows, or poses
- False negatives are possible with creative bypass attempts

### Performance

| Platform | Backend | Model Size | Analysis Time |
|----------|---------|------------|---------------|
| iOS/Android | React Native | ~4MB | 100-500ms |
| Web | WebGL/CPU | ~4MB | 100-300ms |

### Web-Specific Notes

- Uses WebGL when available for faster inference
- Falls back to CPU if WebGL is not available
- Model is cached in browser after first load
- CORS must be configured for image loading

### Edge Cases

- Very small images (<224x224) may give less accurate results
- Cropped or partially obscured images may bypass detection
- Screenshots of screens can confuse the model

## Legal & Compliance

### Terms of Service Update

Add to your Terms of Service:

> **User Content**: You are solely responsible for content you upload. We use automated content moderation tools to detect inappropriate material. By uploading content, you represent that you have the right to share it and that it complies with our Community Guidelines. We reserve the right to remove any content at our discretion.

### Privacy Policy Update

Add to your Privacy Policy:

> **Content Moderation**: We use on-device machine learning to analyze photos for inappropriate content before upload. This processing happens entirely on your device - images are not sent to external services for this check. This helps us maintain a safe community while protecting your privacy.

### Reporting Mechanism

Users should be able to report inappropriate content that slips through:

```tsx
// Add a report button on posts/profiles
<Pressable onPress={() => reportContent(contentId, reason)}>
  <Text>Report</Text>
</Pressable>
```

## Testing

### Safe Test Images

- Dog photos (various breeds, poses)
- Dog park scenes
- Profile photos with dogs
- Close-up dog faces

### Challenge Test Cases

- Dog in bathtub (may trigger false positive)
- Two dogs playing (may look suggestive)
- Dark lighting (may reduce accuracy)

### Manual Override

For development/testing, you can disable moderation:

```tsx
<ImagePickerWithModeration
  moderationEnabled={false} // Disable for testing
/>
```

## Future Improvements

1. **Custom Model**: Train on dog-specific content to reduce false positives
2. **Server-Side Fallback**: Add Supabase Edge Function for critical uploads
3. **Human Review Queue**: Flag borderline cases for manual review
4. **User Reporting**: Allow users to report inappropriate content
5. **Appeal Process**: Let users appeal false positives

## Dependencies

### Native (iOS/Android)
- `@tensorflow/tfjs` - Core TensorFlow.js library
- `@tensorflow/tfjs-react-native` - React Native bindings
- `nsfwjs` - Pre-trained NSFW detection model
- `expo-gl` - OpenGL for TensorFlow
- `react-native-fs` - File system access
- `expo-camera` - Camera support

### Web
- `@tensorflow/tfjs` - Core TensorFlow.js library (uses WebGL/CPU)
- `nsfwjs` - Pre-trained NSFW detection model

See `package.json` for exact versions.

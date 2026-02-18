# User Blocking & Content Removal Implementation Plan

## Overview

Apple App Store Review Guidelines require apps with user-generated content to include:
1. **User blocking** - Ability for users to block other users
2. **Content removal** - Mechanism to report and remove inappropriate content

This plan outlines the complete implementation for k9d8.

---

## Requirements Analysis

### Apple App Store Requirements

From [App Store Review Guidelines 1.2 - User Generated Content](https://developer.apple.com/app-store/review/guidelines/#user-generated-content):

> Apps with user-generated content must include:
> - A method for filtering objectionable content
> - A mechanism to report offensive content
> - The ability to block abusive users
> - Published contact information for users to raise concerns

### What This Means for k9d8

**User-Generated Content in k9d8:**
- User profiles (names, photos)
- Dog profiles (names, photos, descriptions)
- Check-ins at parks (public activity)
- Playdates (titles, descriptions)
- Chat messages (if implemented)
- Reviews/comments (if implemented)

**Required Features:**
1. ✅ Block/unblock users
2. ✅ Report inappropriate content
3. ✅ Report abusive users
4. ✅ Remove reported content (admin)
5. ✅ Contact information for appeals

---

## Phase 1: Database Schema

### 1.1 User Blocks Table

```sql
-- ============================================================
-- User Blocking System
-- ============================================================

CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT, -- Optional: why they blocked
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Index for quick lookup
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);

-- Enable RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own blocks
CREATE POLICY "Users can view their own blocks"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create their own blocks
CREATE POLICY "Users can block others"
  ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock (delete their own blocks)
CREATE POLICY "Users can unblock"
  ON user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);
```

### 1.2 Content Reports Table

```sql
-- ============================================================
-- Content Reporting System
-- ============================================================

CREATE TYPE report_type AS ENUM (
  'user',           -- Report entire user account
  'profile',        -- Report user profile
  'dog_profile',    -- Report a specific dog profile
  'check_in',       -- Report a check-in
  'playdate',       -- Report a playdate
  'message',        -- Report a message
  'photo',          -- Report a specific photo
  'review'          -- Report a review
);

CREATE TYPE report_reason AS ENUM (
  'inappropriate_content',  -- NSFW, offensive content
  'harassment',             -- Bullying, threatening
  'spam',                   -- Unwanted promotional content
  'fake_profile',           -- Impersonation, false info
  'underage',               -- User under 13/16
  'hate_speech',            -- Discriminatory content
  'violence',               -- Threats, violent content
  'other'                   -- Other reasons
);

CREATE TYPE report_status AS ENUM (
  'pending',        -- Awaiting review
  'under_review',   -- Being investigated
  'resolved',       -- Action taken
  'dismissed',      -- No violation found
  'appealed'        -- User appealed decision
);

CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type report_type NOT NULL,
  report_reason report_reason NOT NULL,
  
  -- Content reference ( polymorphic )
  content_type TEXT,           -- 'profile', 'dog', 'check_in', 'playdate', etc.
  content_id UUID,             -- ID of the reported content
  content_preview TEXT,        -- Snapshot of content (for review after deletion)
  
  -- Report details
  description TEXT,            -- Additional details from reporter
  status report_status NOT NULL DEFAULT 'pending',
  
  -- Resolution
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  action_taken TEXT,           -- 'content_removed', 'user_warned', 'user_suspended', etc.
  resolved_at TIMESTAMPTZ,
  
  -- Appeal
  appealed_by UUID REFERENCES profiles(id),
  appeal_reason TEXT,
  appeal_resolved_at TIMESTAMPTZ,
  appeal_resolution TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reports_reporter ON content_reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON content_reports(reported_user_id);
CREATE INDEX idx_reports_status ON content_reports(status);
CREATE INDEX idx_reports_type ON content_reports(report_type);
CREATE INDEX idx_reports_created ON content_reports(created_at);

-- Enable RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Users can see reports they created
CREATE POLICY "Users can view their own reports"
  ON content_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Only admins can update reports
CREATE POLICY "Only admins can update reports"
  ON content_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

### 1.3 Update Profiles Table

```sql
-- Add fields for moderation status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS content_warning TEXT; -- Warning displayed on profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_content_violation_at TIMESTAMPTZ;

-- Index for admin queries
CREATE INDEX idx_profiles_suspended ON profiles(is_suspended) WHERE is_suspended = true;
CREATE INDEX idx_profiles_admin ON profiles(is_admin) WHERE is_admin = true;
```

### 1.4 Soft Delete for Content

Instead of hard-deleting content, use soft delete so it can be restored if report is dismissed:

```sql
-- Add soft delete fields to existing tables
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT false;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS removed_reason TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES profiles(id);

ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT false;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS removed_reason TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES profiles(id);

ALTER TABLE play_dates ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT false;
ALTER TABLE play_dates ADD COLUMN IF NOT EXISTS removed_reason TEXT;
ALTER TABLE play_dates ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;
ALTER TABLE play_dates ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES profiles(id);

-- Add to RLS policies to filter out removed content
-- Example for dogs:
CREATE POLICY "Hide removed dogs from public"
  ON dogs FOR SELECT
  USING (is_removed = false OR auth.uid() = owner_id);
```

---

## Phase 2: Backend Implementation

### 2.1 User Blocking API

```typescript
// lib/api/blocks.ts
import { supabase } from '@/lib/supabase';

export interface BlockedUser {
  id: string;
  blocked_id: string;
  blocked_profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  created_at: string;
}

/**
 * Block a user
 */
export async function blockUser(blockedId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .insert({
      blocker_id: (await supabase.auth.getUser()).data.user!.id,
      blocked_id: blockedId,
      reason,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('User is already blocked');
    }
    throw error;
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', (await supabase.auth.getUser()).data.user!.id)
    .eq('blocked_id', blockedId);

  if (error) throw error;
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select(`
      id,
      blocked_id,
      created_at,
      blocked_profile:blocked_id (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('blocker_id', (await supabase.auth.getUser()).data.user!.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Check if current user has blocked another user
 */
export async function hasBlocked(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', (await supabase.auth.getUser()).data.user!.id)
    .eq('blocked_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return !!data;
}

/**
 * Check if current user is blocked by another user
 */
export async function isBlockedBy(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', userId)
    .eq('blocked_id', (await supabase.auth.getUser()).data.user!.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/**
 * Check if two users can interact (neither has blocked the other)
 */
export async function canInteractWith(userId: string): Promise<{ canInteract: boolean; blockedBy: boolean; hasBlocked: boolean }> {
  const currentUserId = (await supabase.auth.getUser()).data.user!.id;
  
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`)
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  if (error) throw error;

  const hasBlocked = data?.some(b => b.blocker_id === currentUserId && b.blocked_id === userId) || false;
  const blockedBy = data?.some(b => b.blocker_id === userId && b.blocked_id === currentUserId) || false;

  return {
    canInteract: !hasBlocked && !blockedBy,
    blockedBy,
    hasBlocked,
  };
}
```

### 2.2 Content Reporting API

```typescript
// lib/api/reports.ts
import { supabase } from '@/lib/supabase';

export interface CreateReportInput {
  reportedUserId: string;
  reportType: 'user' | 'profile' | 'dog_profile' | 'check_in' | 'playdate' | 'message' | 'photo' | 'review';
  reportReason: 'inappropriate_content' | 'harassment' | 'spam' | 'fake_profile' | 'underage' | 'hate_speech' | 'violence' | 'other';
  contentType?: string;
  contentId?: string;
  contentPreview?: string;
  description?: string;
}

/**
 * Submit a content report
 */
export async function submitReport(input: CreateReportInput): Promise<void> {
  const { error } = await supabase
    .from('content_reports')
    .insert({
      reporter_id: (await supabase.auth.getUser()).data.user!.id,
      reported_user_id: input.reportedUserId,
      report_type: input.reportType,
      report_reason: input.reportReason,
      content_type: input.contentType,
      content_id: input.contentId,
      content_preview: input.contentPreview,
      description: input.description,
    });

  if (error) throw error;
}

/**
 * Get reports submitted by current user
 */
export async function getMyReports() {
  const { data, error } = await supabase
    .from('content_reports')
    .select(`
      *,
      reported_user:reported_user_id (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('reporter_id', (await supabase.auth.getUser()).data.user!.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Check if user has already reported specific content
 */
export async function hasReported(contentType: string, contentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('content_reports')
    .select('id')
    .eq('reporter_id', (await supabase.auth.getUser()).data.user!.id)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}
```

### 2.3 Admin Content Management API

```typescript
// lib/api/admin.ts (Admin-only)
import { supabase } from '@/lib/supabase';

/**
 * Get all pending reports (Admin only)
 */
export async function getPendingReports() {
  const { data, error } = await supabase
    .from('content_reports')
    .select(`
      *,
      reporter:reporter_id (
        id,
        display_name,
        email
      ),
      reported_user:reported_user_id (
        id,
        display_name,
        email,
        avatar_url
      ),
      resolved_by:resolved_by (
        id,
        display_name
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Remove content and resolve report (Admin only)
 */
export async function removeContentAndResolve(
  reportId: string,
  contentType: string,
  contentId: string,
  resolutionNotes: string
): Promise<void> {
  const adminId = (await supabase.auth.getUser()).data.user!.id;

  // 1. Soft delete the content
  const tableMap: Record<string, string> = {
    'dog': 'dogs',
    'check_in': 'check_ins',
    'playdate': 'play_dates',
    'profile': 'profiles',
  };

  const table = tableMap[contentType];
  if (table) {
    await supabase
      .from(table)
      .update({
        is_removed: true,
        removed_reason: 'Content violation',
        removed_at: new Date().toISOString(),
        removed_by: adminId,
      })
      .eq('id', contentId);
  }

  // 2. Update report status
  await supabase
    .from('content_reports')
    .update({
      status: 'resolved',
      resolved_by: adminId,
      resolution_notes: resolutionNotes,
      action_taken: 'content_removed',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId);
}

/**
 * Dismiss report without action (Admin only)
 */
export async function dismissReport(
  reportId: string,
  resolutionNotes: string
): Promise<void> {
  const adminId = (await supabase.auth.getUser()).data.user!.id;

  await supabase
    .from('content_reports')
    .update({
      status: 'dismissed',
      resolved_by: adminId,
      resolution_notes: resolutionNotes,
      action_taken: 'no_action',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId);
}

/**
 * Suspend user account (Admin only)
 */
export async function suspendUser(
  userId: string,
  reason: string,
  days: number = 7
): Promise<void> {
  const adminId = (await supabase.auth.getUser()).data.user!.id;

  await supabase
    .from('profiles')
    .update({
      is_suspended: true,
      suspension_reason: reason,
      suspended_until: days === 0 ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      suspension_count: supabase.rpc('increment', { row_id: userId }),
    })
    .eq('id', userId);
}

/**
 * Unsuspend user account (Admin only)
 */
export async function unsuspendUser(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({
      is_suspended: false,
      suspension_reason: null,
      suspended_until: null,
    })
    .eq('id', userId);
}
```

### 2.4 Supabase Edge Functions

```typescript
// supabase/functions/handle-block/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { record } = await req.json();
  
  // When a block is created, remove any existing friendships
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Remove friendship if exists
  await supabase
    .from('friendships')
    .delete()
    .or(`requester_id.eq.${record.blocker_id},addressee_id.eq.${record.blocker_id}`)
    .or(`requester_id.eq.${record.blocked_id},addressee_id.eq.${record.blocked_id}`);

  // Remove playdate RSVPs between blocked users
  await supabase.rpc('remove_blocked_user_rsvps', {
    blocker_id: record.blocker_id,
    blocked_id: record.blocked_id,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

```typescript
// supabase/functions/notify-report/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  const { record } = await req.json();
  
  // Send email to admin when new report is submitted
  // Integrate with SendGrid/AWS SES
  
  const emailBody = `
    New content report submitted:
    
    Report ID: ${record.id}
    Reporter: ${record.reporter_id}
    Reported User: ${record.reported_user_id}
    Type: ${record.report_type}
    Reason: ${record.report_reason}
    
    View in admin dashboard: https://admin.k9d8.app/reports/${record.id}
  `;

  // Send email logic here

  return new Response(JSON.stringify({ notified: true }), { status: 200 });
});
```

---

## Phase 3: UI Implementation

### 3.1 Report Button Component

```typescript
// components/ReportButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitReport, hasReported } from '@/lib/api/reports';
import { ReportModal } from './ReportModal';

interface ReportButtonProps {
  reportedUserId: string;
  contentType?: string;
  contentId?: string;
  contentPreview?: string;
  size?: number;
}

export function ReportButton({
  reportedUserId,
  contentType,
  contentId,
  contentPreview,
  size = 24,
}: ReportButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  const checkIfReported = async () => {
    if (contentType && contentId) {
      const reported = await hasReported(contentType, contentId);
      setAlreadyReported(reported);
    }
  };

  const handlePress = async () => {
    await checkIfReported();
    
    if (alreadyReported) {
      Alert.alert('Already Reported', 'You have already reported this content.');
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report Content', 'Block User'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setModalVisible(true);
          } else if (buttonIndex === 2) {
            handleBlock();
          }
        }
      );
    } else {
      // Android: Show modal directly or use different UI
      setModalVisible(true);
    }
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You will no longer see their content or receive messages from them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(reportedUserId);
              Alert.alert('Blocked', 'User has been blocked.');
            } catch (error) {
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress}>
        <Ionicons name="flag-outline" size={size} color="#666" />
      </TouchableOpacity>

      <ReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        reportedUserId={reportedUserId}
        contentType={contentType}
        contentId={contentId}
        contentPreview={contentPreview}
        onBlock={handleBlock}
      />
    </>
  );
}
```

### 3.2 Report Modal

```typescript
// components/ReportModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { submitReport } from '@/lib/api/reports';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  contentType?: string;
  contentId?: string;
  contentPreview?: string;
  onBlock: () => void;
}

const REPORT_REASONS = [
  { key: 'inappropriate_content', label: 'Inappropriate Content', description: 'Nudity, sexual content, or graphic images' },
  { key: 'harassment', label: 'Harassment or Bullying', description: 'Targeting someone with unwanted contact or abuse' },
  { key: 'spam', label: 'Spam', description: 'Unwanted promotional content or repeated posts' },
  { key: 'fake_profile', label: 'Fake Profile', description: 'Impersonating someone or using false information' },
  { key: 'underage', label: 'Underage User', description: 'User appears to be under 13 years old' },
  { key: 'hate_speech', label: 'Hate Speech', description: 'Content that attacks people based on race, religion, etc.' },
  { key: 'violence', label: 'Violence or Threats', description: 'Violent images or threats of harm' },
  { key: 'other', label: 'Other', description: 'Something else not covered above' },
];

export function ReportModal({
  visible,
  onClose,
  reportedUserId,
  contentType,
  contentId,
  contentPreview,
  onBlock,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select a reason for your report.');
      return;
    }

    setSubmitting(true);
    try {
      await submitReport({
        reportedUserId,
        reportType: (contentType as any) || 'user',
        reportReason: selectedReason as any,
        contentType,
        contentId,
        contentPreview,
        description: description.trim() || undefined,
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We will review this report as soon as possible.',
        [
          {
            text: 'Block User Too',
            onPress: onBlock,
          },
          {
            text: 'Done',
            onPress: onClose,
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Content</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.subtitle}>Why are you reporting this?</Text>

          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.key}
              style={[
                styles.reasonButton,
                selectedReason === reason.key && styles.reasonButtonSelected,
              ]}
              onPress={() => setSelectedReason(reason.key)}
            >
              <Text style={styles.reasonLabel}>{reason.label}</Text>
              <Text style={styles.reasonDescription}>{reason.description}</Text>
              {selectedReason === reason.key && (
                <View style={styles.checkmark}>
                  <Text>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            multiline
            numberOfLines={4}
            placeholder="Provide any additional context about this report..."
            value={description}
            onChangeText={setDescription}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  reasonButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  reasonDescription: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### 3.3 Blocked Users Management Screen

```typescript
// app/(tabs)/settings/blocked-users.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBlockedUsers, unblockUser, BlockedUser } from '@/lib/api/blocks';

export default function BlockedUsersScreen() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBlockedUsers = async () => {
    try {
      const users = await getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.blocked_profile.display_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await unblockUser(user.blocked_id);
              setBlockedUsers(blockedUsers.filter(u => u.id !== user.id));
              Alert.alert('Unblocked', `${user.blocked_profile.display_name} has been unblocked.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userCard}>
      <Image
        source={{ uri: item.blocked_profile.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.blocked_profile.display_name}</Text>
        <Text style={styles.blockedDate}>
          Blocked on {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item)}
      >
        <Text style={styles.unblockButtonText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Blocked Users</Text>
      <Text style={styles.subtitle}>
        Blocked users cannot see your profile, message you, or interact with your content.
      </Text>

      {blockedUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Blocked Users</Text>
          <Text style={styles.emptyText}>
            You haven't blocked anyone yet. Blocked users will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadBlockedUsers} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  blockedDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  unblockButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
```

### 3.4 Integration Points

Add report buttons throughout the app:

```typescript
// app/parks/[id].tsx - On park check-ins list
<ReportButton
  reportedUserId={checkIn.user_id}
  contentType="check_in"
  contentId={checkIn.id}
  contentPreview={`Check-in at ${park.name}`}
/>

// app/playdates/[id].tsx - On playdate details
<ReportButton
  reportedUserId={playdate.organizer_id}
  contentType="playdate"
  contentId={playdate.id}
  contentPreview={playdate.title}
/>

// app/profile/[id].tsx - On user profiles
<ReportButton
  reportedUserId={profile.id}
  contentType="profile"
  contentPreview={profile.display_name}
/>
```

---

## Phase 4: Behavior When Blocked

### 4.1 What Happens When User A Blocks User B

| Feature | Behavior |
|---------|----------|
| **Profile View** | User B cannot see User A's profile (404 or "User not found") |
| **Check-ins** | User B doesn't see User A's check-ins in park feeds |
| **Playdates** | User B doesn't see User A's playdates in lists |
| **Messages** | Existing messages hidden; new messages blocked |
| **Friends** | Any friendship is removed |
| **Search** | User B cannot find User A in search results |
| **Notifications** | User B won't receive notifications about User A's activity |

### 4.2 Database Functions

```sql
-- Function to filter out blocked content
CREATE OR REPLACE FUNCTION is_blocked_between(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$ LANGUAGE plpgsql;

-- Update check-ins view to filter blocked users
CREATE OR REPLACE VIEW public_check_ins AS
SELECT c.*
FROM check_ins c
JOIN profiles p ON c.user_id = p.id
WHERE c.checked_out_at IS NULL
  AND c.is_removed = false
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = c.user_id)
       OR (b.blocker_id = c.user_id AND b.blocked_id = auth.uid())
  );

-- Update playdates view
CREATE OR REPLACE VIEW visible_playdates AS
SELECT p.*
FROM play_dates p
WHERE p.status = 'scheduled'
  AND p.is_removed = false
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.organizer_id)
       OR (b.blocker_id = p.organizer_id AND b.blocked_id = auth.uid())
  );
```

---

## Phase 5: Admin Dashboard

### 5.1 Reports Queue Screen

```typescript
// app/admin/reports.tsx (Protected route - admin only)
export default function ReportsAdminScreen() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending');

  // UI for reviewing reports with actions:
  // - View content
  // - Remove content
  // - Dismiss report
  // - Suspend user
  // - View user history
}
```

### 5.2 Admin Actions

| Action | Description | Effect |
|--------|-------------|--------|
| **Remove Content** | Delete reported content | Content soft-deleted, user notified |
| **Warn User** | Send warning | Notification sent, strike recorded |
| **Suspend User** | Temporary ban | User cannot login for X days |
| **Ban User** | Permanent ban | Account disabled permanently |
| **Dismiss** | No action taken | Report marked as dismissed |

---

## Phase 6: Testing Checklist

### User Blocking
- [ ] User can block another user
- [ ] User can unblock
- [ ] Blocked user cannot see blocker's profile
- [ ] Blocked user's content hidden from feeds
- [ ] Blocking removes existing friendship
- [ ] Blocked users list displays correctly
- [ ] Cannot message blocked user

### Content Reporting
- [ ] Report button visible on all UGC
- [ ] Report modal opens correctly
- [ ] All report reasons selectable
- [ ] Description field optional but functional
- [ ] Success message displayed after submission
- [ ] Cannot report same content twice
- [ ] Admin receives notification

### Admin Functions
- [ ] Admin can view all reports
- [ ] Admin can remove content
- [ ] Admin can dismiss report
- [ ] Admin can suspend/ban users
- [ ] Actions are logged
- [ ] Users receive notifications of actions

---

## Summary

### Implementation Order

1. **Week 1:** Database schema, blocking API, basic UI
2. **Week 2:** Reporting API, report modal, admin dashboard
3. **Week 3:** Integration throughout app, testing
4. **Week 4:** Edge cases, notifications, polish

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `supabase/migrations/00018_blocking_reports.sql` | Database schema |
| `lib/api/blocks.ts` | Blocking API |
| `lib/api/reports.ts` | Reporting API |
| `lib/api/admin.ts` | Admin functions |
| `components/ReportButton.tsx` | Report trigger |
| `components/ReportModal.tsx` | Report UI |
| `app/settings/blocked-users.tsx` | Manage blocks |
| `app/admin/reports.tsx` | Admin dashboard |
| `supabase/functions/handle-block/index.ts` | Block side effects |
| `supabase/functions/notify-report/index.ts` | Admin notifications |

This implementation satisfies Apple's App Store requirements for user blocking and content moderation.

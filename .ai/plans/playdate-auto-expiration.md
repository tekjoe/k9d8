# Play Date Auto-Expiration Implementation Plan

## Overview

Play dates in k9d8 need to automatically transition from "scheduled" to "completed" status once their `ends_at` time has elapsed. This ensures accurate data, clean UI, and correct historical records.

**Current Status:** Play dates have a `status` field (`scheduled` | `cancelled` | `completed`) that must be automatically updated.

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Play dates automatically expire when `ends_at < now()` | Critical |
| R2 | Expired play dates change status to `completed` | Critical |
| R3 | Users can no longer RSVP to expired play dates | Critical |
| R4 | Expired play dates move to "Past" section in UI | High |
| R5 | Notifications sent when play date is about to start/expire | Medium |
| R6 | Historical data preserved for analytics | Medium |

### Business Rules

1. A play date expires exactly at its `ends_at` timestamp
2. Expired play dates cannot be edited (except by admin)
3. Users cannot join/RSVP to expired play dates
4. Organizer can still view and reference expired play dates
5. Participants can still see they attended (for history)

---

## Solution Comparison

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **PostgreSQL Trigger** | Immediate, reliable, no external deps | Runs on every relevant query | **Secondary** |
| **Supabase CRON Job** | Scheduled, batched processing | Slight delay possible | **Primary** |
| **Application-Level** | Simple to implement | Not guaranteed, relies on app usage | **Fallback** |
| **Edge Function Schedule** | Serverless, scalable | Requires external scheduler | **Alternative** |

**Recommended Hybrid Approach:**
1. **Primary:** Supabase pg_cron for batch expiration
2. **Secondary:** Application-level check on read
3. **Tertiary:** Database trigger for immediate updates

---

## Phase 1: Database Schema Updates

### 1.1 Verify Existing Schema

Ensure play_dates table has:

```sql
-- Verify existing columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'play_dates';

-- Expected columns:
-- id: uuid
-- organizer_id: uuid
-- park_id: uuid
-- title: text
-- description: text
-- starts_at: timestamp with time zone
-- ends_at: timestamp with time zone
-- max_dogs: integer
-- status: play_date_status (enum)
-- created_at: timestamp with time zone
-- updated_at: timestamp with time zone
```

### 1.2 Add Expiration Tracking

```sql
-- Add expiration tracking columns
ALTER TABLE play_dates 
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expiration_processed BOOLEAN DEFAULT false;

-- Add index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_play_dates_expiration 
ON play_dates(status, ends_at) 
WHERE status = 'scheduled';

-- Add index for finding expired but not processed
CREATE INDEX IF NOT EXISTS idx_play_dates_pending_expiration 
ON play_dates(status, ends_at, expiration_processed) 
WHERE status = 'scheduled' AND expiration_processed = false;
```

### 1.3 Create Expiration Log Table (Optional)

For audit trail and debugging:

```sql
CREATE TABLE play_date_expiration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_date_id UUID NOT NULL REFERENCES play_dates(id) ON DELETE CASCADE,
  old_status play_date_status NOT NULL,
  new_status play_date_status NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_expiration TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_by TEXT DEFAULT 'cron', -- 'cron', 'trigger', 'manual', 'api'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying play date history
CREATE INDEX idx_expiration_log_play_date ON play_date_expiration_log(play_date_id);
CREATE INDEX idx_expiration_log_created ON play_date_expiration_log(created_at);

-- Enable RLS
ALTER TABLE play_date_expiration_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Only admins can view expiration logs"
  ON play_date_expiration_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

---

## Phase 2: Database-Level Expiration (Primary)

### 2.1 Enable pg_cron Extension

```sql
-- Enable pg_cron extension (in Supabase Dashboard or via SQL)
-- Note: Requires superuser or specific permissions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify installation
SELECT * FROM cron.job;
```

**Note:** In Supabase, you may need to:
1. Go to Dashboard → Database → Extensions
2. Enable `pg_cron`
3. Or contact Supabase support for enabled projects

### 2.2 Create Expiration Function

```sql
-- Function to expire play dates
CREATE OR REPLACE FUNCTION expire_play_dates()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  play_date_record RECORD;
BEGIN
  -- Find all scheduled play dates that have ended
  FOR play_date_record IN 
    SELECT id, ends_at, status
    FROM play_dates
    WHERE status = 'scheduled'
      AND ends_at < now()
      AND (expiration_processed = false OR expiration_processed IS NULL)
    FOR UPDATE SKIP LOCKED  -- Prevent concurrent modifications
  LOOP
    -- Update play date status
    UPDATE play_dates
    SET 
      status = 'completed',
      expired_at = now(),
      expiration_processed = true,
      updated_at = now()
    WHERE id = play_date_record.id;
    
    -- Log the expiration
    INSERT INTO play_date_expiration_log (
      play_date_id,
      old_status,
      new_status,
      scheduled_end,
      actual_expiration,
      processed_by
    ) VALUES (
      play_date_record.id,
      play_date_record.status,
      'completed',
      play_date_record.ends_at,
      now(),
      'cron'
    );
    
    expired_count := expired_count + 1;
    
    -- Optional: Send notification to organizer
    -- This could also be done via trigger or edge function
    PERFORM pg_notify('play_date_expired', json_build_object(
      'play_date_id', play_date_record.id,
      'organizer_id', (SELECT organizer_id FROM play_dates WHERE id = play_date_record.id)
    )::text);
    
  END LOOP;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION expire_play_dates() TO postgres;
GRANT EXECUTE ON FUNCTION expire_play_dates() TO service_role;
```

### 2.3 Schedule CRON Job

```sql
-- Schedule expiration to run every minute
SELECT cron.schedule(
  'expire-play-dates',  -- Job name
  '* * * * *',          -- Every minute (cron expression)
  'SELECT expire_play_dates();'
);

-- Verify job is scheduled
SELECT * FROM cron.job WHERE jobname = 'expire-play-dates';

-- View job execution history
SELECT * FROM cron.job_run_details 
WHERE jobname = 'expire-play-dates'
ORDER BY start_time DESC
LIMIT 10;
```

**Alternative Schedule Options:**

| Schedule | Cron Expression | Use Case |
|----------|-----------------|----------|
| Every minute | `* * * * *` | Most responsive |
| Every 5 minutes | `*/5 * * * *` | Balanced |
| Every hour | `0 * * * *` | Batch processing |

### 2.4 Unschedule (If Needed)

```sql
-- Remove scheduled job
SELECT cron.unschedule('expire-play-dates');
```

---

## Phase 3: Real-Time Trigger (Secondary)

### 3.1 Create Trigger Function

For immediate expiration when play date is accessed:

```sql
-- Function to check and expire on access
CREATE OR REPLACE FUNCTION check_play_date_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- If play date is scheduled but has ended, expire it immediately
  IF NEW.status = 'scheduled' AND NEW.ends_at < now() THEN
    NEW.status := 'completed';
    NEW.expired_at := now();
    NEW.expiration_processed := true;
    NEW.updated_at := now();
    
    -- Log the expiration
    INSERT INTO play_date_expiration_log (
      play_date_id,
      old_status,
      new_status,
      scheduled_end,
      actual_expiration,
      processed_by
    ) VALUES (
      NEW.id,
      'scheduled',
      'completed',
      NEW.ends_at,
      now(),
      'trigger'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_check_expiration ON play_dates;
CREATE TRIGGER trigger_check_expiration
  BEFORE UPDATE ON play_dates
  FOR EACH ROW
  EXECUTE FUNCTION check_play_date_expiration();
```

**Note:** This trigger only runs on UPDATE, not SELECT. It's a safety net for when someone modifies a play date.

---

## Phase 4: Application-Level Checks

### 4.1 Utility Functions

```typescript
// lib/utils/playdates.ts

/**
 * Check if a play date has expired
 */
export function isPlayDateExpired(playDate: PlayDate): boolean {
  return new Date(playDate.ends_at) < new Date();
}

/**
 * Check if a play date is active (not expired, not cancelled)
 */
export function isPlayDateActive(playDate: PlayDate): boolean {
  return playDate.status === 'scheduled' && !isPlayDateExpired(playDate);
}

/**
 * Check if user can RSVP to a play date
 */
export function canRSVPToPlayDate(playDate: PlayDate): boolean {
  return isPlayDateActive(playDate);
}

/**
 * Check if user can edit a play date
 */
export function canEditPlayDate(playDate: PlayDate, userId: string, isAdmin: boolean = false): boolean {
  // Admin can always edit
  if (isAdmin) return true;
  
  // Organizer can edit only if not expired
  if (playDate.organizer_id !== userId) return false;
  
  return isPlayDateActive(playDate);
}

/**
 * Format expiration status for UI
 */
export function getPlayDateStatus(playDate: PlayDate): {
  label: string;
  color: string;
  icon: string;
} {
  if (playDate.status === 'cancelled') {
    return { label: 'Cancelled', color: '#EF4444', icon: 'close-circle' };
  }
  
  if (playDate.status === 'completed' || isPlayDateExpired(playDate)) {
    return { label: 'Completed', color: '#6B7280', icon: 'checkmark-circle' };
  }
  
  if (playDate.status === 'scheduled') {
    const isStartingSoon = new Date(playDate.starts_at).getTime() - Date.now() < 60 * 60 * 1000; // 1 hour
    if (isStartingSoon) {
      return { label: 'Starting Soon', color: '#F59E0B', icon: 'time' };
    }
    return { label: 'Scheduled', color: '#10B981', icon: 'calendar' };
  }
  
  return { label: 'Unknown', color: '#6B7280', icon: 'help-circle' };
}
```

### 4.2 API Layer Updates

```typescript
// lib/api/playdates.ts

import { supabase } from '@/lib/supabase';
import { isPlayDateExpired, canRSVPToPlayDate, canEditPlayDate } from '@/lib/utils/playdates';

/**
 * Get play date with real-time expiration check
 */
export async function getPlayDate(id: string): Promise<PlayDate | null> {
  const { data, error } = await supabase
    .from('play_dates')
    .select(`
      *,
      park:parks(*),
      organizer:profiles(*),
      rsvps:play_date_rsvps(*, dog:dogs(*))
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  
  // Application-level expiration check
  if (data && data.status === 'scheduled' && isPlayDateExpired(data)) {
    // Trigger server-side expiration
    await triggerExpirationCheck(id);
    
    // Return updated data
    return {
      ...data,
      status: 'completed',
      expired_at: new Date().toISOString(),
    };
  }
  
  return data;
}

/**
 * Trigger server-side expiration check
 */
async function triggerExpirationCheck(playDateId: string): Promise<void> {
  // Call edge function or RPC to force expiration
  await supabase.rpc('force_expire_play_date', {
    play_date_id: playDateId,
  });
}

/**
 * RSVP to play date with expiration check
 */
export async function rsvpToPlayDate(
  playDateId: string,
  dogId: string,
  status: 'going' | 'maybe' = 'going'
): Promise<void> {
  // First check if play date is still active
  const { data: playDate, error: fetchError } = await supabase
    .from('play_dates')
    .select('status, ends_at')
    .eq('id', playDateId)
    .single();

  if (fetchError) throw fetchError;
  
  if (!canRSVPToPlayDate(playDate)) {
    throw new Error('This play date has ended. You cannot RSVP anymore.');
  }

  // Proceed with RSVP
  const { error } = await supabase
    .from('play_date_rsvps')
    .upsert({
      play_date_id: playDateId,
      dog_id: dogId,
      status,
    }, {
      onConflict: 'play_date_id,dog_id',
    });

  if (error) throw error;
}

/**
 * Get active play dates only
 */
export async function getActivePlayDates(parkId?: string): Promise<PlayDate[]> {
  let query = supabase
    .from('play_dates')
    .select(`
      *,
      park:parks(*),
      organizer:profiles(*),
      rsvp_count:play_date_rsvps(count)
    `)
    .eq('status', 'scheduled')
    .gt('ends_at', new Date().toISOString()) // Only future/present
    .order('starts_at', { ascending: true });

  if (parkId) {
    query = query.eq('park_id', parkId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get past/completed play dates
 */
export async function getPastPlayDates(
  userId?: string,
  limit: number = 20
): Promise<PlayDate[]> {
  let query = supabase
    .from('play_dates')
    .select(`
      *,
      park:parks(*),
      organizer:profiles(*)
    `)
    .or('status.eq.completed,ends_at.lt.now()')
    .order('ends_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('organizer_id', userId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}
```

### 4.3 RPC Function for Force Expiration

```sql
-- Function to manually trigger expiration (for API calls)
CREATE OR REPLACE FUNCTION force_expire_play_date(play_date_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  play_date_record RECORD;
BEGIN
  SELECT * INTO play_date_record
  FROM play_dates
  WHERE id = play_date_id
    AND status = 'scheduled'
    AND ends_at < now();
    
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  UPDATE play_dates
  SET 
    status = 'completed',
    expired_at = now(),
    expiration_processed = true,
    updated_at = now()
  WHERE id = play_date_id;
  
  -- Log it
  INSERT INTO play_date_expiration_log (
    play_date_id,
    old_status,
    new_status,
    scheduled_end,
    actual_expiration,
    processed_by
  ) VALUES (
    play_date_id,
    'scheduled',
    'completed',
    play_date_record.ends_at,
    now(),
    'api'
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 5: UI Implementation

### 5.1 Play Date Card Component

```typescript
// components/PlayDateCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlayDate } from '@/types';
import { getPlayDateStatus, isPlayDateActive } from '@/lib/utils/playdates';

interface PlayDateCardProps {
  playDate: PlayDate;
  onPress: () => void;
  onRSVP?: () => void;
}

export function PlayDateCard({ playDate, onPress, onRSVP }: PlayDateCardProps) {
  const status = getPlayDateStatus(playDate);
  const isActive = isPlayDateActive(playDate);
  const isFull = playDate.rsvp_count >= playDate.max_dogs;
  
  return (
    <TouchableOpacity 
      style={[styles.container, !isActive && styles.expiredContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
        <Ionicons name={status.icon as any} size={14} color={status.color} />
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.label}
        </Text>
      </View>
      
      {/* Title */}
      <Text style={[styles.title, !isActive && styles.expiredText]}>
        {playDate.title}
      </Text>
      
      {/* Park Name */}
      <Text style={styles.parkName}>
        <Ionicons name="location" size={14} color="#666" />
        {' '}{playDate.park.name}
      </Text>
      
      {/* Time */}
      <Text style={styles.time}>
        <Ionicons name="time" size={14} color="#666" />
        {' '}{formatDateTime(playDate.starts_at)} - {formatTime(playDate.ends_at)}
      </Text>
      
      {/* RSVP Section - Only show for active play dates */}
      {isActive && (
        <View style={styles.rsvpSection}>
          <Text style={styles.rsvpCount}>
            {playDate.rsvp_count} / {playDate.max_dogs} dogs going
          </Text>
          
          {onRSVP && !isFull && (
            <TouchableOpacity style={styles.rsvpButton} onPress={onRSVP}>
              <Text style={styles.rsvpButtonText}>RSVP</Text>
            </TouchableOpacity>
          )}
          
          {isFull && (
            <Text style={styles.fullText}>Full</Text>
          )}
        </View>
      )}
      
      {/* Expired notice */}
      {!isActive && (
        <View style={styles.expiredNotice}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.expiredNoticeText}>
            This play date has ended
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expiredContainer: {
    opacity: 0.8,
    backgroundColor: '#f9f9f9',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  expiredText: {
    color: '#666',
  },
  parkName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  rsvpSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  rsvpCount: {
    fontSize: 14,
    color: '#666',
  },
  rsvpButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rsvpButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  fullText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  expiredNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  expiredNoticeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
});
```

### 5.2 Play Date Detail Screen

```typescript
// app/playdates/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PlayDateCard } from '@/components/PlayDateCard';
import { RSVPList } from '@/components/RSVPList';
import { getPlayDate, rsvpToPlayDate } from '@/lib/api/playdates';
import { isPlayDateActive, canEditPlayDate } from '@/lib/utils/playdates';
import { useAuth } from '@/hooks/useAuth';

export default function PlayDateDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [playDate, setPlayDate] = useState<PlayDate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayDate();
  }, [id]);

  const loadPlayDate = async () => {
    try {
      const data = await getPlayDate(id as string);
      setPlayDate(data);
    } catch (error) {
      console.error('Failed to load play date:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (dogId: string) => {
    if (!playDate) return;
    
    // Check if still active
    if (!isPlayDateActive(playDate)) {
      Alert.alert(
        'Play Date Ended',
        'This play date has already ended. You can no longer RSVP.'
      );
      return;
    }

    try {
      await rsvpToPlayDate(playDate.id, dogId);
      Alert.alert('Success', 'You have RSVP\'d to this play date!');
      loadPlayDate(); // Refresh data
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to RSVP');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!playDate) {
    return <NotFoundScreen />;
  }

  const isActive = isPlayDateActive(playDate);
  const canEdit = canEditPlayDate(playDate, user?.id);

  return (
    <ScrollView style={styles.container}>
      <PlayDateCard 
        playDate={playDate} 
        onPress={() => {}}
      />
      
      {/* Description */}
      {playDate.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{playDate.description}</Text>
        </View>
      )}
      
      {/* RSVPs - Show for all, but only active can add */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Who's Going {isActive ? '' : '(Final)'}
        </Text>
        <RSVPList 
          rsvps={playDate.rsvps}
          onRSVP={isActive ? handleRSVP : undefined}
          maxDogs={playDate.max_dogs}
        />
      </View>
      
      {/* Edit Button - Only for organizer and only if active */}
      {canEdit && (
        <EditPlayDateButton playDateId={playDate.id} />
      )}
      
      {/* Expired Message */}
      {!isActive && (
        <View style={styles.expiredBanner}>
          <Text style={styles.expiredBannerText}>
            This play date has ended and is now in your history.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  expiredBanner: {
    backgroundColor: '#F3F4F6',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6B7280',
  },
  expiredBannerText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
```

### 5.3 Tab Navigation for Active/Past

```typescript
// app/(tabs)/playdates.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { PlayDateCard } from '@/components/PlayDateCard';
import { getActivePlayDates, getPastPlayDates } from '@/lib/api/playdates';

export default function PlayDatesScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [playDates, setPlayDates] = useState<PlayDate[]>([]);

  useEffect(() => {
    if (activeTab === 'upcoming') {
      loadActivePlayDates();
    } else {
      loadPastPlayDates();
    }
  }, [activeTab]);

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Play Date List */}
      <FlatList
        data={playDates}
        renderItem={({ item }) => (
          <PlayDateCard
            playDate={item}
            onPress={() => router.push(`/playdates/${item.id}`)}
            onRSVP={activeTab === 'upcoming' ? () => handleRSVP(item) : undefined}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState 
            message={
              activeTab === 'upcoming' 
                ? "No upcoming play dates. Create one!" 
                : "No past play dates yet."
            }
          />
        }
      />
    </View>
  );
}
```

---

## Phase 6: Real-Time Updates

### 6.1 Supabase Realtime Subscription

```typescript
// hooks/usePlayDateExpiration.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function usePlayDateExpiration(onExpire?: (playDateId: string) => void) {
  useEffect(() => {
    // Listen for expiration notifications
    const subscription = supabase
      .channel('play_date_expirations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'play_dates',
          filter: 'status=eq.completed',
        },
        (payload) => {
          console.log('Play date expired:', payload.new.id);
          onExpire?.(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [onExpire]);
}

// Usage in component
function PlayDateScreen({ playDateId }: { playDateId: string }) {
  const [playDate, setPlayDate] = useState<PlayDate | null>(null);

  usePlayDateExpiration((expiredId) => {
    if (expiredId === playDateId) {
      // Refresh the play date data
      refreshPlayDate();
      
      // Show notification to user
      Alert.alert(
        'Play Date Ended',
        'This play date has just ended and moved to your history.'
      );
    }
  });

  // ... rest of component
}
```

---

## Phase 7: Testing Strategy

### 7.1 Unit Tests

```typescript
// __tests__/utils/playdates.test.ts
import { isPlayDateExpired, canRSVPToPlayDate, canEditPlayDate } from '@/lib/utils/playdates';

describe('Play Date Utils', () => {
  describe('isPlayDateExpired', () => {
    it('returns true for past play dates', () => {
      const playDate = {
        ends_at: new Date(Date.now() - 1000).toISOString(),
      } as PlayDate;
      
      expect(isPlayDateExpired(playDate)).toBe(true);
    });

    it('returns false for future play dates', () => {
      const playDate = {
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      } as PlayDate;
      
      expect(isPlayDateExpired(playDate)).toBe(false);
    });
  });

  describe('canRSVPToPlayDate', () => {
    it('returns true for active scheduled play dates', () => {
      const playDate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      } as PlayDate;
      
      expect(canRSVPToPlayDate(playDate)).toBe(true);
    });

    it('returns false for expired play dates', () => {
      const playDate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() - 1000).toISOString(),
      } as PlayDate;
      
      expect(canRSVPToPlayDate(playDate)).toBe(false);
    });

    it('returns false for cancelled play dates', () => {
      const playDate = {
        status: 'cancelled',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      } as PlayDate;
      
      expect(canRSVPToPlayDate(playDate)).toBe(false);
    });
  });
});
```

### 7.2 Integration Tests

```typescript
// __tests__/api/playdates.test.ts
import { getPlayDate, rsvpToPlayDate } from '@/lib/api/playdates';

describe('Play Date API', () => {
  describe('getPlayDate', () => {
    it('auto-expires play date when ends_at is in the past', async () => {
      // Create a play date that ended 1 hour ago
      const expiredPlayDate = await createTestPlayDate({
        ends_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'scheduled',
      });

      const result = await getPlayDate(expiredPlayDate.id);

      expect(result?.status).toBe('completed');
    });
  });

  describe('rsvpToPlayDate', () => {
    it('throws error when trying to RSVP to expired play date', async () => {
      const expiredPlayDate = await createTestPlayDate({
        ends_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'scheduled',
      });

      await expect(
        rsvpToPlayDate(expiredPlayDate.id, 'dog-id')
      ).rejects.toThrow('This play date has ended');
    });
  });
});
```

### 7.3 Manual Testing Checklist

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Auto-expiration | Create play date ending in 1 min, wait | Status changes to completed |
| RSVP prevention | Try to RSVP to expired play date | Error message shown |
| UI update | View expired play date | "Ended" badge shown, no RSVP button |
| Tab navigation | Switch to "Past" tab | Expired play dates appear |
| Edit prevention | Try to edit expired play date as organizer | Edit button hidden or error |
| Cron job | Verify cron job runs every minute | Expiration log entries created |
| Real-time update | Have play date expire while viewing | UI updates automatically |

---

## Phase 8: Monitoring & Alerts

### 8.1 Expiration Metrics

```sql
-- View recent expirations
SELECT 
  date_trunc('hour', created_at) as hour,
  processed_by,
  COUNT(*) as expiration_count
FROM play_date_expiration_log
WHERE created_at > now() - interval '24 hours'
GROUP BY 1, 2
ORDER BY 1 DESC;

-- Check for stuck play dates (scheduled but ended > 5 minutes ago)
SELECT 
  id,
  title,
  ends_at,
  now() - ends_at as overdue_by
FROM play_dates
WHERE status = 'scheduled'
  AND ends_at < now() - interval '5 minutes'
  AND (expiration_processed = false OR expiration_processed IS NULL);
```

### 8.2 Alert Configuration

Set up alerts for:
1. **Stuck Play Dates:** If any play date is scheduled but ended > 10 minutes ago
2. **High Failure Rate:** If cron job fails multiple times
3. **Large Backlog:** If > 100 play dates expire at once (unusual)

```sql
-- Alert query (run every 10 minutes)
SELECT COUNT(*) as stuck_count
FROM play_dates
WHERE status = 'scheduled'
  AND ends_at < now() - interval '10 minutes'
  AND (expiration_processed = false OR expiration_processed IS NULL);
```

---

## Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1** | 1 day | Database schema updates |
| **Phase 2** | 1 day | CRON job and database functions |
| **Phase 3** | 0.5 day | Trigger implementation |
| **Phase 4** | 1 day | Application-level checks and utilities |
| **Phase 5** | 2 days | UI updates and components |
| **Phase 6** | 0.5 day | Real-time subscriptions |
| **Phase 7** | 1 day | Testing |
| **Phase 8** | 0.5 day | Monitoring setup |

**Total: ~7 days**

---

## Summary

### Three-Layer Approach

1. **Database CRON (Primary):** Runs every minute to batch-expire play dates
2. **Application Check (Secondary):** Validates on read operations
3. **Realtime Updates (UX):** Notifies users when play dates expire in real-time

### Key Features

- ✅ Automatic expiration at `ends_at` time
- ✅ No RSVP possible after expiration
- ✅ Clear UI distinction for expired play dates
- ✅ Historical record preservation
- ✅ Audit trail via expiration log
- ✅ Real-time updates for active users

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `supabase/migrations/00019_playdate_expiration.sql` | Database schema and functions |
| `lib/utils/playdates.ts` | Expiration utility functions |
| `lib/api/playdates.ts` | API layer with expiration checks |
| `components/PlayDateCard.tsx` | Updated card with expiration UI |
| `app/playdates/[id].tsx` | Detail screen with expiration handling |
| `hooks/usePlayDateExpiration.ts` | Real-time expiration subscription |

-- Play Date Auto-Expiration Implementation
-- Phase 1: Database Schema Updates

-- ============================================
-- 1.1 Add expiration tracking columns to play_dates
-- ============================================
ALTER TABLE play_dates 
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expiration_processed BOOLEAN DEFAULT false;

-- ============================================
-- 1.2 Create indexes for efficient expiration queries
-- ============================================
-- Index for finding scheduled play dates that need expiration check
CREATE INDEX IF NOT EXISTS idx_play_dates_expiration 
ON play_dates(status, ends_at) 
WHERE status = 'scheduled';

-- Index for finding expired but not processed play dates
CREATE INDEX IF NOT EXISTS idx_play_dates_pending_expiration 
ON play_dates(status, ends_at, expiration_processed) 
WHERE status = 'scheduled' AND expiration_processed = false;

-- ============================================
-- 1.3 Create expiration log table for audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS play_date_expiration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_date_id UUID NOT NULL REFERENCES play_dates(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_expiration TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_by TEXT DEFAULT 'cron', -- 'cron', 'trigger', 'manual', 'api'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying play date expiration history
CREATE INDEX IF NOT EXISTS idx_expiration_log_play_date 
ON play_date_expiration_log(play_date_id);

CREATE INDEX IF NOT EXISTS idx_expiration_log_created 
ON play_date_expiration_log(created_at);

-- Add is_admin column to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Enable RLS on expiration log
ALTER TABLE play_date_expiration_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
DROP POLICY IF EXISTS "Only admins can view expiration logs" ON play_date_expiration_log;
CREATE POLICY "Only admins can view expiration logs"
  ON play_date_expiration_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 1.4 Enable pg_cron extension for scheduled jobs
-- ============================================
-- Note: In Supabase, you may need to enable this via Dashboard
-- Database → Extensions → pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- Phase 2: Database Functions
-- ============================================

-- Function to expire play dates (called by CRON job)
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
    
    -- Send notification to organizer
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
GRANT EXECUTE ON FUNCTION expire_play_dates() TO authenticated;

-- ============================================
-- Phase 3: Trigger Function (Secondary)
-- ============================================

-- Function to check and expire on access/update
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

-- Create trigger for expiration check on update
DROP TRIGGER IF EXISTS trigger_check_expiration ON play_dates;
CREATE TRIGGER trigger_check_expiration
  BEFORE UPDATE ON play_dates
  FOR EACH ROW
  EXECUTE FUNCTION check_play_date_expiration();

-- ============================================
-- Phase 4: RPC Function for Force Expiration
-- ============================================

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

GRANT EXECUTE ON FUNCTION force_expire_play_date(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION force_expire_play_date(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION force_expire_play_date(UUID) TO authenticated;

-- ============================================
-- Phase 5: Schedule CRON Job
-- ============================================

-- Unschedule existing job if present (ignore error if not exists)
DO $$
BEGIN
  PERFORM cron.unschedule('expire-play-dates');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, continue
    NULL;
END $$;

-- Schedule expiration to run every minute
-- Note: This may fail if pg_cron is not enabled. Enable it in Supabase Dashboard:
-- Database → Extensions → pg_cron (toggle on)
DO $$
BEGIN
  PERFORM cron.schedule(
    'expire-play-dates',  -- Job name
    '* * * * *',          -- Every minute (cron expression)
    'SELECT expire_play_dates();'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job. Ensure pg_cron extension is enabled.';
END $$;

-- ============================================
-- Verification Queries (run these to verify setup)
-- ============================================

-- Check if job is scheduled
-- SELECT * FROM cron.job WHERE jobname = 'expire-play-dates';

-- View job execution history
-- SELECT * FROM cron.job_run_details 
-- WHERE jobname = 'expire-play-dates'
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Check for stuck play dates (scheduled but ended > 5 minutes ago)
-- SELECT 
--   id,
--   title,
--   ends_at,
--   now() - ends_at as overdue_by
-- FROM play_dates
-- WHERE status = 'scheduled'
--   AND ends_at < now() - interval '5 minutes'
--   AND (expiration_processed = false OR expiration_processed IS NULL);

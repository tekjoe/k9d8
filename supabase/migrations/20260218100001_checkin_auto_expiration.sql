-- Check-In Auto-Expiration
-- Automatically checks out users who have been checked in for more than 2 hours

-- ============================================
-- 1. Create expiration function
-- ============================================
CREATE OR REPLACE FUNCTION expire_check_ins(max_duration_hours INTEGER DEFAULT 2)
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
BEGIN
  UPDATE check_ins
  SET checked_out_at = now()
  WHERE checked_out_at IS NULL
    AND checked_in_at < now() - (max_duration_hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION expire_check_ins(INTEGER) TO postgres;
GRANT EXECUTE ON FUNCTION expire_check_ins(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION expire_check_ins(INTEGER) TO authenticated;

-- ============================================
-- 2. Schedule CRON Job (every minute, same as play dates)
-- ============================================
DO $$
BEGIN
  PERFORM cron.unschedule('expire-check-ins');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.schedule(
    'expire-check-ins',
    '* * * * *',
    'SELECT expire_check_ins();'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job. Ensure pg_cron extension is enabled.';
END $$;

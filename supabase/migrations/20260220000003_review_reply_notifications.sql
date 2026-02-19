-- Extend notification type to include review_reply
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('friend_request', 'playdate_invite', 'message', 'check_in', 'friend_accepted', 'playdate_reminder', 'system', 'review_reply'));

-- Trigger: notify parent review author when someone replies
CREATE OR REPLACE FUNCTION notify_review_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_replier_name TEXT;
  v_parent_user_id UUID;
  v_park_id UUID;
  v_park_name TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, park_id INTO v_parent_user_id, v_park_id
  FROM park_reviews WHERE id = NEW.parent_id;

  -- Don't notify yourself
  IF v_parent_user_id IS NULL OR v_parent_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_replier_name
  FROM profiles WHERE id = NEW.user_id;

  SELECT name INTO v_park_name
  FROM parks WHERE id = v_park_id;

  PERFORM create_notification(
    v_parent_user_id,
    'review_reply',
    'Reply to Your Review',
    COALESCE(v_replier_name, 'Someone') || ' replied to your review at ' || COALESCE(v_park_name, 'a park'),
    NEW.user_id,
    jsonb_build_object('park_id', v_park_id, 'review_id', NEW.parent_id, 'reply_id', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER review_reply_notification
  AFTER INSERT ON park_reviews
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION notify_review_reply();

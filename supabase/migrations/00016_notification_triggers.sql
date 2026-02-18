-- Trigger: Friend request received
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
DECLARE
  v_requester_name TEXT;
BEGIN
  -- Get requester's name
  SELECT display_name INTO v_requester_name
  FROM profiles
  WHERE id = NEW.requester_id;
  
  -- Create notification for the addressee (recipient)
  PERFORM create_notification(
    NEW.addressee_id,
    'friend_request',
    'New Friend Request',
    COALESCE(v_requester_name, 'Someone') || ' sent you a friend request',
    NEW.requester_id,
    jsonb_build_object('friendship_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER friend_request_notification
  AFTER INSERT ON friendships
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_friend_request();
-- Trigger: Friend request accepted
CREATE OR REPLACE FUNCTION notify_friend_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_acceptor_name TEXT;
BEGIN
  -- Only notify when status changes from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Get the acceptor's name (the one who accepted)
    SELECT display_name INTO v_acceptor_name
    FROM profiles
    WHERE id = NEW.addressee_id;
    
    -- Create notification for the original requester
    PERFORM create_notification(
      NEW.requester_id,
      'friend_accepted',
      'Friend Request Accepted',
      COALESCE(v_acceptor_name, 'Someone') || ' accepted your friend request',
      NEW.addressee_id,
      jsonb_build_object('friendship_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER friend_accepted_notification
  AFTER UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_accepted();
-- Trigger: New message received
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_conversation_id UUID;
  v_recipient_id UUID;
BEGIN
  -- Get conversation ID and find other participants
  v_conversation_id := NEW.conversation_id;
  
  -- Get sender's name
  SELECT display_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Create notifications for all other participants in the conversation
  FOR v_recipient_id IN
    SELECT user_id 
    FROM conversation_participants 
    WHERE conversation_id = v_conversation_id 
      AND user_id != NEW.sender_id
  LOOP
    -- Check if there's already an unread message notification for this conversation
    IF NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = v_recipient_id 
        AND type = 'message'
        AND read = false
        AND data->>'conversation_id' = v_conversation_id::TEXT
    ) THEN
      PERFORM create_notification(
        v_recipient_id,
        'message',
        'New Message',
        COALESCE(v_sender_name, 'Someone') || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
        NEW.sender_id,
        jsonb_build_object('conversation_id', v_conversation_id)
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER new_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();
-- Trigger: Playdate RSVP/invite
CREATE OR REPLACE FUNCTION notify_playdate_invite()
RETURNS TRIGGER AS $$
DECLARE
  v_organizer_name TEXT;
  v_playdate_title TEXT;
  v_park_name TEXT;
BEGIN
  -- Get organizer's name and playdate info
  SELECT 
    p.display_name,
    pd.title,
    parks.name
  INTO v_organizer_name, v_playdate_title, v_park_name
  FROM profiles p
  JOIN play_dates pd ON pd.organizer_id = p.id
  LEFT JOIN parks ON parks.id = pd.park_id
  WHERE pd.id = NEW.play_date_id
  LIMIT 1;
  
  -- Create notification for the RSVPing user
  PERFORM create_notification(
    NEW.user_id,
    'playdate_invite',
    'Playdate Invitation',
    'You''re invited to "' || COALESCE(v_playdate_title, 'a playdate') || '"' || COALESCE(' at ' || v_park_name, ''),
    (SELECT organizer_id FROM play_dates WHERE id = NEW.play_date_id),
    jsonb_build_object('playdate_id', NEW.play_date_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Note: We only create playdate invites when explicitly invited, 
-- not when a user RSVPs themselves. This trigger is for future use
-- when we implement explicit playdate invitations.

-- Trigger: Friend check-in at park
CREATE OR REPLACE FUNCTION notify_friend_checkin()
RETURNS TRIGGER AS $$
DECLARE
  v_checker_name TEXT;
  v_park_name TEXT;
  v_friend_id UUID;
BEGIN
  -- Get check-in person's name and park name
  SELECT p.display_name, parks.name
  INTO v_checker_name, v_park_name
  FROM profiles p
  LEFT JOIN parks ON parks.id = NEW.park_id
  WHERE p.id = NEW.user_id;
  
  -- Create notification for each accepted friend
  FOR v_friend_id IN
    SELECT 
      CASE 
        WHEN f.requester_id = NEW.user_id THEN f.addressee_id
        ELSE f.requester_id
      END
    FROM friendships f
    WHERE f.status = 'accepted'
      AND (f.requester_id = NEW.user_id OR f.addressee_id = NEW.user_id)
  LOOP
    -- Don't notify if they already have a recent check-in notification for this user
    IF NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = v_friend_id 
        AND type = 'check_in'
        AND actor_id = NEW.user_id
        AND created_at > NOW() - INTERVAL '1 hour'
    ) THEN
      PERFORM create_notification(
        v_friend_id,
        'check_in',
        'Friend Checked In',
        COALESCE(v_checker_name, 'A friend') || ' is at ' || COALESCE(v_park_name, 'a park'),
        NEW.user_id,
        jsonb_build_object('park_id', NEW.park_id, 'check_in_id', NEW.id)
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER friend_checkin_notification
  AFTER INSERT ON check_ins
  FOR EACH ROW
  WHEN (NEW.checked_out_at IS NULL)
  EXECUTE FUNCTION notify_friend_checkin();

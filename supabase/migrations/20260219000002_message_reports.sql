-- Message reports table for chat moderation.
-- Users can report messages in conversations they belong to (not their own messages).

CREATE TABLE message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'inappropriate', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_report UNIQUE (reporter_id, message_id)
);

CREATE INDEX idx_message_reports_reporter ON message_reports(reporter_id);
CREATE INDEX idx_message_reports_message ON message_reports(message_id);
CREATE INDEX idx_message_reports_status ON message_reports(status);

-- RLS
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Users can report messages in conversations they belong to (not their own messages)
CREATE POLICY "Users can report messages in own conversations"
  ON message_reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp
        ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reports.message_id
        AND cp.user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_reports.message_id
        AND m.sender_id = auth.uid()
    )
  );

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON message_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Auto-update updated_at
CREATE TRIGGER set_message_reports_updated_at
  BEFORE UPDATE ON message_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 检查并创建user_preferences表（如果不存在）
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  email VARCHAR(255),
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  telegram_id VARCHAR(255),
  telegram_notifications_enabled BOOLEAN DEFAULT FALSE,
  discord_webhook VARCHAR(255),
  discord_notifications_enabled BOOLEAN DEFAULT FALSE,
  web_push_enabled BOOLEAN DEFAULT TRUE,
  phone_number VARCHAR(50),
  phone_notifications_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  notification_frequency VARCHAR(50) DEFAULT 'realtime',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 如果表已存在，确保添加电话相关列
ALTER TABLE IF EXISTS user_preferences 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS phone_notifications_enabled BOOLEAN DEFAULT FALSE;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 设置行级安全策略
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能查看和修改自己的偏好设置
DROP POLICY IF EXISTS user_preferences_select_policy ON user_preferences;
CREATE POLICY user_preferences_select_policy ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_preferences_insert_policy ON user_preferences;
CREATE POLICY user_preferences_insert_policy ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_preferences_update_policy ON user_preferences;
CREATE POLICY user_preferences_update_policy ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建触发器函数，自动更新updated_at字段
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器，在记录更新时更新时间戳
DROP TRIGGER IF EXISTS set_timestamp ON user_preferences;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 
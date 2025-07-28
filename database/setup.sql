-- CSRF保護システム用データベースセットアップ
-- 実行順序: 1. テーブル作成 → 2. インデックス → 3. RLS → 4. 関数

-- 1. テーブル作成
CREATE TABLE csrf_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  client_ip INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE admin_auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  session_id VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  ip_address INET,
  success BOOLEAN NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. インデックス作成
CREATE INDEX idx_csrf_sessions_session_id ON csrf_sessions(session_id);
CREATE INDEX idx_csrf_sessions_expires_at ON csrf_sessions(expires_at);
CREATE INDEX idx_csrf_sessions_client_ip ON csrf_sessions(client_ip);

CREATE INDEX idx_admin_auth_logs_session_id ON admin_auth_logs(session_id);
CREATE INDEX idx_admin_auth_logs_user_id ON admin_auth_logs(user_id);
CREATE INDEX idx_admin_auth_logs_created_at ON admin_auth_logs(created_at DESC);
CREATE INDEX idx_admin_auth_logs_ip_address ON admin_auth_logs(ip_address);

CREATE INDEX idx_sms_auth_logs_phone_number ON sms_auth_logs(phone_number);
CREATE INDEX idx_sms_auth_logs_session_id ON sms_auth_logs(session_id);
CREATE INDEX idx_sms_auth_logs_created_at ON sms_auth_logs(created_at DESC);

-- 3. RLS有効化
ALTER TABLE csrf_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_auth_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLSポリシー作成
CREATE POLICY "System access only" ON csrf_sessions
  FOR ALL USING (false);

CREATE POLICY "Admin only access" ON admin_auth_logs
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "System admin only" ON sms_auth_logs
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- 5. クリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_expired_csrf_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM csrf_sessions 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_auth_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_auth_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM sms_auth_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
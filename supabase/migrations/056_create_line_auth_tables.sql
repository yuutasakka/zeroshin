-- Zero神 LINE認証システム用テーブル作成
-- 実行順序: 1. テーブル作成 → 2. インデックス → 3. RLS → 4. 関数

-- 1. LINE認証ユーザーテーブル
CREATE TABLE IF NOT EXISTS line_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  picture_url TEXT,
  status_message TEXT,
  first_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LINE認証状態管理テーブル（CSRF対策）
CREATE TABLE IF NOT EXISTS line_auth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state VARCHAR(255) UNIQUE NOT NULL,
  nonce VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- 3. LINE認証ログテーブル
CREATE TABLE IF NOT EXISTS line_auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. インデックス作成
CREATE INDEX idx_line_users_line_user_id ON line_users(line_user_id);
CREATE INDEX idx_line_users_last_login ON line_users(last_login DESC);
CREATE INDEX idx_line_users_created_at ON line_users(created_at DESC);

CREATE INDEX idx_line_auth_states_state ON line_auth_states(state);
CREATE INDEX idx_line_auth_states_expires_at ON line_auth_states(expires_at);

CREATE INDEX idx_line_auth_logs_line_user_id ON line_auth_logs(line_user_id);
CREATE INDEX idx_line_auth_logs_created_at ON line_auth_logs(created_at DESC);
CREATE INDEX idx_line_auth_logs_action ON line_auth_logs(action);
CREATE INDEX idx_line_auth_logs_success ON line_auth_logs(success);

-- 5. RLS有効化
ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_auth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_auth_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLSポリシー作成
-- LINE認証ユーザーは自分の情報のみアクセス可能
CREATE POLICY "Users can view own profile" ON line_users
  FOR SELECT USING (line_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own profile" ON line_users
  FOR UPDATE USING (line_user_id = current_setting('app.current_user_id', true));

-- 認証状態は誰でも作成可能（認証フロー用）
CREATE POLICY "Anyone can create auth states" ON line_auth_states
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can manage auth states" ON line_auth_states
  FOR ALL USING (true);

-- 認証ログは管理者のみ閲覧可能
CREATE POLICY "Admin only access to auth logs" ON line_auth_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admin_id = current_setting('app.current_admin_id', true)
    )
  );

CREATE POLICY "System can insert auth logs" ON line_auth_logs
  FOR INSERT WITH CHECK (true);

-- 7. クリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_expired_line_auth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM line_auth_states 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_line_auth_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM line_auth_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 8. トリガー関数（updated_at自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER update_line_users_updated_at
  BEFORE UPDATE ON line_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. 初期データ（テスト用）
INSERT INTO line_users (line_user_id, display_name, picture_url) 
VALUES ('test_user_001', 'テストユーザー', null)
ON CONFLICT (line_user_id) DO NOTHING;
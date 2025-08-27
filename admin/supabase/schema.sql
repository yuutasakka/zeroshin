-- ========================================
-- Zeroshin Admin - Database Schema Update
-- Supabaseデータベーススキーマ設定スクリプト
-- ========================================

-- 1. 電話番号認証テーブル (既存のphone_verificationsテーブル)
CREATE TABLE IF NOT EXISTS phone_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verification_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '10 minutes')
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_verified ON phone_verifications(verified);

-- 2. システム設定テーブル
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    max_users_per_day INTEGER DEFAULT 1000,
    sms_enabled BOOLEAN DEFAULT TRUE,
    debug_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT single_settings_row CHECK (id = 1)
);

-- 初期データ挿入
INSERT INTO system_settings (id, maintenance_mode, max_users_per_day, sms_enabled, debug_mode)
VALUES (1, FALSE, 1000, TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. 管理者認証情報テーブル
CREATE TABLE IF NOT EXISTS admin_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    backup_code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    requires_password_change BOOLEAN DEFAULT FALSE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_admin_credentials_username ON admin_credentials(username);
CREATE INDEX IF NOT EXISTS idx_admin_credentials_active ON admin_credentials(is_active);

-- 4. 管理者ログイン試行履歴
CREATE TABLE IF NOT EXISTS admin_login_attempts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_username ON admin_login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_created_at ON admin_login_attempts(created_at);

-- 5. 監査ログテーブル
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    username VARCHAR(255),
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 6. 診断セッションテーブル
CREATE TABLE IF NOT EXISTS diagnosis_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    diagnosis_answers JSONB,
    sms_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'pending',
    verification_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_phone ON diagnosis_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_verified ON diagnosis_sessions(sms_verified);
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_session_id ON diagnosis_sessions(session_id);

-- 7. 管理者登録申請テーブル
CREATE TABLE IF NOT EXISTS admin_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    department VARCHAR(255),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    approved_by UUID REFERENCES admin_credentials(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_admin_registrations_email ON admin_registrations(email);
CREATE INDEX IF NOT EXISTS idx_admin_registrations_status ON admin_registrations(status);

-- 8. 管理者メール認証テーブル
CREATE TABLE IF NOT EXISTS admin_email_verification (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    full_name VARCHAR(255),
    department VARCHAR(255),
    reason TEXT,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_admin_email_verification_token ON admin_email_verification(verification_token);
CREATE INDEX IF NOT EXISTS idx_admin_email_verification_email ON admin_email_verification(email);

-- 9. 管理者SMS認証テーブル
CREATE TABLE IF NOT EXISTS admin_sms_verification (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admin_credentials(id) ON DELETE CASCADE,
    phone_number VARCHAR(15) NOT NULL,
    sms_code VARCHAR(6) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_admin_sms_verification_admin_id ON admin_sms_verification(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sms_verification_phone ON admin_sms_verification(phone_number);

-- 10. 承認申請履歴テーブル
CREATE TABLE IF NOT EXISTS admin_approval_history (
    id SERIAL PRIMARY KEY,
    pending_approval_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected')),
    performed_by INTEGER REFERENCES admin_credentials(id),
    comment TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_admin_approval_history_approval_id ON admin_approval_history(pending_approval_id);
CREATE INDEX IF NOT EXISTS idx_admin_approval_history_action ON admin_approval_history(action);

-- 11. 承認待ち管理者テーブル
CREATE TABLE IF NOT EXISTS pending_admin_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    full_name VARCHAR(255),
    department VARCHAR(255),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by VARCHAR(255) NOT NULL,
    approved_by INTEGER REFERENCES admin_credentials(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_pending_admin_approvals_email ON pending_admin_approvals(email);
CREATE INDEX IF NOT EXISTS idx_pending_admin_approvals_status ON pending_admin_approvals(status);

-- 12. パスワード履歴テーブル
CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

-- ========================================
-- 更新日時の自動更新トリガー関数
-- ========================================

-- 更新日時を自動で設定する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- 各テーブルにupdated_atトリガーを設定
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'phone_verifications',
        'system_settings',
        'admin_credentials',
        'diagnosis_sessions',
        'admin_registrations',
        'admin_email_verification',
        'admin_sms_verification',
        'pending_admin_approvals'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END;
$$;

-- ========================================
-- データベース最適化
-- ========================================

-- 古いデータの自動削除関数
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- 30日以上古い電話番号認証データを削除
    DELETE FROM phone_verifications 
    WHERE created_at < now() - INTERVAL '30 days';
    
    -- 7日以上古い未認証メール認証データを削除
    DELETE FROM admin_email_verification 
    WHERE created_at < now() - INTERVAL '7 days' 
    AND is_verified = FALSE;
    
    -- 24時間以上古いSMS認証データを削除
    DELETE FROM admin_sms_verification 
    WHERE created_at < now() - INTERVAL '24 hours';
    
    -- 90日以上古いログイン試行履歴を削除
    DELETE FROM admin_login_attempts 
    WHERE created_at < now() - INTERVAL '90 days';
    
    -- 1年以上古い監査ログを削除
    DELETE FROM audit_logs 
    WHERE created_at < now() - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;

-- 定期クリーンアップ用のスケジュール関数（手動実行）
-- 実行: SELECT cleanup_old_data();

-- ========================================
-- セキュリティ設定完了メッセージ
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Zeroshin Admin Database Schema Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Run RLS policies: supabase/rls_policies.sql';
    RAISE NOTICE '2. Create initial admin user';
    RAISE NOTICE '3. Configure environment variables';
    RAISE NOTICE '========================================';
END;
$$;
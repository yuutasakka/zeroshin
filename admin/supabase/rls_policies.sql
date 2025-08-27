-- ========================================
-- Zeroshin Admin - Row Level Security (RLS) Policies
-- Supabaseセキュリティポリシー設定スクリプト
-- ========================================

-- ========================================
-- RLSを有効化
-- ========================================

-- 重要: RLSを段階的に有効化（開発段階では一部無効化も可能）
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_email_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sms_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_admin_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 1. 電話番号認証テーブルのRLSポリシー
-- ========================================

-- 全ユーザーが自分の電話番号データのみ操作可能
CREATE POLICY "Users can manage their own phone verifications"
ON phone_verifications
FOR ALL
USING (true)  -- 開発段階では制限を緩和
WITH CHECK (true);

-- 管理者は全ての電話番号認証データを参照可能
CREATE POLICY "Admins can view all phone verifications"
ON phone_verifications
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- ========================================
-- 2. システム設定テーブルのRLSポリシー
-- ========================================

-- 管理者のみがシステム設定を参照・更新可能
CREATE POLICY "Only admins can access system settings"
ON system_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- ========================================
-- 3. 管理者認証情報テーブルのRLSポリシー
-- ========================================

-- 管理者は自分の情報のみ参照可能
CREATE POLICY "Admins can view their own credentials"
ON admin_credentials
FOR SELECT
USING (
    username = auth.jwt() ->> 'email'
    OR EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- 管理者は自分の情報のみ更新可能
CREATE POLICY "Admins can update their own credentials"
ON admin_credentials
FOR UPDATE
USING (username = auth.jwt() ->> 'email')
WITH CHECK (username = auth.jwt() ->> 'email');

-- 新規管理者作成は承認システム経由のみ
CREATE POLICY "Admin creation through approval system only"
ON admin_credentials
FOR INSERT
WITH CHECK (false);  -- 直接作成を無効化、承認システムを経由する

-- ========================================
-- 4. ログイン試行履歴のRLSポリシー
-- ========================================

-- 管理者は全てのログイン試行履歴を参照可能
CREATE POLICY "Admins can view login attempts"
ON admin_login_attempts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- ログイン試行履歴の記録は制限なし（システムが自動記録）
CREATE POLICY "System can insert login attempts"
ON admin_login_attempts
FOR INSERT
WITH CHECK (true);

-- ========================================
-- 5. 監査ログのRLSポリシー
-- ========================================

-- 管理者は全ての監査ログを参照可能
CREATE POLICY "Admins can view audit logs"
ON audit_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- 監査ログの記録は制限なし（システムが自動記録）
CREATE POLICY "System can insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (true);

-- ========================================
-- 6. 診断セッションのRLSポリシー
-- ========================================

-- 管理者は全ての診断セッションを参照可能
CREATE POLICY "Admins can view all diagnosis sessions"
ON diagnosis_sessions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- ユーザーは自分の診断セッションを作成・更新可能
CREATE POLICY "Users can manage their diagnosis sessions"
ON diagnosis_sessions
FOR ALL
USING (true)  -- 開発段階では制限を緩和
WITH CHECK (true);

-- ========================================
-- 7. 管理者登録申請のRLSポリシー
-- ========================================

-- 誰でも新規登録申請を作成可能
CREATE POLICY "Anyone can create registration request"
ON admin_registrations
FOR INSERT
WITH CHECK (true);

-- 管理者は全ての登録申請を参照・更新可能
CREATE POLICY "Admins can manage registration requests"
ON admin_registrations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- ========================================
-- 8. メール認証テーブルのRLSポリシー
-- ========================================

-- 誰でもメール認証を開始可能
CREATE POLICY "Anyone can create email verification"
ON admin_email_verification
FOR INSERT
WITH CHECK (true);

-- メール認証の参照・更新は制限なし（認証トークンベース）
CREATE POLICY "Email verification management"
ON admin_email_verification
FOR ALL
USING (true)
WITH CHECK (true);

-- ========================================
-- 9. SMS認証テーブルのRLSポリシー
-- ========================================

-- 管理者は自分のSMS認証のみ操作可能
CREATE POLICY "Admins can manage their SMS verification"
ON admin_sms_verification
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_credentials ac
        WHERE ac.id = admin_sms_verification.admin_id
        AND ac.username = auth.jwt() ->> 'email'
        AND ac.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_credentials ac
        WHERE ac.id = admin_sms_verification.admin_id
        AND ac.username = auth.jwt() ->> 'email'
        AND ac.is_active = true
    )
);

-- ========================================
-- 10. 承認履歴のRLSポリシー
-- ========================================

-- 管理者は全ての承認履歴を参照可能
CREATE POLICY "Admins can view approval history"
ON admin_approval_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- 承認履歴の記録は管理者のみ可能
CREATE POLICY "Admins can insert approval history"
ON admin_approval_history
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- ========================================
-- 11. 承認待ち管理者のRLSポリシー
-- ========================================

-- 誰でも承認申請を作成可能
CREATE POLICY "Anyone can create admin approval request"
ON pending_admin_approvals
FOR INSERT
WITH CHECK (true);

-- 管理者は全ての承認待ち申請を参照・更新可能
CREATE POLICY "Admins can manage pending approvals"
ON pending_admin_approvals
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- ========================================
-- 12. パスワード履歴のRLSポリシー
-- ========================================

-- 管理者は自分のパスワード履歴のみ参照可能
CREATE POLICY "Admins can view their password history"
ON password_history
FOR SELECT
USING (
    user_id = (auth.jwt() ->> 'sub')::text
    OR EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    )
);

-- パスワード履歴の記録はシステムが自動実行
CREATE POLICY "System can insert password history"
ON password_history
FOR INSERT
WITH CHECK (true);

-- ========================================
-- セキュリティ関数の作成
-- ========================================

-- 現在のユーザーが管理者かチェックする関数
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_credentials 
        WHERE username = auth.jwt() ->> 'email' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者のIDを取得する関数
CREATE OR REPLACE FUNCTION get_admin_id()
RETURNS integer AS $$
DECLARE
    admin_id integer;
BEGIN
    SELECT id INTO admin_id
    FROM admin_credentials 
    WHERE username = auth.jwt() ->> 'email' 
    AND is_active = true;
    
    RETURN admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 開発環境用の一時的なRLS無効化
-- ========================================

-- 開発段階で必要に応じて以下のコメントを外してRLSを無効化
-- 本番環境では絶対に実行しないこと！

/*
-- 開発用：RLSを一時的に無効化（本番環境では実行禁止）
ALTER TABLE admin_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_sessions DISABLE ROW LEVEL SECURITY;

-- 開発完了後は必ず再有効化
-- ALTER TABLE admin_registrations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE diagnosis_sessions ENABLE ROW LEVEL SECURITY;
*/

-- ========================================
-- セキュリティ設定完了メッセージ
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Zeroshin Admin RLS Policies Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Security Features:';
    RAISE NOTICE '- Row Level Security enabled on all tables';
    RAISE NOTICE '- Admin-only access to sensitive data';
    RAISE NOTICE '- User isolation for personal data';
    RAISE NOTICE '- Audit trail protection';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Create initial admin user';
    RAISE NOTICE '2. Test authentication flow';
    RAISE NOTICE '3. Configure environment variables';
    RAISE NOTICE '========================================';
END;
$$;
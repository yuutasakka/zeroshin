-- SMS認証からLINE認証への移行マイグレーション
-- 2024年実行予定

BEGIN;

-- 1. LINE認証用テーブルの作成
CREATE TABLE IF NOT EXISTS line_auth_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line_user_id TEXT NOT NULL UNIQUE,
    display_name TEXT,
    picture_url TEXT,
    state_token TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    diagnosis_answers JSONB,
    ip_address INET,
    user_agent TEXT
);

-- 2. LINE認証用のインデックス作成
CREATE INDEX IF NOT EXISTS idx_line_auth_sessions_line_user_id ON line_auth_sessions(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_auth_sessions_state_token ON line_auth_sessions(state_token);
CREATE INDEX IF NOT EXISTS idx_line_auth_sessions_created_at ON line_auth_sessions(created_at);

-- 3. 既存のusersテーブルにLINE認証フィールドを追加
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS line_user_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS line_display_name TEXT,
ADD COLUMN IF NOT EXISTS line_picture_url TEXT,
ADD COLUMN IF NOT EXISTS line_verified_at TIMESTAMP;

-- 4. 既存の診断結果テーブルにLINE認証フィールドを追加
ALTER TABLE diagnosis_results 
ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- 5. SMS関連テーブルの段階的削除準備（データ保存期間後に実行）
-- 以下のコメントアウトされたコマンドは、データ移行完了後に実行してください

-- -- SMS認証テーブルの削除（データ移行後）
-- -- DROP TABLE IF EXISTS phone_verifications CASCADE;
-- -- DROP TABLE IF EXISTS sms_logs CASCADE;
-- -- DROP TABLE IF EXISTS otp_attempts CASCADE;

-- 6. RLS (Row Level Security) ポリシーの設定
ALTER TABLE line_auth_sessions ENABLE ROW LEVEL SECURITY;

-- LINE認証セッションのRLSポリシー
CREATE POLICY line_auth_sessions_policy ON line_auth_sessions
    FOR ALL USING (true); -- 開発中は全アクセス許可、本番では制限を追加

-- 7. usersテーブルのLINE認証対応RLSポリシー更新
DROP POLICY IF EXISTS users_policy ON users;
CREATE POLICY users_policy ON users
    FOR ALL USING (
        auth.uid()::text = id::text OR 
        line_user_id IS NOT NULL
    );

-- 8. 診断結果のLINE認証対応RLSポリシー更新
DROP POLICY IF EXISTS diagnosis_results_policy ON diagnosis_results;
CREATE POLICY diagnosis_results_policy ON diagnosis_results
    FOR ALL USING (
        auth.uid()::text = user_id::text OR 
        line_user_id IS NOT NULL
    );

-- 9. LINE認証用の関数作成
CREATE OR REPLACE FUNCTION get_or_create_line_user(
    p_line_user_id TEXT,
    p_display_name TEXT DEFAULT NULL,
    p_picture_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- 既存のLINEユーザーを検索
    SELECT id INTO user_id
    FROM users
    WHERE line_user_id = p_line_user_id;
    
    -- 存在しない場合は新規作成
    IF user_id IS NULL THEN
        INSERT INTO users (
            line_user_id,
            line_display_name,
            line_picture_url,
            line_verified_at,
            created_at
        ) VALUES (
            p_line_user_id,
            p_display_name,
            p_picture_url,
            NOW(),
            NOW()
        ) RETURNING id INTO user_id;
    ELSE
        -- 既存ユーザーの情報を更新
        UPDATE users SET
            line_display_name = COALESCE(p_display_name, line_display_name),
            line_picture_url = COALESCE(p_picture_url, line_picture_url),
            updated_at = NOW()
        WHERE id = user_id;
    END IF;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 診断結果をLINE認証と関連付ける関数
CREATE OR REPLACE FUNCTION save_diagnosis_with_line_auth(
    p_line_user_id TEXT,
    p_diagnosis_data JSONB,
    p_results JSONB
) RETURNS UUID AS $$
DECLARE
    user_id UUID;
    diagnosis_id UUID;
BEGIN
    -- LINEユーザーを取得または作成
    user_id := get_or_create_line_user(p_line_user_id);
    
    -- 診断結果を保存
    INSERT INTO diagnosis_results (
        user_id,
        line_user_id,
        diagnosis_answers,
        results,
        created_at
    ) VALUES (
        user_id,
        p_line_user_id,
        p_diagnosis_data,
        p_results,
        NOW()
    ) RETURNING id INTO diagnosis_id;
    
    RETURN diagnosis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. トリガー関数の作成（updated_at自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. トリガーの設定
DROP TRIGGER IF EXISTS update_line_auth_sessions_updated_at ON line_auth_sessions;
CREATE TRIGGER update_line_auth_sessions_updated_at
    BEFORE UPDATE ON line_auth_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. セキュリティ設定の追加
-- LINE認証セッションの自動削除（30日後）
CREATE OR REPLACE FUNCTION cleanup_old_line_auth_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM line_auth_sessions
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND verified_at IS NULL; -- 未認証のセッションのみ削除
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 定期実行用のスケジュール（pg_cronが利用可能な場合）
-- SELECT cron.schedule('cleanup-line-auth', '0 2 * * *', 'SELECT cleanup_old_line_auth_sessions();');

COMMIT;

-- マイグレーション完了の確認メッセージ
DO $$
BEGIN
    RAISE NOTICE 'LINE認証システムへの移行が完了しました。';
    RAISE NOTICE '- line_auth_sessionsテーブルが作成されました';
    RAISE NOTICE '- usersテーブルにLINE認証対応フィールドが追加されました';  
    RAISE NOTICE '- 必要な関数とトリガーが設定されました';
    RAISE NOTICE '- RLSポリシーが更新されました';
END $$;
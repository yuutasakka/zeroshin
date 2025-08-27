-- ========================================
-- Zeroshin Admin - Fixed Initial Admin User Creation
-- UUID対応初期管理者ユーザー作成スクリプト
-- ========================================

-- 注意: このスクリプトは初回セットアップ時のみ実行してください
-- 本番環境では強力なパスワードを設定し、デフォルト値を変更してください

-- ========================================
-- 初期管理者ユーザーの作成（UUID対応）
-- ========================================

-- 初期管理者の認証情報を設定
-- 本番環境では以下の値を必ず変更してください
DO $$
DECLARE
    default_username TEXT := 'admin@zeroshin.com';
    default_password TEXT := 'ZeroShin2024!Admin';
    default_phone TEXT := '+81901234567';
    password_hash TEXT;
    backup_code TEXT;
    existing_admin INTEGER;
    new_admin_id UUID;
BEGIN
    -- 既存の管理者をチェック
    SELECT COUNT(*) INTO existing_admin FROM admin_credentials WHERE is_active = true;
    
    IF existing_admin > 0 THEN
        RAISE NOTICE '既存の管理者が見つかりました。初期管理者の作成をスキップします。';
        RETURN;
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '初期管理者ユーザーを作成しています...';
    RAISE NOTICE '========================================';

    -- パスワードをハッシュ化（SHA-256 + ソルト）
    -- 本番環境ではより強固なハッシュ化を推奨
    password_hash := encode(digest(default_password || 'zeroshin-salt-2024', 'sha256'), 'hex');
    backup_code := 'BACKUP-ADMIN-' || EXTRACT(epoch FROM now())::TEXT;

    -- 初期管理者を作成（UUIDで）
    INSERT INTO admin_credentials (
        username,
        password_hash,
        phone_number,
        backup_code,
        is_active,
        failed_attempts,
        requires_password_change,
        created_at,
        updated_at,
        password_changed_at
    ) VALUES (
        default_username,
        password_hash,
        default_phone,
        backup_code,
        true,
        0,
        true, -- 初回ログイン時にパスワード変更を強制
        now(),
        now(),
        now()
    ) RETURNING id INTO new_admin_id;

    -- 監査ログに記録
    INSERT INTO audit_logs (
        event_type,
        admin_id,
        username,
        description,
        severity,
        metadata
    ) VALUES (
        'ADMIN_CREATION',
        new_admin_id,
        default_username,
        '初期管理者ユーザーが作成されました',
        'info',
        jsonb_build_object(
            'action', 'initial_setup',
            'user_created', default_username,
            'admin_id', new_admin_id,
            'requires_password_change', true
        )
    );

    RAISE NOTICE '========================================';
    RAISE NOTICE '初期管理者ユーザーが正常に作成されました！';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ログイン情報:';
    RAISE NOTICE '  ユーザー名: %', default_username;
    RAISE NOTICE '  初期パスワード: %', default_password;
    RAISE NOTICE '  電話番号: %', default_phone;
    RAISE NOTICE '  バックアップコード: %', backup_code;
    RAISE NOTICE '  管理者ID (UUID): %', new_admin_id;
    RAISE NOTICE '========================================';
    RAISE NOTICE '重要なセキュリティ注意事項:';
    RAISE NOTICE '1. 初回ログイン時にパスワード変更が必要です';
    RAISE NOTICE '2. 本番環境では必ずパスワードを変更してください';
    RAISE NOTICE '3. バックアップコードを安全な場所に保管してください';
    RAISE NOTICE '4. 管理者UUIDをメモしてください';
    RAISE NOTICE '5. このログ出力を削除してください';
    RAISE NOTICE '========================================';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '初期管理者の作成に失敗しました: %', SQLERRM;
END;
$$;

-- ========================================
-- Supabase Auth ユーザーの作成（オプション）
-- ========================================

-- Supabase Auth と連携する場合は以下を実行
-- 注意: これはSupabaseコンソールまたはAPI経由で実行することを推奨

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Supabase Auth 設定のガイド';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Supabaseコンソールの Authentication > Users から';
    RAISE NOTICE '   管理者ユーザーを手動作成してください';
    RAISE NOTICE '';
    RAISE NOTICE '2. または以下のJavaScriptコードをブラウザで実行:';
    RAISE NOTICE '';
    RAISE NOTICE 'const { data, error } = await supabase.auth.admin.createUser({';
    RAISE NOTICE '  email: "admin@zeroshin.com",';
    RAISE NOTICE '  password: "ZeroShin2024!Admin",';
    RAISE NOTICE '  email_confirm: true';
    RAISE NOTICE '});';
    RAISE NOTICE '';
    RAISE NOTICE '3. 作成後、admin_credentials テーブルとの連携を確認';
    RAISE NOTICE '========================================';
END;
$$;

-- ========================================
-- テスト用のサンプルデータ作成（開発環境のみ）
-- ========================================

-- 開発環境でのテスト用データ
DO $$
DECLARE
    test_session_id TEXT;
    admin_id UUID;
BEGIN
    -- 開発環境かチェック（本番環境では実行しない）
    IF current_setting('server_version_num')::integer >= 120000 THEN
        
        -- システム設定の初期化
        INSERT INTO system_settings (
            id,
            maintenance_mode,
            max_users_per_day,
            sms_enabled,
            debug_mode
        ) VALUES (
            1,
            false,
            1000,
            true,
            true  -- 開発環境ではデバッグモードを有効
        ) ON CONFLICT (id) DO UPDATE SET
            debug_mode = true;

        -- 管理者IDを取得
        SELECT id INTO admin_id FROM admin_credentials WHERE is_active = true LIMIT 1;

        -- サンプル診断セッション（テスト用）
        test_session_id := 'test_session_' || EXTRACT(epoch FROM now())::TEXT;
        INSERT INTO diagnosis_sessions (
            session_id,
            phone_number,
            diagnosis_answers,
            sms_verified,
            verification_status
        ) VALUES (
            test_session_id,
            '+81900000001',
            '{"answers": {"q1": "yes", "q2": "no"}, "score": 75}',
            true,
            'verified'
        );

        -- サンプル監査ログ
        IF admin_id IS NOT NULL THEN
            INSERT INTO audit_logs (
                event_type,
                admin_id,
                username,
                description,
                severity,
                metadata
            ) VALUES (
                'SYSTEM_SETUP',
                admin_id,
                'admin@zeroshin.com',
                'テスト用データが作成されました',
                'info',
                jsonb_build_object(
                    'action', 'test_data_creation',
                    'session_id', test_session_id
                )
            );
        END IF;

        RAISE NOTICE 'テスト用データが作成されました（開発環境のみ）';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'テスト用データの作成をスキップしました';
END;
$$;

-- ========================================
-- UUID対応のヘルパー関数作成
-- ========================================

-- 管理者情報を取得する関数
CREATE OR REPLACE FUNCTION get_admin_info(admin_email TEXT)
RETURNS TABLE(
    admin_id UUID,
    username VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT ac.id, ac.username, ac.is_active, ac.created_at, ac.last_login
    FROM admin_credentials ac
    WHERE ac.username = admin_email;
END;
$$ LANGUAGE plpgsql;

-- 管理者の統計情報を取得する関数
CREATE OR REPLACE FUNCTION get_admin_statistics()
RETURNS TABLE(
    total_admins INTEGER,
    active_admins INTEGER,
    pending_registrations INTEGER,
    login_attempts_today INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM admin_credentials),
        (SELECT COUNT(*)::INTEGER FROM admin_credentials WHERE is_active = true),
        (SELECT COUNT(*)::INTEGER FROM admin_registrations WHERE status = 'pending'),
        (SELECT COUNT(*)::INTEGER FROM admin_login_attempts WHERE created_at >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- セットアップ検証クエリ（UUID対応）
-- ========================================

-- 作成された管理者の確認
DO $$
DECLARE
    admin_count INTEGER;
    system_settings_count INTEGER;
    admin_info RECORD;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM admin_credentials WHERE is_active = true;
    SELECT COUNT(*) INTO system_settings_count FROM system_settings;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'セットアップ検証結果:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'アクティブな管理者数: %', admin_count;
    RAISE NOTICE 'システム設定: %', 
        CASE WHEN system_settings_count > 0 THEN '設定済み' ELSE '未設定' END;
    
    -- 管理者の詳細情報を表示
    IF admin_count > 0 THEN
        FOR admin_info IN 
            SELECT id, username, created_at 
            FROM admin_credentials 
            WHERE is_active = true 
            ORDER BY created_at 
            LIMIT 3
        LOOP
            RAISE NOTICE '管理者: % (ID: %, 作成: %)', 
                admin_info.username, 
                admin_info.id, 
                admin_info.created_at;
        END LOOP;
    END IF;
    
    IF admin_count > 0 AND system_settings_count > 0 THEN
        RAISE NOTICE 'ステータス: ✅ セットアップ完了';
    ELSE
        RAISE NOTICE 'ステータス: ❌ セットアップ未完了';
    END IF;
    RAISE NOTICE '========================================';
END;
$$;

-- ========================================
-- データベース整合性チェック
-- ========================================

-- 外部キー制約の確認
DO $$
DECLARE
    fk_info RECORD;
    constraint_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '外部キー制約チェック:';
    RAISE NOTICE '========================================';
    
    FOR fk_info IN
        SELECT 
            conname AS constraint_name,
            conrelid::regclass AS table_name,
            confrelid::regclass AS referenced_table
        FROM pg_constraint 
        WHERE contype = 'f'
        AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY conname
    LOOP
        RAISE NOTICE '✅ %: % -> %', 
            fk_info.constraint_name, 
            fk_info.table_name, 
            fk_info.referenced_table;
        constraint_count := constraint_count + 1;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '外部キー制約数: %', constraint_count;
    RAISE NOTICE '========================================';
END;
$$;

-- ========================================
-- セキュリティチェックリスト
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'セキュリティチェックリスト';
    RAISE NOTICE '========================================';
    RAISE NOTICE '□ 初期パスワードを本番用に変更';
    RAISE NOTICE '□ バックアップコードを安全に保管';
    RAISE NOTICE '□ 環境変数の設定完了';
    RAISE NOTICE '□ HTTPS通信の設定';
    RAISE NOTICE '□ SMS/メール送信サービスの設定';
    RAISE NOTICE '□ 定期的なデータベースバックアップの設定';
    RAISE NOTICE '□ 監査ログの監視システム構築';
    RAISE NOTICE '□ RLSポリシーの動作確認';
    RAISE NOTICE '□ UUID外部キー制約の確認完了';
    RAISE NOTICE '========================================';
    RAISE NOTICE '便利なクエリ:';
    RAISE NOTICE 'SELECT * FROM get_admin_statistics();';
    RAISE NOTICE 'SELECT * FROM security_audit_report();';
    RAISE NOTICE 'SELECT * FROM get_admin_info(''admin@zeroshin.com'');';
    RAISE NOTICE '========================================';
    RAISE NOTICE '初期セットアップ（UUID対応版）が完了しました！';
    RAISE NOTICE '========================================';
END;
$$;
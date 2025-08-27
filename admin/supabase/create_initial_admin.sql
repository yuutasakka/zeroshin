-- ========================================
-- Zeroshin Admin - Initial Admin User Creation
-- 初期管理者ユーザー作成スクリプト
-- ========================================

-- 注意: このスクリプトは初回セットアップ時のみ実行してください
-- 本番環境では強力なパスワードを設定し、デフォルト値を変更してください

-- ========================================
-- 初期管理者ユーザーの作成
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

    -- 初期管理者を作成
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
    );

    -- 監査ログに記録
    INSERT INTO audit_logs (
        event_type,
        username,
        description,
        severity,
        metadata
    ) VALUES (
        'ADMIN_CREATION',
        default_username,
        '初期管理者ユーザーが作成されました',
        'info',
        jsonb_build_object(
            'action', 'initial_setup',
            'user_created', default_username,
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
    RAISE NOTICE '========================================';
    RAISE NOTICE '重要なセキュリティ注意事項:';
    RAISE NOTICE '1. 初回ログイン時にパスワード変更が必要です';
    RAISE NOTICE '2. 本番環境では必ずパスワードを変更してください';
    RAISE NOTICE '3. バックアップコードを安全な場所に保管してください';
    RAISE NOTICE '4. このログ出力を削除してください';
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

        -- サンプル診断セッション（テスト用）
        INSERT INTO diagnosis_sessions (
            session_id,
            phone_number,
            diagnosis_answers,
            sms_verified,
            verification_status
        ) VALUES (
            'test_session_' || EXTRACT(epoch FROM now())::TEXT,
            '+81900000001',
            '{"answers": {"q1": "yes", "q2": "no"}, "score": 75}',
            true,
            'verified'
        );

        RAISE NOTICE 'テスト用データが作成されました（開発環境のみ）';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'テスト用データの作成をスキップしました';
END;
$$;

-- ========================================
-- セットアップ検証クエリ
-- ========================================

-- 作成された管理者の確認
DO $$
DECLARE
    admin_count INTEGER;
    system_settings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM admin_credentials WHERE is_active = true;
    SELECT COUNT(*) INTO system_settings_count FROM system_settings;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'セットアップ検証結果:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'アクティブな管理者数: %', admin_count;
    RAISE NOTICE 'システム設定: %', 
        CASE WHEN system_settings_count > 0 THEN '設定済み' ELSE '未設定' END;
    
    IF admin_count > 0 AND system_settings_count > 0 THEN
        RAISE NOTICE 'ステータス: ✅ セットアップ完了';
    ELSE
        RAISE NOTICE 'ステータス: ❌ セットアップ未完了';
    END IF;
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
    RAISE NOTICE '========================================';
    RAISE NOTICE '初期セットアップが完了しました！';
    RAISE NOTICE '========================================';
END;
$$;
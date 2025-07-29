-- 暗号化キーメタデータテーブルの作成
-- エンタープライズ級の鍵管理システムのためのデータベーススキーマ

-- 暗号化キーメタデータテーブル
CREATE TABLE IF NOT EXISTS encryption_key_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_id VARCHAR(255) NOT NULL UNIQUE,
    algorithm VARCHAR(50) NOT NULL DEFAULT 'aes-256-gcm',
    key_size INTEGER NOT NULL DEFAULT 32,
    purpose VARCHAR(50) NOT NULL DEFAULT 'encryption',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    rotated_from VARCHAR(255), -- 前のキーID（ローテーション時）
    metadata JSONB, -- 追加メタデータ
    
    -- 制約
    CONSTRAINT valid_algorithm CHECK (algorithm IN ('aes-256-gcm', 'aes-256-cbc', 'chacha20-poly1305')),
    CONSTRAINT valid_purpose CHECK (purpose IN ('encryption', 'signing', 'master', 'backup')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'deprecated', 'revoked', 'backup')),
    CONSTRAINT valid_key_size CHECK (key_size IN (16, 24, 32))
);

-- パスワードハッシュメタデータテーブル
CREATE TABLE IF NOT EXISTS password_hash_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    hash_algorithm VARCHAR(50) NOT NULL,
    salt_size INTEGER NOT NULL,
    pepper_version VARCHAR(10) NOT NULL DEFAULT 'v1',
    iterations INTEGER NOT NULL,
    bcrypt_rounds INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_verified TIMESTAMP WITH TIME ZONE,
    verification_count INTEGER DEFAULT 0,
    
    -- 制約
    CONSTRAINT valid_hash_algorithm CHECK (hash_algorithm LIKE 'pbkdf2-%+bcrypt'),
    CONSTRAINT valid_salt_size CHECK (salt_size >= 16),
    CONSTRAINT valid_iterations CHECK (iterations >= 10000),
    CONSTRAINT valid_bcrypt_rounds CHECK (bcrypt_rounds >= 10)
);

-- 暗号化操作ログテーブル
CREATE TABLE IF NOT EXISTS encryption_operation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type VARCHAR(20) NOT NULL,
    key_id VARCHAR(255) NOT NULL,
    data_size INTEGER,
    client_ip INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_operation_type CHECK (operation_type IN ('encrypt', 'decrypt', 'key_generation', 'key_rotation', 'hash', 'verify'))
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_encryption_key_metadata_key_id ON encryption_key_metadata(key_id);
CREATE INDEX IF NOT EXISTS idx_encryption_key_metadata_status ON encryption_key_metadata(status);
CREATE INDEX IF NOT EXISTS idx_encryption_key_metadata_purpose ON encryption_key_metadata(purpose);
CREATE INDEX IF NOT EXISTS idx_encryption_key_metadata_created_at ON encryption_key_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_encryption_key_metadata_last_used ON encryption_key_metadata(last_used);

CREATE INDEX IF NOT EXISTS idx_password_hash_metadata_user_id ON password_hash_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_password_hash_metadata_created_at ON password_hash_metadata(created_at);

CREATE INDEX IF NOT EXISTS idx_encryption_operation_log_key_id ON encryption_operation_log(key_id);
CREATE INDEX IF NOT EXISTS idx_encryption_operation_log_operation_type ON encryption_operation_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_encryption_operation_log_created_at ON encryption_operation_log(created_at);
CREATE INDEX IF NOT EXISTS idx_encryption_operation_log_success ON encryption_operation_log(success);

-- RLS (Row Level Security) の有効化
ALTER TABLE encryption_key_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_hash_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_operation_log ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成

-- 暗号化キーメタデータ: service_role のみアクセス可能
CREATE POLICY "encryption_key_metadata_service_role_only" ON encryption_key_metadata
    FOR ALL USING (auth.role() = 'service_role');

-- パスワードハッシュメタデータ: service_role のみアクセス可能
CREATE POLICY "password_hash_metadata_service_role_only" ON password_hash_metadata
    FOR ALL USING (auth.role() = 'service_role');

-- 暗号化操作ログ: service_role は全アクセス、authenticated は読み取りのみ
CREATE POLICY "encryption_operation_log_service_role_all" ON encryption_operation_log
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "encryption_operation_log_authenticated_read" ON encryption_operation_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- 関数: 古いキーの自動無効化
CREATE OR REPLACE FUNCTION disable_old_encryption_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
    max_key_age INTERVAL := '30 days';
BEGIN
    -- 30日以上古いアクティブキーを非推奨に変更
    UPDATE encryption_key_metadata 
    SET 
        status = 'deprecated',
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_deprecated_at', NOW())
    WHERE 
        status = 'active' 
        AND created_at < (NOW() - max_key_age);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    INSERT INTO encryption_operation_log (
        operation_type,
        key_id,
        success,
        error_message,
        created_at
    ) VALUES (
        'key_rotation',
        'system',
        true,
        format('Auto-deprecated %s old keys', updated_count),
        NOW()
    );
    
    RETURN updated_count;
END;
$$;

-- 関数: 暗号化統計の取得
CREATE OR REPLACE FUNCTION get_encryption_statistics()
RETURNS TABLE (
    total_keys INTEGER,
    active_keys INTEGER,
    deprecated_keys INTEGER,
    revoked_keys INTEGER,
    total_operations BIGINT,
    successful_operations BIGINT,
    failed_operations BIGINT,
    avg_processing_time NUMERIC,
    last_key_rotation TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM encryption_key_metadata) as total_keys,
        (SELECT COUNT(*)::INTEGER FROM encryption_key_metadata WHERE status = 'active') as active_keys,
        (SELECT COUNT(*)::INTEGER FROM encryption_key_metadata WHERE status = 'deprecated') as deprecated_keys,
        (SELECT COUNT(*)::INTEGER FROM encryption_key_metadata WHERE status = 'revoked') as revoked_keys,
        (SELECT COUNT(*) FROM encryption_operation_log) as total_operations,
        (SELECT COUNT(*) FROM encryption_operation_log WHERE success = true) as successful_operations,
        (SELECT COUNT(*) FROM encryption_operation_log WHERE success = false) as failed_operations,
        (SELECT AVG(processing_time_ms) FROM encryption_operation_log WHERE processing_time_ms IS NOT NULL) as avg_processing_time,
        (SELECT MAX(created_at) FROM encryption_key_metadata) as last_key_rotation;
END;
$$;

-- 関数: 使用されていないキーの特定
CREATE OR REPLACE FUNCTION find_unused_encryption_keys(days_threshold INTEGER DEFAULT 7)
RETURNS TABLE (
    key_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER,
    days_unused INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ekm.key_id,
        ekm.created_at,
        ekm.last_used,
        ekm.usage_count,
        EXTRACT(days FROM (NOW() - ekm.last_used))::INTEGER as days_unused
    FROM encryption_key_metadata ekm
    WHERE 
        ekm.status = 'active'
        AND ekm.last_used < (NOW() - (days_threshold || ' days')::INTERVAL)
    ORDER BY ekm.last_used ASC;
END;
$$;

-- 関数: セキュリティアラート
CREATE OR REPLACE FUNCTION check_encryption_security_alerts()
RETURNS TABLE (
    alert_type VARCHAR(50),
    alert_message TEXT,
    severity VARCHAR(20),
    affected_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_keys_count INTEGER;
    high_usage_keys_count INTEGER;
    failed_ops_count INTEGER;
BEGIN
    -- 古いキーのアラート
    SELECT COUNT(*) INTO old_keys_count
    FROM encryption_key_metadata
    WHERE status = 'active' AND created_at < (NOW() - INTERVAL '30 days');
    
    IF old_keys_count > 0 THEN
        RETURN QUERY SELECT
            'OLD_KEYS'::VARCHAR(50),
            format('Found %s active keys older than 30 days', old_keys_count),
            'WARNING'::VARCHAR(20),
            old_keys_count;
    END IF;
    
    -- 高使用率キーのアラート
    SELECT COUNT(*) INTO high_usage_keys_count
    FROM encryption_key_metadata
    WHERE status = 'active' AND usage_count > 10000;
    
    IF high_usage_keys_count > 0 THEN
        RETURN QUERY SELECT
            'HIGH_USAGE_KEYS'::VARCHAR(50),
            format('Found %s keys with high usage count (>10000)', high_usage_keys_count),
            'INFO'::VARCHAR(20),
            high_usage_keys_count;
    END IF;
    
    -- 最近の暗号化失敗のアラート
    SELECT COUNT(*) INTO failed_ops_count
    FROM encryption_operation_log
    WHERE success = false AND created_at > (NOW() - INTERVAL '24 hours');
    
    IF failed_ops_count > 10 THEN
        RETURN QUERY SELECT
            'ENCRYPTION_FAILURES'::VARCHAR(50),
            format('High number of encryption failures in last 24 hours: %s', failed_ops_count),
            'CRITICAL'::VARCHAR(20),
            failed_ops_count;
    END IF;
    
    -- アラートがない場合
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            'NO_ALERTS'::VARCHAR(50),
            'All encryption security checks passed'::TEXT,
            'OK'::VARCHAR(20),
            0::INTEGER;
    END IF;
END;
$$;

-- トリガー: 暗号化操作の自動ログ記録
CREATE OR REPLACE FUNCTION log_encryption_key_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- usage_count が増加した場合のみログ記録
    IF TG_OP = 'UPDATE' AND NEW.usage_count > OLD.usage_count THEN
        INSERT INTO encryption_operation_log (
            operation_type,
            key_id,
            success,
            created_at
        ) VALUES (
            CASE 
                WHEN NEW.purpose = 'encryption' THEN 'encrypt'
                WHEN NEW.purpose = 'signing' THEN 'sign'
                ELSE 'key_operation'
            END,
            NEW.key_id,
            true,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- トリガーの作成
DROP TRIGGER IF EXISTS trigger_log_encryption_key_usage ON encryption_key_metadata;
CREATE TRIGGER trigger_log_encryption_key_usage
    AFTER UPDATE ON encryption_key_metadata
    FOR EACH ROW
    EXECUTE FUNCTION log_encryption_key_usage();

-- 定期メンテナンス用の関数作成
CREATE OR REPLACE FUNCTION encryption_maintenance()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_text TEXT := '';
    deprecated_count INTEGER;
    cleaned_logs INTEGER;
BEGIN
    -- 古いキーの自動無効化
    SELECT disable_old_encryption_keys() INTO deprecated_count;
    result_text := result_text || format('Deprecated %s old keys. ', deprecated_count);
    
    -- 90日以上古い操作ログの削除
    DELETE FROM encryption_operation_log 
    WHERE created_at < (NOW() - INTERVAL '90 days');
    GET DIAGNOSTICS cleaned_logs = ROW_COUNT;
    result_text := result_text || format('Cleaned %s old operation logs. ', cleaned_logs);
    
    -- VACUUMの実行（統計更新）
    -- VACUUM ANALYZE encryption_key_metadata;
    -- VACUUM ANALYZE encryption_operation_log;
    
    result_text := result_text || 'Maintenance completed successfully.';
    
    RETURN result_text;
END;
$$;

-- 権限の設定
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON TABLE encryption_key_metadata TO service_role;
GRANT ALL PRIVILEGES ON TABLE password_hash_metadata TO service_role;
GRANT ALL PRIVILEGES ON TABLE encryption_operation_log TO service_role;

GRANT EXECUTE ON FUNCTION disable_old_encryption_keys TO service_role;
GRANT EXECUTE ON FUNCTION get_encryption_statistics TO service_role;
GRANT EXECUTE ON FUNCTION find_unused_encryption_keys TO service_role;
GRANT EXECUTE ON FUNCTION check_encryption_security_alerts TO service_role;
GRANT EXECUTE ON FUNCTION encryption_maintenance TO service_role;

-- 初期データの挿入（システム用）
INSERT INTO encryption_key_metadata (
    key_id,
    algorithm,
    key_size,
    purpose,
    status,
    metadata
) VALUES (
    'system_master_key_v1',
    'aes-256-gcm',
    32,
    'master',
    'active',
    '{"description": "System master key for key encryption", "auto_generated": true}'
) ON CONFLICT (key_id) DO NOTHING;

-- 最初の統計レコードの作成
INSERT INTO encryption_operation_log (
    operation_type,
    key_id,
    success,
    error_message
) VALUES (
    'key_generation',
    'system',
    true,
    'Encryption system initialized successfully'
);

COMMENT ON TABLE encryption_key_metadata IS 'エンタープライズ級暗号化キー管理のメタデータ';
COMMENT ON TABLE password_hash_metadata IS 'パスワードハッシュ化の設定とメタデータ';
COMMENT ON TABLE encryption_operation_log IS '暗号化操作の監査ログ';

COMMENT ON FUNCTION disable_old_encryption_keys IS '古いキーの自動無効化';
COMMENT ON FUNCTION get_encryption_statistics IS '暗号化システムの統計情報取得';
COMMENT ON FUNCTION find_unused_encryption_keys IS '使用されていないキーの特定';
COMMENT ON FUNCTION check_encryption_security_alerts IS 'セキュリティアラートのチェック';
COMMENT ON FUNCTION encryption_maintenance IS '定期メンテナンス処理';
# Supabase & Vercel Setup Guide

## Supabase Database Setup

### 1. CSRF Protection Tables

```sql
-- CSRF セッション管理テーブル
CREATE TABLE csrf_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  client_ip INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- 管理者認証ログテーブル
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

-- SMS認証ログテーブル（既存の拡張）
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
```

### 2. Indexes for Performance

```sql
-- CSRF sessions indexes
CREATE INDEX idx_csrf_sessions_session_id ON csrf_sessions(session_id);
CREATE INDEX idx_csrf_sessions_expires_at ON csrf_sessions(expires_at);
CREATE INDEX idx_csrf_sessions_client_ip ON csrf_sessions(client_ip);

-- Admin auth logs indexes
CREATE INDEX idx_admin_auth_logs_session_id ON admin_auth_logs(session_id);
CREATE INDEX idx_admin_auth_logs_user_id ON admin_auth_logs(user_id);
CREATE INDEX idx_admin_auth_logs_created_at ON admin_auth_logs(created_at DESC);
CREATE INDEX idx_admin_auth_logs_ip_address ON admin_auth_logs(ip_address);

-- SMS auth logs indexes
CREATE INDEX idx_sms_auth_logs_phone_number ON sms_auth_logs(phone_number);
CREATE INDEX idx_sms_auth_logs_session_id ON sms_auth_logs(session_id);
CREATE INDEX idx_sms_auth_logs_created_at ON sms_auth_logs(created_at DESC);
```

### 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE csrf_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_auth_logs ENABLE ROW LEVEL SECURITY;

-- CSRF sessions - システム内部アクセスのみ
CREATE POLICY "System access only" ON csrf_sessions
  FOR ALL USING (false);

-- Admin auth logs - 管理者のみ閲覧可能
CREATE POLICY "Admin only access" ON admin_auth_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        SELECT email FROM admin_users WHERE is_active = true
      )
    )
  );

-- SMS auth logs - システム管理者のみ
CREATE POLICY "System admin only" ON sms_auth_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@moneyticket.com'
    )
  );
```

### 4. Auto-cleanup Functions

```sql
-- 期限切れCSRFトークンの自動削除
CREATE OR REPLACE FUNCTION cleanup_expired_csrf_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM csrf_sessions 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 古いログエントリの自動削除（30日経過）
CREATE OR REPLACE FUNCTION cleanup_old_auth_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_auth_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM sms_auth_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- スケジュール設定（pg_cron拡張が必要）
-- SELECT cron.schedule('cleanup-csrf', '*/30 * * * *', 'SELECT cleanup_expired_csrf_tokens();');
-- SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_auth_logs();');
```

## Vercel Environment Variables

Add these to your Vercel project settings:

```bash
# CSRF Protection
CSRF_SECRET=your-strong-csrf-secret-key-here
NODE_ENV=production

# Admin Panel Security
ADMIN_PATH_SECRET=your-admin-path-secret
BASIC_AUTH_USER=your-admin-username
BASIC_AUTH_PASS=your-secure-admin-password
ADMIN_IP_WHITELIST=192.168.1.100,203.0.113.0

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# SMS (if using)
SMS_API_KEY=your-sms-provider-key
SMS_API_SECRET=your-sms-provider-secret
```

## Vercel Deployment Configuration

### vercel.json
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/admin-:hash*",
      "destination": "/admin-:hash*"
    }
  ]
}
```

## Security Checklist

- [ ] Update all environment variables in Vercel
- [ ] Run SQL migrations in Supabase
- [ ] Test CSRF protection on deployed environment
- [ ] Verify admin panel access with new path
- [ ] Confirm SMS authentication with CSRF tokens
- [ ] Test IP whitelist functionality
- [ ] Monitor logs for security events
- [ ] Set up automated cleanup jobs

## Post-Deployment Testing

1. Test CSRF token generation: `GET /api/csrf-token`
2. Test protected SMS flow: `POST /api/send-otp` with CSRF token
3. Test admin login: `POST /api/admin-login` with CSRF token
4. Verify admin panel access via dynamic path
5. Test Basic auth and IP restrictions
6. Monitor Supabase logs for RLS policy enforcement

## Monitoring

Set up alerts for:
- Failed CSRF validation attempts
- Unauthorized admin access attempts  
- High volume SMS requests
- Database cleanup job failures
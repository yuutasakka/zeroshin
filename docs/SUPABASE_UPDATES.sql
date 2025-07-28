-- Supabase Database Updates for CSRF Protection and Admin Panel
-- Execute these SQL statements in your Supabase SQL editor

-- Create csrf_tokens table for server-side CSRF token management
CREATE TABLE IF NOT EXISTS csrf_tokens (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    client_ip INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_sessions table for admin authentication tracking
CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_logs table for audit logging
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_session_id ON csrf_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires_at ON csrf_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE csrf_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for csrf_tokens (server-side access only)
CREATE POLICY "Service role can manage CSRF tokens" ON csrf_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for admin_sessions
CREATE POLICY "Users can view their own sessions" ON admin_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage admin sessions" ON admin_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for security_logs
CREATE POLICY "Service role can manage security logs" ON security_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to service role
GRANT ALL ON csrf_tokens TO service_role;
GRANT ALL ON admin_sessions TO service_role;
GRANT ALL ON security_logs TO service_role;

-- Cleanup function for expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete expired CSRF tokens
    DELETE FROM csrf_tokens WHERE expires_at < NOW();
    
    -- Delete expired admin sessions
    DELETE FROM admin_sessions WHERE expires_at < NOW();
    
    -- Log cleanup activity
    INSERT INTO security_logs (event_type, details, severity)
    VALUES ('token_cleanup', jsonb_build_object('timestamp', NOW()), 'info');
END;
$$;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-expired-tokens', '0 * * * *', 'SELECT cleanup_expired_tokens();');
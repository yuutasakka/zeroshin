-- 専門家連絡先設定テーブルの作成
CREATE TABLE IF NOT EXISTS expert_contact_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    expert_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    business_hours VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS (Row Level Security) を有効化
ALTER TABLE expert_contact_settings ENABLE ROW LEVEL SECURITY;

-- 管理者のみがアクセス可能なポリシーを作成
CREATE POLICY "管理者のみアクセス可能" ON expert_contact_settings
    FOR ALL USING (auth.role() = 'service_role');

-- 匿名ユーザーが読み取り専用でアクセス可能なポリシーを追加
CREATE POLICY "匿名ユーザー読み取り専用" ON expert_contact_settings
    FOR SELECT USING (is_active = true);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_expert_contact_settings_key ON expert_contact_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_expert_contact_settings_active ON expert_contact_settings(is_active);

-- 初期データの挿入（デフォルト専門家）
INSERT INTO expert_contact_settings (setting_key, expert_name, phone_number, email, business_hours, description) VALUES 
('primary_financial_advisor', 'MoneyTicket専門アドバイザー', '0120-123-456', 'advisor@moneyticket.co.jp', '平日 9:00-18:00', 'MoneyTicketの認定ファイナンシャルプランナーが、お客様の資産運用に関するご相談を承ります。')
ON CONFLICT (setting_key) DO UPDATE SET 
    expert_name = EXCLUDED.expert_name,
    phone_number = EXCLUDED.phone_number,
    email = EXCLUDED.email,
    business_hours = EXCLUDED.business_hours,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

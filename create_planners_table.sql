-- ファイナンシャルプランナー情報テーブルの作成
CREATE TABLE IF NOT EXISTS financial_planners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    experience_years INTEGER,
    specialties TEXT[],
    profile_image_url TEXT,
    bio TEXT NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    certifications TEXT[],
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS (Row Level Security) を有効化
ALTER TABLE financial_planners ENABLE ROW LEVEL SECURITY;

-- 管理者のみがアクセス可能なポリシーを作成
CREATE POLICY "管理者のみアクセス可能" ON financial_planners
    FOR ALL USING (auth.role() = 'service_role');

-- 匿名ユーザーが読み取り専用でアクセス可能なポリシーを追加
CREATE POLICY "匿名ユーザー読み取り専用" ON financial_planners
    FOR SELECT USING (is_active = true);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_financial_planners_active ON financial_planners(is_active);
CREATE INDEX IF NOT EXISTS idx_financial_planners_order ON financial_planners(display_order);

-- 初期データの挿入（サンプルファイナンシャルプランナー）
INSERT INTO financial_planners (name, title, experience_years, specialties, profile_image_url, bio, phone_number, email, certifications, display_order) VALUES 
('田中 美咲', 'シニアファイナンシャルプランナー', 12, ARRAY['資産運用', '保険プランニング', '税務相談'], 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face', '12年の経験を持つ資産運用のスペシャリストです。お客様一人ひとりのライフプランに合わせた最適な投資戦略をご提案いたします。特に長期投資と分散投資を得意としており、多くのお客様の資産形成をサポートしてまいりました。', '0120-111-111', 'tanaka@moneyticket.co.jp', ARRAY['CFP®', 'FP1級', '証券外務員1種'], 1),
('佐藤 健太', 'ファイナンシャルプランナー', 8, ARRAY['不動産投資', 'NISA・iDeCo', '相続対策'], 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face', '不動産投資と税制優遇制度を活用した資産形成が専門です。NISA・iDeCoを最大限活用した効率的な投資プランをご提案いたします。お客様の将来の夢や目標を実現するため、丁寧なヒアリングと分かりやすい説明を心がけています。', '0120-222-222', 'sato@moneyticket.co.jp', ARRAY['FP2級', '宅地建物取引士', '相続診断士'], 2),
('山田 花子', 'ウェルスマネージャー', 15, ARRAY['富裕層向け資産管理', '海外投資', 'プライベートバンキング'], 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face', '富裕層のお客様向けの総合的な資産管理サービスを提供しています。国内外の投資商品に精通し、グローバルな視点での資産運用をサポートいたします。プライベートバンキングサービスを通じて、お客様の資産を次世代へ継承するお手伝いもしています。', '0120-333-333', 'yamada@moneyticket.co.jp', ARRAY['CFP®', 'CFA', 'プライベートバンカー'], 3),
('鈴木 太郎', 'ファイナンシャルプランナー', 6, ARRAY['若年層向け資産形成', 'ライフプランニング', '教育資金'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face', '20代・30代の若い世代の資産形成を専門としています。結婚、出産、住宅購入、教育資金など、ライフイベントに合わせた計画的な資産形成をサポートいたします。投資初心者の方にも分かりやすく、安心して始められる投資プランをご提案いたします。', '0120-444-444', 'suzuki@moneyticket.co.jp', ARRAY['FP2級', '証券外務員2種'], 4)
ON CONFLICT DO NOTHING;

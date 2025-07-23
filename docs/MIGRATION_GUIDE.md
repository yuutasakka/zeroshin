# 📋 Supabaseマイグレーション実行ガイド

## 🎯 目的
`homepage_content_settings` テーブルを作成して、管理画面のコンテンツ管理機能を正常動作させる。

## 🚀 実行手順

### 方法1: Supabase CLI使用（推奨）

```bash
# 1. Supabase CLIがインストールされている場合
supabase db push

# 2. 特定のマイグレーションファイルを実行
supabase db push --include-seed
```

### 方法2: Supabase Dashboardでの手動実行

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左サイドバーから「SQL Editor」を選択
4. 以下のSQLを実行：

```sql
-- AI ConnectX ホームページコンテンツ設定テーブル作成
-- 依存する関数を先に作成
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- homepage_content_settingsテーブル作成
CREATE TABLE IF NOT EXISTS homepage_content_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_data JSONB,
    title VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_homepage_content_key ON homepage_content_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_homepage_content_active ON homepage_content_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_content_order ON homepage_content_settings(display_order);

-- Row Level Security (RLS) の有効化
ALTER TABLE homepage_content_settings ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
CREATE POLICY "homepage_content_read_policy" ON homepage_content_settings
    FOR SELECT USING (true);

CREATE POLICY "homepage_content_write_policy" ON homepage_content_settings
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 初期データの挿入
INSERT INTO homepage_content_settings (
    setting_key,
    setting_data,
    title,
    description,
    display_order
) VALUES 
(
    'main_visual_data',
    '{
        "title": "あなたの未来を一緒に描こう♪",
        "subtitle": "無料相談で理想の資産運用プランを見つけませんか？",
        "description": "AI ConnectXで、あなたの夢や目標に合わせた最適な資産運用戦略を専門家と一緒に作りましょう。",
        "buttonText": "無料診断を始める",
        "image_url": "/images/main-visual.jpg"
    }'::jsonb,
    'メインビジュアル設定',
    'トップページのメインビジュアル（ヒーローセクション）の内容設定',
    1
),
(
    'first_consultation_offer',
    '{
        "title": "初回相談無料キャンペーン",
        "description": "資産運用のプロが、あなたの状況に合わせて最適なプランをご提案します。",
        "price": "通常5,000円 → 今なら無料",
        "features": [
            "現在の資産状況の詳細分析",
            "将来目標に向けた運用戦略の提案",
            "リスク許容度に応じた商品選択",
            "具体的な行動プランの作成"
        ],
        "buttonText": "今すぐ無料相談を予約",
        "validUntil": "2024-12-31"
    }'::jsonb,
    '初回相談無料オファー',
    'ファーストビューの特別オファー内容',
    2
),
(
    'header_data',
    '{
        "logo": {
            "text": "AI ConnectX",
            "image_url": "/images/logo.png"
        },
        "navigation": [
            {"label": "サービス", "href": "#services"},
            {"label": "診断", "href": "#diagnosis"},
            {"label": "お客様の声", "href": "#testimonials"},
            {"label": "お問い合わせ", "href": "#contact"}
        ],
        "cta_button": {
            "text": "無料診断",
            "href": "#diagnosis"
        },
        "phone": {
            "number": "0120-123-456",
            "hours": "平日 9:00-18:00"
        }
    }'::jsonb,
    'ヘッダー設定',
    'サイトヘッダーのナビゲーションと連絡先情報',
    3
),
(
    'features_section',
    '{
        "title": "AI ConnectXが選ばれる理由",
        "subtitle": "安心・安全・確実な資産運用サポート",
        "features": [
            {
                "icon": "fa-chart-line",
                "title": "データ分析による最適化",
                "description": "過去の市場データと最新のAI技術を活用し、お客様に最適な投資戦略をご提案します。"
            },
            {
                "icon": "fa-shield-alt",
                "title": "安心のセキュリティ",
                "description": "お客様の大切な情報は、銀行レベルのセキュリティで厳重に保護されています。"
            },
            {
                "icon": "fa-user-tie",
                "title": "専門家のサポート",
                "description": "経験豊富なファイナンシャルプランナーが、お客様の資産運用を全力でサポートします。"
            }
        ]
    }'::jsonb,
    '特徴セクション',
    'サービスの特徴・強みを紹介するセクション',
    4
)
ON CONFLICT (setting_key) DO NOTHING;

-- 更新トリガーの設定
DROP TRIGGER IF EXISTS homepage_content_update_trigger ON homepage_content_settings;
CREATE TRIGGER homepage_content_update_trigger
    BEFORE UPDATE ON homepage_content_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_time();
```

## ✅ 実行確認

マイグレーション実行後、以下で確認：

```sql
-- テーブル作成確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'homepage_content_settings';

-- データ挿入確認
SELECT setting_key, title 
FROM homepage_content_settings 
ORDER BY display_order;
```

## 🚨 注意事項

1. **本番環境**: 本番データベースで実行する前に、必ずバックアップを取得
2. **権限**: Supabaseプロジェクトの管理者権限が必要
3. **確認**: 実行後は管理画面でコンテンツ管理機能をテスト

## 🎉 完了後の効果

- 管理画面のコンテンツ管理機能が正常動作
- 400/404エラーの解消
- ホームページの動的コンテンツ編集が可能に
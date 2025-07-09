# 🚨 緊急修正: 400エラー即座に解決

## 🔧 手順（3分で完了）

### 1. Supabase Dashboardにアクセス
https://supabase.com/dashboard/project/eqirzbuqgymrtnfmvwhq

### 2. SQL Editorを開く
左メニュー → **SQL Editor**

### 3. 以下のSQLをコピー&貼り付け
```sql
-- 既存テーブル削除
DROP TABLE IF EXISTS homepage_content_settings CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;

-- テーブル作成
CREATE TABLE homepage_content_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 権限設定
ALTER TABLE homepage_content_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_content_read_policy" ON homepage_content_settings FOR SELECT USING (true);
CREATE POLICY "admin_settings_read_policy" ON admin_settings FOR SELECT USING (true);

-- データ挿入
INSERT INTO homepage_content_settings (setting_key, setting_data) VALUES 
('first_consultation_offer', '{"title": "初回相談無料"}'),
('footer_data', '{"companyName": "MoneyTicket"}'),
('reasons_to_choose', '{"title": "選ばれる理由"}');

INSERT INTO admin_settings (setting_key, setting_value) VALUES 
('testimonials', '{"title": "お客様の声"}');
```

### 4. 実行
**Run** ボタンをクリック

### 5. 確認
アプリケーションで400エラーが解消されることを確認：
https://moneyticket-d54t4g6e9-seai0520s-projects.vercel.app/

## ✅ 完了後の状態
- ✅ homepage_content_settings テーブル作成済み
- ✅ admin_settings テーブル作成済み  
- ✅ 400エラー解消
- ✅ 結果ページ正常表示

## 🐞 エラーが続く場合
1. ブラウザのキャッシュクリア
2. 5-10分待ってから再確認
3. 別のブラウザで確認

この手順で即座に400エラーが解決されます！
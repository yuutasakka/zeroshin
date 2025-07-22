# Supabase 400エラー修正ガイド

## エラーの原因
`legal_links`テーブルに`display_order`カラムが存在しないため、INSERTクエリが失敗しています。

## 修正手順

### 方法1: 安全な統合スクリプトを実行（推奨）

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 新しいクエリを作成
5. 以下のファイルの内容をコピーして実行：
   ```
   /supabase/migrations/035_safe_create_all_tables.sql
   ```

このスクリプトは：
- 既存のテーブルを壊さない
- 必要なカラムだけを追加
- 初期データを安全に挿入
- エラーが発生しても処理を続行

### 方法2: 個別修正（display_orderカラムのみ）

もし`legal_links`テーブルだけを修正したい場合：

```sql
-- display_orderカラムを追加
ALTER TABLE legal_links ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 既存データにdisplay_orderを設定
UPDATE legal_links 
SET display_order = CASE 
  WHEN link_type = 'privacy_policy' THEN 1
  WHEN link_type = 'terms_of_service' THEN 2
  WHEN link_type = 'specified_commercial_transactions' THEN 3
  WHEN link_type = 'company_info' THEN 4
  ELSE 5
END;
```

### 方法3: テーブルを再作成

既存のデータが不要な場合：

```sql
-- 既存のテーブルを削除
DROP TABLE IF EXISTS legal_links CASCADE;

-- 新しいテーブルを作成
CREATE TABLE legal_links (
  id SERIAL PRIMARY KEY,
  link_type VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSとポリシーを設定
ALTER TABLE legal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON legal_links
  FOR SELECT
  USING (true);

-- デフォルトデータを挿入
INSERT INTO legal_links (link_type, title, url, display_order) VALUES
  ('privacy_policy', 'プライバシーポリシー', '/privacy', 1),
  ('terms_of_service', '利用規約', '/terms', 2),
  ('specified_commercial_transactions', '特定商取引法', '/scta', 3),
  ('company_info', '会社概要', '/company', 4);
```

## 確認方法

実行後、以下のクエリで確認：

```sql
-- テーブル構造の確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'legal_links';

-- データの確認
SELECT * FROM legal_links ORDER BY display_order;
```

## トラブルシューティング

1. **権限エラーの場合**
   - Service Role Keyでアクセスしているか確認
   - RLSポリシーが正しく設定されているか確認

2. **依然として400エラーが出る場合**
   - ブラウザのキャッシュをクリア
   - Vercelを再デプロイ
   - Supabaseのログを確認

3. **他のテーブルでもエラーが出る場合**
   - `/supabase/migrations/035_safe_create_all_tables.sql`を実行
   - これにより全ての必要なテーブルが作成されます
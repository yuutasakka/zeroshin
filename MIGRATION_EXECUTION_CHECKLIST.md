# 🚀 Supabaseマイグレーション実行チェックリスト

## ⚠️ **実行前の重要確認事項**

### 📋 **事前チェック**

- [ ] **本番環境のバックアップ取得**
  ```sql
  -- PostgreSQLダンプ（Supabase Dashboard → Database → Backups）
  -- または CLI経由でのバックアップ
  ```

- [ ] **Supabaseプロジェクトの確認**
  - [ ] 正しいプロジェクトにログインしているか
  - [ ] 管理者権限があるか
  - [ ] データベース接続が正常か

- [ ] **依存関係の確認**
  - [ ] 他のテーブルへの影響なし
  - [ ] 既存データとの整合性問題なし

---

## 🎯 **実行方法**

### **方法1: Supabase Dashboard（推奨）**

1. **ログインとプロジェクト選択**
   ```
   1. https://supabase.com/dashboard にアクセス
   2. AI ConectXプロジェクトを選択
   ```

2. **SQL Editor実行**
   ```
   1. 左サイドバー → "SQL Editor"
   2. "New query" をクリック
   3. 以下のSQLをコピー＆ペースト
   ```

3. **実行するSQL**
   ```sql
   -- 1. 関数作成
   CREATE OR REPLACE FUNCTION update_modified_time()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = CURRENT_TIMESTAMP;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   -- 2. テーブル作成（既存の場合はスキップ）
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

   -- 3. インデックス作成
   CREATE INDEX IF NOT EXISTS idx_homepage_content_key ON homepage_content_settings(setting_key);
   CREATE INDEX IF NOT EXISTS idx_homepage_content_active ON homepage_content_settings(is_active);
   CREATE INDEX IF NOT EXISTS idx_homepage_content_order ON homepage_content_settings(display_order);

   -- 4. RLS有効化
   ALTER TABLE homepage_content_settings ENABLE ROW LEVEL SECURITY;

   -- 5. ポリシー作成
   CREATE POLICY "homepage_content_read_policy" ON homepage_content_settings
       FOR SELECT USING (true);

   CREATE POLICY "homepage_content_write_policy" ON homepage_content_settings
       FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

   -- 6. 初期データ挿入
   INSERT INTO homepage_content_settings (
       setting_key, setting_data, title, description, display_order
   ) VALUES 
   (
       'main_visual_data',
       '{
           "title": "あなたの未来を一緒に描こう♪",
           "subtitle": "無料相談で理想の資産運用プランを見つけませんか？",
           "description": "AI ConectXで、あなたの夢や目標に合わせた最適な資産運用戦略を専門家と一緒に作りましょう。",
           "buttonText": "無料診断を始める",
           "image_url": "/images/main-visual.jpg"
       }'::jsonb,
       'メインビジュアル設定',
       'トップページのメインビジュアル（ヒーローセクション）の内容設定',
       1
   ) ON CONFLICT (setting_key) DO NOTHING;

   -- 7. トリガー設定
   DROP TRIGGER IF EXISTS homepage_content_update_trigger ON homepage_content_settings;
   CREATE TRIGGER homepage_content_update_trigger
       BEFORE UPDATE ON homepage_content_settings
       FOR EACH ROW
       EXECUTE FUNCTION update_modified_time();
   ```

4. **実行とエラー確認**
   ```
   1. "Run" ボタンをクリック
   2. 緑色の成功メッセージを確認
   3. エラーがある場合は赤色で表示される
   ```

---

### **方法2: Supabase CLI**

```bash
# 1. Supabase CLIのインストール（未インストールの場合）
npm install -g supabase

# 2. プロジェクトにログイン
supabase login

# 3. プロジェクト初期化（初回のみ）
supabase init

# 4. プロジェクトリンク
supabase link --project-ref [YOUR_PROJECT_REF]

# 5. マイグレーション実行
supabase db push
```

---

## ✅ **実行後の確認**

### **1. テーブル作成確認**
```sql
-- テーブル存在確認
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'homepage_content_settings';

-- 期待結果: homepage_content_settings | BASE TABLE
```

### **2. 初期データ確認**
```sql
-- データ挿入確認
SELECT setting_key, title, display_order 
FROM homepage_content_settings 
ORDER BY display_order;

-- 期待結果: main_visual_data行が存在
```

### **3. RLSポリシー確認**
```sql
-- ポリシー存在確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'homepage_content_settings';

-- 期待結果: 2つのポリシーが存在
```

### **4. トリガー確認**
```sql
-- トリガー存在確認
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE event_object_table = 'homepage_content_settings';

-- 期待結果: homepage_content_update_trigger | UPDATE | BEFORE
```

---

## 🚨 **エラー対処法**

### **よくあるエラーと対処法**

#### **「関数が既に存在します」エラー**
```sql
-- 解決策: OR REPLACEで上書き
CREATE OR REPLACE FUNCTION update_modified_time()
```

#### **「テーブルが既に存在します」エラー**
```sql
-- 解決策: IF NOT EXISTSで重複回避
CREATE TABLE IF NOT EXISTS homepage_content_settings
```

#### **「ポリシーが既に存在します」エラー**
```sql
-- 解決策: 既存ポリシーを削除してから作成
DROP POLICY IF EXISTS "homepage_content_read_policy" ON homepage_content_settings;
CREATE POLICY "homepage_content_read_policy" ON homepage_content_settings
    FOR SELECT USING (true);
```

#### **「権限不足」エラー**
- Supabaseプロジェクトの管理者権限を確認
- 正しいプロジェクトにアクセスしているか確認

---

## 🎉 **完了確認**

### **管理画面での動作確認**
1. **AI ConectX管理画面にログイン**
2. **コンテンツ管理セクションにアクセス**
3. **エラーが発生しないことを確認**
4. **データの読み込みが正常に動作することを確認**

### **成功指標**
- [ ] 管理画面でコンテンツ管理機能が動作
- [ ] 400/404エラーが解消
- [ ] データの読み書きが正常
- [ ] エラーログにSupabaseエラーが出ない

---

## 📞 **トラブル時の対応**

### **サポートが必要な場合**
1. **エラーメッセージの詳細をコピー**
2. **実行したSQLステップを記録**
3. **Supabase Dashboard → Logsでエラー詳細確認**
4. **必要に応じてSupabaseサポートに連絡**

### **ロールバック手順**
```sql
-- 緊急時のテーブル削除（注意：データが失われます）
DROP TABLE IF EXISTS homepage_content_settings CASCADE;
DROP FUNCTION IF EXISTS update_modified_time() CASCADE;
```

---

**🎯 このマイグレーションの実行により、管理画面のコンテンツ管理機能が正常に動作するようになります。**
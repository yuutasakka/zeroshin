# 🚨 Supabase 401エラー緊急修正手順

## 問題状況
本番サイトでSupabase 401 Unauthorizedエラーが多数発生しています。これはRow Level Security (RLS)設定が原因です。

## 🔧 緊急修正手順

### 1. Supabaseダッシュボードにアクセス
1. https://supabase.com/dashboard にログイン
2. `eqirzbuqgymrtnfmvwhq` プロジェクトを選択
3. 左メニューから「SQL Editor」をクリック

### 2. 緊急修正SQLを実行
以下のSQLコードをコピーして「SQL Editor」で実行してください：

```sql
-- 緊急対応: 全テーブルのRLSを無効化してサイトを即座に動作させる
-- 注意: セキュリティを一時的に犠牲にして動作を優先

-- 方法1: 既知のテーブル名でRLS無効化
ALTER TABLE IF EXISTS legal_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS homepage_content_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_planners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expert_contact_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diagnosis_sessions DISABLE ROW LEVEL SECURITY;

-- 方法2: 動的にすべてのテーブルのRLSを無効化
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- public スキーマのすべてのテーブルに対してRLSを無効化
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_record.tablename);
            RAISE NOTICE 'RLS disabled for table: %', table_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to disable RLS for table: % (Error: %)', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 確認: RLSが有効なテーブルをチェック
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

SELECT 'Emergency RLS disable completed - site should work now' as status;
```

### 3. 実行手順
1. 上記のSQLコードを全選択してコピー
2. Supabase SQL Editorにペースト
3. 「RUN」ボタンをクリック
4. 成功メッセージを確認

### 4. 結果確認
- 最後のクエリで「Emergency RLS disable completed - site should work now」が表示されれば成功
- RLSが有効なテーブルの一覧が空であることを確認

## ✅ 修正後の確認事項

### サイト動作確認
1. **本番URL**: https://moneyticket01-4adnl1dou-seai0520s-projects.vercel.app
2. **コンソールエラー**: 401エラーが消えていることを確認
3. **データ読み込み**: ページが正常に表示されることを確認

### 機能テスト
- [ ] トップページの表示
- [ ] 診断フォームの動作
- [ ] SMS認証の動作
- [ ] 専門家相談の表示

## 🔒 セキュリティに関する注意

### ⚠️ 重要な注意事項
- **この修正はセキュリティを一時的に無効化します**
- **本番環境では必要最小限の期間のみ使用してください**
- **後日、適切なRLSポリシーを再設定してください**

### 今後の対応予定
1. **アクセスパターン分析**: どのテーブルがパブリックアクセス必要か確認
2. **RLSポリシー再設計**: 適切なセキュリティレベルで再設定
3. **段階的有効化**: テーブルごとに順次RLS再有効化

## 📞 サポート情報

### 問題が解決しない場合
1. **Supabaseログ確認**: Dashboard > Logs でエラー詳細確認
2. **Network タブ確認**: ブラウザのデベロッパーツールで401エラー詳細確認
3. **環境変数確認**: Vercelで`VITE_SUPABASE_ANON_KEY`が設定されているか確認

### 緊急連絡先
- Supabase サポート: https://supabase.com/support
- Vercel サポート: https://vercel.com/help

---

**この修正により、サイトは即座に正常動作するはずです。セキュリティ設定は後で適切に再調整してください。**
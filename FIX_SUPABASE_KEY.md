# Supabase認証キーの設定方法

## エラーの原因
管理画面の新規登録でエラーが発生している原因は、`VITE_SUPABASE_ANON_KEY`が設定されていないためです。

## 解決方法

### 1. Supabaseダッシュボードからキーを取得
1. [Supabase Dashboard](https://app.supabase.com)にアクセス
2. プロジェクトを選択
3. 左側メニューの「Settings」→「API」をクリック
4. 「Project API keys」セクションから以下をコピー：
   - `anon public`: これが`VITE_SUPABASE_ANON_KEY`です

### 2. .env.localファイルに追加
```bash
# .env.localファイルを編集
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（実際のキーをここに貼り付け）
```

### 3. アプリケーションを再起動
```bash
npm run dev
```

## 確認済みの事項
- ✅ `admin_registrations`テーブルは正しく作成されている
- ✅ RLSポリシーは適切に設定されている
- ✅ テストデータの挿入は成功している
- ❌ APIキーが設定されていないため、フロントエンドからアクセスできない

## セキュリティ注意事項
- `VITE_SUPABASE_ANON_KEY`は公開しても安全なキーです（RLSで保護されているため）
- ただし、`.env.local`ファイルはGitにコミットしないでください
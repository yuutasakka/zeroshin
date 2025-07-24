# 管理者アカウント設定ガイド

このドキュメントでは、タスカル管理画面にアクセスするための管理者アカウントの設定方法を説明します。

## 管理者情報

**ユーザー名**: admin  
**パスワード**: zg79juX!3ij5  
**メールアドレス**: admin@taskal.jp  
**権限**: super_admin

## セットアップ方法

### 方法1: 自動スクリプトを使用（推奨）

1. 環境変数を設定:
```bash
# .envファイルに追加
VITE_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. スクリプト実行:
```bash
npm run create-admin-user
```

### 方法2: Supabase管理画面で手動実行

1. Supabase管理画面にログイン
2. SQL Editorを開く
3. 以下のいずれかのファイルの内容をコピー&ペースト:
   - `/supabase/sql/admin_minimal.sql` (最小限・推奨)
   - `/supabase/sql/insert_admin_simple.sql` (基本版)
   - `/supabase/sql/admin_with_phone.sql` (phone_number必須の場合)
   - `/supabase/sql/admin_with_backup_code.sql` (phone_number+backup_code必須の場合)
   - `/supabase/sql/insert_admin_user.sql` (完全版)
4. 実行ボタンをクリック

**注意**: テーブル構造によってはエラーが出る場合があります。その場合は `admin_minimal.sql` を使用してください。

## セキュリティ考慮事項

### パスワードハッシュ化
- パスワードはbcrypt（ソルトラウンド12）でハッシュ化されています
- 元のパスワード: `zg79juX!3ij5`
- ハッシュ値: `$2b$12$2.XNU3sFZZ3CMiZoUYeFJOnTi89Tpwe7eKQJLY/cMizD1Id9.VZ7m`

### アクセス制御
- `is_active`: アカウントの有効/無効切り替え
- `login_attempts`: ログイン試行回数（ブルートフォース攻撃対策）
- `locked_until`: アカウントロック期限

### データベーステーブル構造
```sql
admin_credentials (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## 管理画面アクセス

1. ブラウザで管理画面にアクセス:
   `https://your-domain.com/admin`

2. ログイン情報を入力:
   - ユーザー名: `admin`
   - パスワード: `zg79juX!3ij5`

3. 「ログイン」ボタンをクリック

## トラブルシューティング

### ログインできない場合

1. **パスワードが間違っている**
   - 大文字小文字、記号を正確に入力
   - コピー&ペーストを使用することを推奨

2. **アカウントがロックされている**
   - SQLで確認: `SELECT * FROM admin_credentials WHERE username = 'admin';`
   - ロック解除: `UPDATE admin_credentials SET locked_until = NULL, login_attempts = 0 WHERE username = 'admin';`

3. **アカウントが無効になっている**
   - 有効化: `UPDATE admin_credentials SET is_active = TRUE WHERE username = 'admin';`

### データベースエラーの場合

1. **テーブルが存在しない**
   - SQLファイルを再実行: `/supabase/sql/insert_admin_user.sql`

2. **権限エラー**
   - Service Role Keyが正しく設定されているか確認

3. **カラムが存在しないエラー (例: "column email does not exist")**
   - 最小限のSQLを使用: `/supabase/sql/admin_minimal.sql`
   - または既存のテーブル構造を確認してカラムを追加:
     ```sql
     ALTER TABLE admin_credentials ADD COLUMN email VARCHAR(255);
     ```

4. **phone_number NOT NULL制約エラー**
   - phone_numberが必須の場合: `/supabase/sql/admin_with_phone.sql` を使用
   - または電話番号なしで作成: `/supabase/sql/admin_minimal.sql` を使用

5. **backup_code NOT NULL制約エラー**
   - backup_codeも必須の場合: `/supabase/sql/admin_with_backup_code.sql` を使用

6. **テーブル構造の不整合**
   - テーブル修正SQLを実行: `/supabase/sql/fix_admin_credentials.sql`

## パスワード変更方法

セキュリティ向上のため、初回ログイン後にパスワードを変更することを推奨します:

1. 管理画面にログイン
2. 「設定」→「パスワード変更」
3. 新しいパスワードを入力
4. 変更を保存

または、SQLで直接更新:
```sql
UPDATE admin_credentials 
SET password_hash = '$2b$12$新しいハッシュ値'
WHERE username = 'admin';
```

## 注意事項

- この情報は機密情報です。安全に管理してください
- 定期的にパスワードを変更してください
- 不要になったアカウントは無効化してください
- ログイン履歴を定期的に確認してください

## ファイル構成

```
/supabase/sql/
├── admin_minimal.sql           # 最小限の管理者挿入SQL
├── insert_admin_simple.sql    # 基本版
├── admin_with_phone.sql        # phone_number必須版
├── admin_with_backup_code.sql  # phone_number+backup_code必須版
├── insert_admin_user.sql       # 完全版
/scripts/
├── create-admin-user.ts        # 管理者作成スクリプト
/docs/
├── ADMIN_SETUP.md             # この文書
```
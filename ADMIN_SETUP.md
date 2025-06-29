# MoneyTicket 管理者認証システムセットアップガイド

## 概要

MoneyTicketアプリケーションには、Supabaseデータベースと連携した安全な管理者認証システムが実装されています。このガイドでは、管理者認証システムのセットアップと使用方法について説明します。

## 🚀 クイックスタート

### デモモード（Supabase設定なし）

Supabaseを設定せずにデモモードで管理者認証を試すことができます：

**デフォルト管理者認証情報:**
- ユーザー名: `admin`
- パスワード: `MoneyTicket2024!`

### 本格運用（Supabase設定あり）

本格的な運用には、Supabaseプロジェクトの設定が必要です。

## 📋 セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトURL、anon key、service role keyを取得

### 2. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定：

```bash
# Supabase設定
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# または Vite形式
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. データベースマイグレーション

Supabaseプロジェクトに以下のSQLを実行：

```sql
-- supabase/migrations/001_create_admin_system.sql の内容を実行
```

または、Supabase CLIを使用：

```bash
# Supabase CLIをインストール
npm install -g supabase

# プロジェクトと連携
supabase init
supabase link --project-ref your-project-id

# マイグレーションを実行
supabase db push
```

### 4. 初期管理者アカウントの確認

マイグレーション実行後、以下の初期管理者アカウントが作成されます：

- **ユーザー名**: `admin`
- **パスワード**: `MoneyTicket2024!`
- **電話番号**: `+819012345678`

## 🔧 管理者認証システムの機能

### セキュリティ機能

- **パスワードハッシュ化**: SHA-256によるパスワードハッシュ化
- **ログイン試行制限**: 5回の失敗でアカウントロック（15分間）
- **セッション管理**: 30分間のセッションタイムアウト
- **監査ログ**: すべてのログイン試行と管理者操作を記録

### データベーステーブル

1. **admin_credentials**: 管理者認証情報
2. **admin_login_attempts**: ログイン試行履歴
3. **audit_logs**: システム監査ログ

## 🎯 使用方法

### 管理者ログイン

1. アプリケーションで管理者ログインページにアクセス
2. ユーザー名とパスワードを入力
3. ログイン成功後、管理画面にアクセス可能

### パスワード変更

```sql
-- Supabaseで直接パスワードを変更する場合
UPDATE admin_credentials 
SET password_hash = 'new_sha256_hash',
    password_changed_at = NOW(),
    updated_at = NOW()
WHERE username = 'admin';
```

### 新しい管理者の追加

```sql
INSERT INTO admin_credentials (
    username, 
    password_hash, 
    phone_number, 
    backup_code
) VALUES (
    'new_admin',
    'sha256_hash_of_password',
    '+819012345678',
    'BACKUP-CODE-' || extract(epoch from now())::text
);
```

## 🛡️ セキュリティのベストプラクティス

### 本番環境での推奨事項

1. **強力なパスワード**: 12文字以上、大小英数字+記号
2. **定期的なパスワード変更**: 3ヶ月ごと
3. **IP制限**: 必要に応じてアクセス元IPを制限
4. **2要素認証**: 将来的な実装を検討
5. **ログ監視**: 不審なログイン試行の監視

### 環境変数の管理

- `.env`ファイルをGitにコミットしない
- 本番環境では環境変数を暗号化
- 定期的なキーローテーション

## 🔍 トラブルシューティング

### よくある問題

#### 1. Supabase接続エラー

**症状**: ログイン時に接続エラーが発生
**解決策**: 
- 環境変数が正しく設定されているか確認
- SupabaseプロジェクトのURLとキーを再確認
- ネットワーク接続を確認

#### 2. デモモードから抜け出せない

**症状**: 正しい環境変数を設定してもデモモードのまま
**解決策**:
- ブラウザのキャッシュをクリア
- アプリケーションを再起動
- 環境変数の形式を確認（REACT_APP_ または VITE_）

#### 3. ログイン試行制限

**症状**: アカウントがロックされて解除されない
**解決策**:
```sql
-- データベースで直接ロックを解除
UPDATE admin_credentials 
SET failed_attempts = 0, 
    locked_until = NULL 
WHERE username = 'admin';
```

## 📊 監査とログ

### ログイン試行の確認

```sql
SELECT * FROM admin_login_attempts 
WHERE username = 'admin' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 監査ログの確認

```sql
SELECT * FROM audit_logs 
WHERE event_type LIKE 'admin_%' 
ORDER BY created_at DESC 
LIMIT 20;
```

## 🔄 アップデート

システムのアップデート時は以下を確認：

1. データベーススキーマの変更
2. セキュリティ設定の更新
3. 新機能の環境変数追加

## 📞 サポート

問題が発生した場合：

1. このドキュメントのトラブルシューティングを確認
2. Supabaseプロジェクトの設定を再確認
3. 開発チームに連絡

---

**注意**: このシステムは開発・テスト用途に最適化されています。本番環境では追加のセキュリティ対策を実装することを強く推奨します。 
# 🚀 Zeroshin Admin - Supabase セットアップガイド

## 📋 概要

このガイドでは、Zeroshin Admin システムのSupabaseデータベース設定手順を説明します。

## 🔧 セットアップ手順

### 1. Supabaseプロジェクトの準備

1. **Supabaseコンソール**にログインし、新しいプロジェクトを作成
2. **Settings > API**から以下の情報を取得：
   - `Project URL`
   - `Project API Key (anon key)`
   - `Service Role Key`（管理者機能用）

### 2. 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.local.template .env.local

# 必要な値を設定
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. データベーススキーマの作成

**Supabaseコンソール**の**SQL Editor**で以下のスクリプトを順番に実行：

#### Step 1: メインスキーマの作成
```sql
-- schema.sqlの内容をコピー&ペーストして実行
```

#### Step 2: セキュリティポリシーの設定
```sql
-- rls_policies.sqlの内容をコピー&ペーストして実行
```

#### Step 3: 初期管理者ユーザーの作成
```sql
-- create_initial_admin.sqlの内容をコピー&ペーストして実行
```

### 4. 認証設定

#### Supabase Auth の設定
1. **Authentication > Settings**で以下を設定：
   - Enable email confirmations: `ON`
   - Enable phone confirmations: `OFF`（SMSはカスタム実装）
   - Site URL: `http://localhost:5173` (開発) / `https://yourdomain.com` (本番)

#### 初期管理者ユーザーの作成
```javascript
// ブラウザのコンソールで実行
const { data, error } = await supabase.auth.admin.createUser({
  email: "admin@zeroshin.com",
  password: "ZeroShin2024!Admin", // 本番では必ず変更
  email_confirm: true
});
```

### 5. Storage設定（画像アップロード用）

1. **Storage**で新しいバケットを作成：
   - Name: `profile-images`
   - Public: `true`

2. **Policies**でアップロードポリシーを設定：
```sql
-- プロフィール画像のアップロード許可
CREATE POLICY "Anyone can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images');

-- プロフィール画像の参照許可
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');
```

## 🔒 セキュリティ設定

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されています：

- ✅ **管理者のみアクセス可能**: `system_settings`, `audit_logs`
- ✅ **ユーザー分離**: `diagnosis_sessions`, `phone_verifications`
- ✅ **承認フロー**: `admin_registrations`, `pending_admin_approvals`

### 開発環境での一時的なRLS無効化（必要時のみ）

```sql
-- 開発時のみ実行（本番環境では禁止）
ALTER TABLE admin_registrations DISABLE ROW LEVEL SECURITY;

-- 開発完了後は必ず再有効化
ALTER TABLE admin_registrations ENABLE ROW LEVEL SECURITY;
```

## 📊 データベーステーブル構成

### 主要テーブル

| テーブル名 | 用途 | RLS |
|-----------|------|-----|
| `phone_verifications` | 電話番号認証 | ✅ |
| `system_settings` | システム設定 | ✅ |
| `admin_credentials` | 管理者認証情報 | ✅ |
| `admin_login_attempts` | ログイン履歴 | ✅ |
| `audit_logs` | 監査ログ | ✅ |
| `diagnosis_sessions` | 診断セッション | ✅ |
| `admin_registrations` | 管理者登録申請 | ✅ |

### インデックス最適化

パフォーマンス向上のため、以下のインデックスが作成されます：

- 電話番号による高速検索
- 管理者ユーザー名による認証
- 日時による履歴データ検索

## 🧪 動作確認

### 1. データベース接続テスト

```javascript
// ブラウザのコンソールで実行
const { data, error } = await supabase
  .from('system_settings')
  .select('*');

console.log('Connection test:', { data, error });
```

### 2. 管理者ログインテスト

```javascript
// 初期管理者でのログインテスト
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@zeroshin.com',
  password: 'ZeroShin2024!Admin'
});

console.log('Login test:', { data, error });
```

### 3. RLSポリシーのテスト

```javascript
// 管理者権限でのシステム設定取得
const { data, error } = await supabase
  .from('system_settings')
  .select('*');

console.log('Admin access test:', { data, error });
```

## 📁 ファイル構成

```
admin/supabase/
├── schema.sql                 # データベーススキーマ
├── rls_policies.sql          # セキュリティポリシー
├── create_initial_admin.sql  # 初期管理者作成
└── SETUP_GUIDE.md           # このガイド

.env.local.template           # 環境変数テンプレート
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. RLS Policy エラー
```
Error: new row violates row-level security policy
```
**解決方法**: 開発環境で一時的にRLSを無効化してテスト

#### 2. Authentication エラー
```
Error: Invalid login credentials
```
**解決方法**: 
- Supabase Authでユーザーが作成されているか確認
- `admin_credentials`テーブルとの連携を確認

#### 3. 環境変数エラー
```
Error: Supabase URL not configured
```
**解決方法**: `.env.local`ファイルの設定を確認

#### 4. CORS エラー
```
Error: Access to fetch blocked by CORS policy
```
**解決方法**: Supabase設定でサイトURLを正しく設定

## 🔄 メンテナンス

### 定期的なタスク

```sql
-- 古いデータの自動削除（定期実行推奨）
SELECT cleanup_old_data();

-- データベース統計の更新
ANALYZE;

-- インデックスの再構築（必要に応じて）
REINDEX INDEX CONCURRENTLY idx_phone_verifications_phone;
```

### バックアップ

```bash
# Supabaseではバックアップは自動実行
# 手動バックアップが必要な場合はSupabaseコンソールから実行
```

## ⚠️ 本番環境での注意事項

### セキュリティチェックリスト

- [ ] 初期管理者パスワードの変更
- [ ] JWT Secret Keyの本番用生成
- [ ] HTTPS通信の設定
- [ ] SMS/Email送信サービスの設定
- [ ] 定期バックアップの設定
- [ ] 監査ログの監視システム構築
- [ ] レート制限の適切な設定

### パフォーマンス最適化

- [ ] インデックスの効果測定
- [ ] クエリ実行計画の確認
- [ ] データ保持期間の設定
- [ ] キャッシュ戦略の実装

## 🆘 サポート

問題が発生した場合は、以下の情報と共にお問い合わせください：

1. エラーメッセージの詳細
2. 実行したSQL/コードの内容
3. 環境（開発/本番）
4. Supabaseプロジェクトの設定状況

---

**📝 更新履歴**

- 2024-12-XX: 初版作成
- 2024-12-XX: RLSポリシー追加
- 2024-12-XX: トラブルシューティング追加
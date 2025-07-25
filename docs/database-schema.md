# タスカル データベーススキーマ

## 現在使用中のテーブル

### 1. users
ユーザー基本情報を管理
- `id` (UUID) - 主キー
- `phone_number` (TEXT) - 電話番号（ユニーク）
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時
- `last_verified_at` (TIMESTAMP) - 最終認証日時

### 2. diagnosis_results
資金調達力診断の結果を保存
- `id` (UUID) - 主キー
- `user_id` (UUID) - ユーザーID（外部キー）
- `phone_number` (TEXT) - 電話番号
- `diagnosis_data` (JSONB) - 診断データ
- `session_id` (TEXT) - セッションID
- `created_at` (TIMESTAMP) - 作成日時

### 3. sms_verifications
SMS認証のOTPコードを管理
- `id` (UUID) - 主キー
- `phone_number` (TEXT) - 電話番号
- `otp_code` (TEXT) - OTPコード
- `expires_at` (TIMESTAMP) - 有効期限
- `attempts` (INTEGER) - 試行回数
- `is_verified` (BOOLEAN) - 認証済みフラグ
- `verified_at` (TIMESTAMP) - 認証日時
- `request_ip` (TEXT) - リクエストIP
- `created_at` (TIMESTAMP) - 作成日時

### 4. admin_credentials
管理者の認証情報を管理
- `id` (UUID) - 主キー
- `username` (TEXT) - ユーザー名（ユニーク）
- `password_hash` (TEXT) - パスワードハッシュ
- `is_active` (BOOLEAN) - アクティブフラグ
- `role` (TEXT) - ロール（admin/super_admin）
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時
- `last_login_at` (TIMESTAMP) - 最終ログイン日時

### 5. admin_registrations
管理者登録申請を管理
- `id` (UUID) - 主キー
- `username` (TEXT) - ユーザー名
- `password_hash` (TEXT) - パスワードハッシュ
- `email` (TEXT) - メールアドレス
- `status` (TEXT) - ステータス（pending/approved/rejected）
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時
- `approved_at` (TIMESTAMP) - 承認日時
- `approved_by` (TEXT) - 承認者

### 6. audit_logs
システムの監査ログ
- `id` (UUID) - 主キー
- `admin_id` (UUID) - 管理者ID
- `action` (TEXT) - アクション
- `details` (JSONB) - 詳細情報
- `ip_address` (TEXT) - IPアドレス
- `user_agent` (TEXT) - ユーザーエージェント
- `created_at` (TIMESTAMP) - 作成日時

## 削除されたテーブル

以下のテーブルは不要なため削除されました：
- diagnosis_sessions - 古い診断セッション管理
- 各種静的コンテンツ設定テーブル
- 詳細な管理者認証関連テーブル
- 古いユーザープロファイルテーブル

## 注意事項

1. **バックアップ**: テーブル削除前は必ずバックアップを取得してください
2. **外部キー制約**: CASCADEオプションにより関連データも削除されます
3. **最小構成**: 現在のシステムは最小限のテーブル構成で動作します
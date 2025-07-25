# タスカル データベーススキーマ（修正版）

## 現在使用中のテーブル

### 1. ユーザー認証・診断関連

#### users
ユーザー基本情報を管理
- `id` (UUID) - 主キー
- `phone_number` (TEXT) - 電話番号（ユニーク）
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時
- `last_verified_at` (TIMESTAMP) - 最終認証日時

#### diagnosis_results
資金調達力診断の結果を保存
- `id` (UUID) - 主キー
- `user_id` (UUID) - ユーザーID（外部キー）
- `phone_number` (TEXT) - 電話番号
- `diagnosis_data` (JSONB) - 診断データ
- `session_id` (TEXT) - セッションID
- `created_at` (TIMESTAMP) - 作成日時

#### sms_verifications
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

### 2. 管理者関連

#### admin_credentials
管理者の認証情報を管理
- `id` (UUID) - 主キー
- `username` (TEXT) - ユーザー名（ユニーク）
- `password_hash` (TEXT) - パスワードハッシュ
- `is_active` (BOOLEAN) - アクティブフラグ
- `role` (TEXT) - ロール（admin/super_admin）
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時
- `last_login_at` (TIMESTAMP) - 最終ログイン日時

#### admin_registrations
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

#### audit_logs
システムの監査ログ
- `id` (UUID) - 主キー
- `admin_id` (UUID) - 管理者ID
- `action` (TEXT) - アクション
- `details` (JSONB) - 詳細情報
- `ip_address` (TEXT) - IPアドレス
- `user_agent` (TEXT) - ユーザーエージェント
- `created_at` (TIMESTAMP) - 作成日時

### 3. コンテンツ管理関連（管理画面から更新可能）

#### homepage_content_settings
ホームページのコンテンツ設定を管理
- `id` (UUID) - 主キー
- `setting_key` (TEXT) - 設定キー（ユニーク）
- `setting_value` (JSONB) - 設定値
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

#### testimonials
お客様の声を管理
- `id` (UUID) - 主キー
- `name` (TEXT) - お客様名
- `content` (TEXT) - コメント内容
- `rating` (INTEGER) - 評価
- `display_order` (INTEGER) - 表示順
- `is_active` (BOOLEAN) - 表示フラグ
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

#### product_settings
商品・サービス設定を管理
- `id` (UUID) - 主キー
- `product_name` (TEXT) - 商品名
- `description` (TEXT) - 説明
- `features` (JSONB) - 機能一覧
- `pricing` (JSONB) - 価格情報
- `is_active` (BOOLEAN) - 有効フラグ
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

#### financial_planners
ファイナンシャルプランナー情報を管理
- `id` (UUID) - 主キー
- `name` (TEXT) - プランナー名
- `title` (TEXT) - 肩書き
- `bio` (TEXT) - 経歴
- `specialties` (JSONB) - 専門分野
- `photo_url` (TEXT) - 写真URL
- `is_active` (BOOLEAN) - 表示フラグ
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

#### expert_contact_settings
専門家連絡先設定を管理
- `id` (UUID) - 主キー
- `setting_key` (TEXT) - 設定キー
- `contact_info` (JSONB) - 連絡先情報
- `is_active` (BOOLEAN) - 有効フラグ
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

#### security_trust_sections
セキュリティ・信頼性セクションの内容を管理
- `id` (UUID) - 主キー
- `section_key` (TEXT) - セクションキー
- `title` (TEXT) - タイトル
- `content` (JSONB) - コンテンツ
- `display_order` (INTEGER) - 表示順
- `is_active` (BOOLEAN) - 表示フラグ
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

#### call_to_action_sections
CTAセクションの内容を管理
- `id` (UUID) - 主キー
- `section_key` (TEXT) - セクションキー
- `title` (TEXT) - タイトル
- `content` (JSONB) - コンテンツ
- `button_text` (TEXT) - ボタンテキスト
- `button_action` (TEXT) - ボタンアクション
- `is_active` (BOOLEAN) - 表示フラグ
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

#### admin_settings
管理者設定を管理
- `id` (UUID) - 主キー
- `setting_key` (TEXT) - 設定キー
- `setting_value` (JSONB) - 設定値
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

## 削除されたテーブル

以下のテーブルは不要なため削除されました：
- diagnosis_sessions - 古い診断セッション管理
- secure_configs - セキュア設定（使用されていない）
- registration_requests - 古い登録リクエスト
- profiles - 古いユーザープロファイル
- user_roles - ユーザーロール管理
- user_activity_logs - ユーザーアクティビティログ
- 詳細な管理者認証関連テーブル（login_attempts、password_history等）

## 注意事項

1. **バックアップ**: テーブル削除前は必ずバックアップを取得してください
2. **外部キー制約**: CASCADEオプションにより関連データも削除されます
3. **管理画面連携**: コンテンツ管理関連のテーブルは管理画面から更新されるため、削除しないでください
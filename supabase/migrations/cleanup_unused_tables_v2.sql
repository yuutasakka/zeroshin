-- 不要なテーブルを削除するSQLスクリプト（修正版）
-- 実行前に必ずバックアップを取得してください

-- === 削除するテーブル ===

-- 古い診断関連テーブル
DROP TABLE IF EXISTS diagnosis_sessions CASCADE;

-- 古い認証関連テーブル
DROP TABLE IF EXISTS secure_configs CASCADE;
DROP TABLE IF EXISTS registration_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;

-- 管理者の詳細な認証関連（シンプル化のため削除）
DROP TABLE IF EXISTS admin_login_attempts CASCADE;
DROP TABLE IF EXISTS password_history CASCADE;
DROP TABLE IF EXISTS pending_admin_approvals CASCADE;
DROP TABLE IF EXISTS admin_approval_history CASCADE;
DROP TABLE IF EXISTS admin_email_verification CASCADE;
DROP TABLE IF EXISTS admin_sms_verification CASCADE;

-- === 残すテーブル ===

-- 1. ユーザー認証・診断関連
-- users - ユーザー情報（電話番号認証）
-- diagnosis_results - 診断結果
-- sms_verifications - SMS認証コード管理

-- 2. 管理者関連
-- admin_credentials - 管理者認証情報
-- admin_registrations - 管理者登録申請
-- audit_logs - 監査ログ

-- 3. コンテンツ管理関連（管理画面から更新可能）
-- homepage_content_settings - ホームページコンテンツ設定
-- testimonials - お客様の声
-- product_settings - 商品設定
-- financial_planners - ファイナンシャルプランナー情報
-- expert_contact_settings - 専門家連絡先設定
-- security_trust_sections - セキュリティ・信頼性セクション
-- call_to_action_sections - CTAセクション
-- admin_settings - 管理者設定
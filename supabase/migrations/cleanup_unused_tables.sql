-- 不要なテーブルを削除するSQLスクリプト
-- 実行前に必ずバックアップを取得してください

-- 古い診断関連テーブル
DROP TABLE IF EXISTS diagnosis_sessions CASCADE;

-- 静的コンテンツ設定テーブル
DROP TABLE IF EXISTS security_trust_sections CASCADE;
DROP TABLE IF EXISTS expert_contact_settings CASCADE;
DROP TABLE IF EXISTS product_settings CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS homepage_content_settings CASCADE;
DROP TABLE IF EXISTS financial_planners CASCADE;
DROP TABLE IF EXISTS call_to_action_sections CASCADE;

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
DROP TABLE IF EXISTS admin_settings CASCADE;

-- 残すテーブルの確認（コメントアウト）
-- users - ユーザー情報（電話番号認証）
-- diagnosis_results - 診断結果
-- sms_verifications - SMS認証コード管理
-- admin_credentials - 管理者認証情報
-- admin_registrations - 管理者登録申請
-- audit_logs - 監査ログ
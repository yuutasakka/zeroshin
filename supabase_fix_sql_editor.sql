-- ============================================
-- Supabase SQL Editor用の修正スクリプト
-- このスクリプトをSupabaseダッシュボードのSQL Editorで実行してください
-- ============================================

-- 1. 全てのpublicテーブルでRLSを有効化
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- 2. Auth RLS最適化 - sms_verificationsテーブル
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Service role only" ON public.sms_verifications;

-- 最適化されたポリシーを作成
CREATE POLICY "Service role only optimized" ON public.sms_verifications
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- 3. 重複インデックスの削除
DROP INDEX IF EXISTS public.idx_homepage_content_key;

-- 4. RLSポリシーが無いテーブルに基本的なポリシーを追加
-- analytics_settings
CREATE POLICY IF NOT EXISTS "Admin only analytics settings" ON public.analytics_settings
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- user_sessions
CREATE POLICY IF NOT EXISTS "Users can access own sessions" ON public.user_sessions
  FOR ALL USING ((SELECT auth.uid())::text = user_id);

-- notification_settings
CREATE POLICY IF NOT EXISTS "Users can manage own notifications" ON public.notification_settings
  FOR ALL USING ((SELECT auth.uid())::text = user_id);

-- testimonials
CREATE POLICY IF NOT EXISTS "Public read testimonials" ON public.testimonials
  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admin manage testimonials" ON public.testimonials
  FOR INSERT USING ((SELECT auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY IF NOT EXISTS "Admin update testimonials" ON public.testimonials
  FOR UPDATE USING ((SELECT auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY IF NOT EXISTS "Admin delete testimonials" ON public.testimonials
  FOR DELETE USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- product_settings
CREATE POLICY IF NOT EXISTS "Public read product settings" ON public.product_settings
  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admin manage product settings" ON public.product_settings
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- pending_admin_approvals
CREATE POLICY IF NOT EXISTS "Admin only pending approvals" ON public.pending_admin_approvals
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- admin_approval_history
CREATE POLICY IF NOT EXISTS "Admin only approval history" ON public.admin_approval_history
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- affiliate_products
CREATE POLICY IF NOT EXISTS "Public read affiliate products" ON public.affiliate_products
  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admin manage affiliate products" ON public.affiliate_products
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- pricing_plans
CREATE POLICY IF NOT EXISTS "Public read pricing plans" ON public.pricing_plans
  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admin manage pricing plans" ON public.pricing_plans
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- subscriptions
CREATE POLICY IF NOT EXISTS "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING ((SELECT auth.uid())::text = user_id);
CREATE POLICY IF NOT EXISTS "Admin manage all subscriptions" ON public.subscriptions
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- payment_history
CREATE POLICY IF NOT EXISTS "Users can view own payments" ON public.payment_history
  FOR SELECT USING ((SELECT auth.uid())::text = user_id);
CREATE POLICY IF NOT EXISTS "Admin view all payments" ON public.payment_history
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- user_usage_logs
CREATE POLICY IF NOT EXISTS "Users can view own usage" ON public.user_usage_logs
  FOR SELECT USING ((SELECT auth.uid())::text = user_id);
CREATE POLICY IF NOT EXISTS "Admin view all usage" ON public.user_usage_logs
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- user_profiles
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.user_profiles
  FOR SELECT USING ((SELECT auth.uid())::text = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING ((SELECT auth.uid())::text = user_id);
CREATE POLICY IF NOT EXISTS "Admin manage all profiles" ON public.user_profiles
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- admin_sessions
CREATE POLICY IF NOT EXISTS "Admin only sessions" ON public.admin_sessions
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- secure_config
CREATE POLICY IF NOT EXISTS "Admin only secure config" ON public.secure_config
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- security_settings
CREATE POLICY IF NOT EXISTS "Admin only security settings" ON public.security_settings
  FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- 5. 検証：RLSが無効なテーブルを確認
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN c.relrowsecurity THEN 'Enabled'
    ELSE 'DISABLED - NEEDS FIX'
  END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.schemaname = 'public'
ORDER BY rls_status, tablename;
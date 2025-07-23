-- Temporary fix for admin_registrations permissions
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE public.admin_registrations DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON public.admin_registrations TO anon;
GRANT ALL ON public.admin_registrations TO authenticated;
GRANT ALL ON public.admin_registrations TO public;

-- Re-enable RLS with permissive policy
ALTER TABLE public.admin_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read pending registrations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Admins can manage registrations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Allow all operations on admin_registrations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Anyone can read admin_registrations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Anyone can insert admin_registrations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Anyone can update admin_registrations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Anyone can delete admin_registrations" ON public.admin_registrations;

-- Create a single permissive policy
CREATE POLICY "Allow all operations" ON public.admin_registrations
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
-- Temporarily disable RLS for admin_registrations to fix permission issues
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE public.admin_registrations DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to all roles
GRANT ALL PRIVILEGES ON public.admin_registrations TO anon;
GRANT ALL PRIVILEGES ON public.admin_registrations TO authenticated;
GRANT ALL PRIVILEGES ON public.admin_registrations TO public;

-- Test update query (replace with actual UUID)
-- UPDATE public.admin_registrations 
-- SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
-- WHERE id = 'your-uuid-here';

-- Re-enable RLS with permissive policy
ALTER TABLE public.admin_registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow all operations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Anyone can read admin_registrations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Anyone can insert admin_registrations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Anyone can update admin_registrations" ON public.admin_registrations;
DROP POLICY IF EXISTS "Anyone can delete admin_registrations" ON public.admin_registrations;

-- Create a single, very permissive policy
CREATE POLICY "Allow all operations for all users" ON public.admin_registrations
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Verify the policy was created
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'admin_registrations';
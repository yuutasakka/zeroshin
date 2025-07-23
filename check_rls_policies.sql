-- Check current RLS policies for admin_registrations table

-- Check if RLS is enabled
SELECT schemaname, tablename, rowlevelsecurity 
FROM pg_tables 
WHERE tablename = 'admin_registrations';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'admin_registrations';

-- Check table permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'admin_registrations' 
AND table_schema = 'public';

-- Sample data check
SELECT id, email, status, created_at 
FROM public.admin_registrations 
LIMIT 3;
-- Check current schema of admin_registrations table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_registrations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_registrations'
) as table_exists;
-- Test registration request creation
INSERT INTO public.admin_registrations (
    email,
    password_hash,
    full_name,
    phone_number,
    reason,
    department,
    status
) VALUES (
    'test@example.com',
    'test_hash',
    'テスト ユーザー',
    '09012345678',
    'システムテスト用の申請です',
    'IT部',
    'pending'
);

-- Check the created record
SELECT * FROM public.admin_registrations WHERE email = 'test@example.com';
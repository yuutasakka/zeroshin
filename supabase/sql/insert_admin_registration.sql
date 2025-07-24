-- admin_registrationsテーブルにサンプルデータを挿入

-- 既存データがあれば削除
DELETE FROM admin_registrations WHERE email = 'sales@seai.co.jp';

-- 管理者登録データを挿入
INSERT INTO admin_registrations (
  full_name,
  email,
  company_name,
  department,
  position,
  phone_number,
  reason_for_access,
  status,
  approved_at,
  approved_by,
  created_at,
  updated_at
) VALUES (
  '田中 営業太郎',
  'sales@seai.co.jp',
  '株式会社SEAI',
  '営業部',
  '営業部長',
  '03-1234-5678',
  'タスカル管理画面での顧客管理と分析業務のため',
  'approved',
  NOW(),
  'admin',
  NOW(),
  NOW()
);

-- 結果確認
SELECT 
  full_name,
  email,
  company_name,
  status,
  approved_at,
  created_at
FROM admin_registrations 
WHERE email = 'sales@seai.co.jp';
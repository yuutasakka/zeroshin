-- シンプルなZero神データ更新（Supabase管理画面で実行可能）

-- 1. 専門家情報の更新
UPDATE expert_contact_settings 
SET expert_name = 'Zero神専門アドバイザー',
    description = 'Zero神の認定資金調達コンサルタントが、お客様の資金調達に関するご相談を承ります。',
    phone_number = '0120-123-456',
    email = 'support@zeroshin.jp'
WHERE id = 1;
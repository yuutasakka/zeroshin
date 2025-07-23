-- Fix remaining MoneyTicket branding in database

-- Update reasons_to_choose setting to use AI ConnectX branding
UPDATE public.homepage_content_settings 
SET setting_data = jsonb_set(
    setting_data, 
    '{title}', 
    '"AI ConnectXが選ばれる理由"'
)
WHERE setting_key = 'reasons_to_choose';

-- If the record doesn't exist, insert it
INSERT INTO public.homepage_content_settings (setting_key, setting_data, description)
VALUES (
    'reasons_to_choose',
    '{
        "title": "AI ConnectXが選ばれる理由",
        "subtitle": "多くのお客様から信頼をいただいている、確かな実績をご紹介します",
        "reasons": [
            {
                "iconClass": "fas fa-thumbs-up",
                "title": "お客様満足度",
                "value": "98.8%",
                "description": "継続的なサポートによる高い満足度を実現",
                "animationDelay": "0s"
            },
            {
                "iconClass": "fas fa-users",
                "title": "提携FP数",
                "value": "1,500+",
                "description": "全国の優秀な専門家ネットワーク",
                "animationDelay": "0.5s"
            },
            {
                "iconClass": "fas fa-trophy",
                "title": "相談実績",
                "value": "2,500+",
                "description": "豊富な経験に基づく最適なご提案",
                "animationDelay": "1s"
            }
        ]
    }',
    'AI ConnectXが選ばれる理由セクション'
)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_data = EXCLUDED.setting_data,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- Also check and update any other MoneyTicket references
UPDATE public.homepage_content_settings 
SET setting_data = jsonb_set(
    setting_data, 
    '{title}', 
    '"AI ConnectX"'
)
WHERE setting_data->>'title' LIKE '%MoneyTicket%';

-- Update any descriptions that might contain MoneyTicket
UPDATE public.homepage_content_settings 
SET description = REPLACE(description, 'MoneyTicket', 'AI ConnectX')
WHERE description ILIKE '%MoneyTicket%';

-- Show the updated data
SELECT setting_key, setting_data->>'title' as title, description 
FROM public.homepage_content_settings 
WHERE setting_key = 'reasons_to_choose';
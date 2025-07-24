# 管理者登録データ設定ガイド

このドキュメントでは、admin_registrationsテーブルへのサンプルデータ挿入方法を説明します。

## 挿入されるデータ

**基本情報**
- 氏名: 田中 営業太郎
- メールアドレス: sales@seai.co.jp
- 会社名: 株式会社SEAI
- 部署: 営業部
- 役職: 営業部長
- 電話番号: 03-1234-5678
- アクセス理由: タスカル管理画面での顧客管理と分析業務のため
- ステータス: approved（承認済み）

## セットアップ方法

### 方法1: 自動スクリプトを使用（推奨）

1. 環境変数を設定:
```bash
# .envファイルに追加
VITE_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. スクリプト実行:
```bash
npm run insert-admin-registration
```

### 方法2: Supabase管理画面で手動実行

1. Supabase管理画面にログイン
2. SQL Editorを開く
3. `/supabase/sql/insert_admin_registration.sql` の内容をコピー&ペースト
4. 実行ボタンをクリック

## データベーステーブル構造

```sql
admin_registrations (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  department VARCHAR(255),
  position VARCHAR(255),
  phone_number VARCHAR(20),
  reason_for_access TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(255),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by VARCHAR(255),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## トラブルシューティング

### データ挿入エラーの場合

1. **テーブルが存在しない**
   - マイグレーションファイルを確認
   - テーブル作成SQLを実行

2. **権限エラー**
   - Service Role Keyが正しく設定されているか確認
   - RLS（Row Level Security）ポリシーを確認

3. **重複データエラー**
   - 既存データは自動的に削除されるため、通常は発生しない
   - 手動でデータを削除: `DELETE FROM admin_registrations WHERE email = 'sales@seai.co.jp';`

## データ確認方法

挿入後のデータ確認:
```sql
SELECT 
  full_name,
  email,
  company_name,
  status,
  approved_at,
  created_at
FROM admin_registrations 
WHERE email = 'sales@seai.co.jp';
```

## 注意事項

- このデータは開発・テスト用のサンプルデータです
- 本番環境では実際の管理者情報を使用してください
- メールアドレスは実在するものを使用しています（sales@seai.co.jp）
- ステータスは 'approved' に設定され、即座に承認済み状態になります

## ファイル構成

```
/supabase/sql/
├── insert_admin_registration.sql  # 管理者登録データ挿入SQL
/scripts/
├── insert-admin-registration.ts   # 管理者登録データ挿入スクリプト
/docs/
├── ADMIN_REGISTRATION_SETUP.md   # この文書
```
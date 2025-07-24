# Supabaseデータ更新ガイド - タスカル

このドキュメントでは、投資系データから資金調達系データへの更新方法を説明します。

## 更新内容

### データの変更点
- **商品データ**: 投資商品 → 資金調達方法（融資、ファクタリング等）
- **専門家情報**: ファイナンシャルプランナー → 資金調達コンサルタント
- **成功事例**: 投資成功事例 → 資金調達成功事例
- **FAQ**: 投資に関する質問 → 資金調達に関する質問
- **会社情報**: AIConnectX → タスカル株式会社

## 自動更新スクリプトを使用する方法

### 1. 環境変数の設定

`.env`ファイルに以下を追加：

```bash
# Supabase設定
VITE_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. スクリプト実行

```bash
npm run update-supabase-data
```

このスクリプトが以下を自動実行します：
- 専門家情報の更新
- 商品データの更新（5種類の資金調達方法）
- 成功事例の更新（4件の新しい事例）
- 会社情報の更新
- アドバイザー情報の更新

## Supabase管理画面で手動更新する方法

### 1. 専門家情報の更新

SQL Editorで以下を実行：

```sql
UPDATE expert_contact_settings 
SET expert_name = 'タスカル専門アドバイザー',
    description = 'タスカルの認定資金調達コンサルタントが、お客様の資金調達に関するご相談を承ります。',
    phone_number = '0120-123-456',
    email = 'support@taskal.jp'
WHERE id = 1;
```

### 2. 商品データの更新

Table Editorで`product_settings`テーブルを開き、`product_data`カラムを以下のJSONで更新：

```json
{
  "products": [
    {
      "id": "biz-loan-001",
      "name": "ビジネスローン",
      "type": "loan",
      "description": "中小企業向けの無担保・無保証人融資。オンライン完結で最短即日審査。",
      "interestRate": "3.5%〜18.0%",
      "fundingAmount": "50万円〜1,000万円",
      "approvalTime": "最短即日",
      "company": "ビジネスローン各社",
      "risk_level": "medium"
    },
    {
      "id": "factoring-001",
      "name": "ファクタリング",
      "type": "factoring",
      "description": "売掛債権を現金化するサービス。最短即日で資金調達可能。",
      "interestRate": "手数料2%〜20%",
      "fundingAmount": "30万円〜1億円",
      "approvalTime": "最短2時間",
      "company": "ファクタリング各社",
      "risk_level": "low"
    }
  ]
}
```

### 3. 成功事例の更新

Table Editorで`testimonials`テーブルの既存データを削除し、以下を追加：

| name | age | occupation | testimonial | rating |
|------|-----|------------|-------------|---------|
| 田中 一郎 | 45 | 製造業経営者 | コロナ禍で売上が激減し困っていましたが、タスカルの診断で最適な資金調達方法を提案していただき、3週間で2,000万円の融資を受けることができました。 | 5 |
| 佐藤 美咲 | 38 | IT企業代表 | 創業2年目で銀行からの融資が難しい状況でしたが、ファクタリングという方法を教えていただき、即日で500万円の資金調達に成功。 | 5 |

## 更新後の確認項目

更新後、以下を確認してください：

### フロントエンド
- [ ] 管理画面のログインテキストが「タスカル管理画面」になっている
- [ ] 診断結果画面で資金調達系の商品が表示される
- [ ] 専門家情報が「資金調達コンサルタント」になっている
- [ ] 成功事例が資金調達系になっている

### データベース
- [ ] `expert_contact_settings`テーブルの内容が更新されている
- [ ] `product_settings`テーブルのJSONデータが資金調達系になっている  
- [ ] `testimonials`テーブルに新しい成功事例が入っている
- [ ] `homepage_content_settings`でサービス名が「タスカル」になっている

## ロールバック方法

元のデータに戻す必要がある場合：

```bash
# バックアップファイルがある場合
psql -h your_host -d your_db -f backup_before_taskal_update.sql

# または手動で元のデータを再入力
```

## ファイル構成

```
/data/
├── fundingProductsData.ts     # 新しい資金調達商品データ
├── fundingFAQData.ts         # 新しいFAQデータ
/scripts/
├── update-supabase-data.ts   # 自動更新スクリプト
/supabase/sql/
├── update_taskal_data.sql    # 完全なSQL更新文
├── simple_taskal_update.sql  # 簡易SQL更新文
```

## 注意事項

- 本番環境での実行前に、必ずバックアップを取得してください
- 自動スクリプト実行時は、Service Role Keyが必要です
- 更新後はフロントエンドアプリを再起動してください

## トラブルシューティング

### エラー: "Permission denied"
→ Service Role Keyが正しく設定されているか確認

### エラー: "Table does not exist"
→ テーブル名が正しいか、Supabaseプロジェクトが正しいか確認

### データが反映されない
→ ブラウザキャッシュをクリアしてページを再読み込み
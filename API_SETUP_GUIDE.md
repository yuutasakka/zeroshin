# 🔧 MoneyTicket API設定ガイド

## ❗ 現在のエラーの原因

コンソールに表示されているエラーは**API情報不足**が原因です：

```
❌ GET homepage_content_settings 400 (Bad Request)
❌ POST auth/v1/verify 403 (Forbidden)
```

## 🚀 解決方法

### 1. `.env`ファイルの作成

プロジェクトルートに`.env`ファイルを作成し、以下を設定：

```bash
# 必須: Supabase設定
VITE_SUPABASE_URL=https://eqirzbuqgymrtnfmvwhq.supabase.co
VITE_SUPABASE_ANON_KEY=【ここに実際のキーを設定】
```

### 2. Supabase匿名キーの取得方法

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト `eqirzbuqgymrtnfmvwhq` を選択
3. **Settings** → **API** を開く
4. **Project API Keys** の **anon public** をコピー
5. `.env`ファイルの `VITE_SUPABASE_ANON_KEY` に設定

### 3. Supabaseマイグレーション実行

```bash
# Supabase CLIでマイグレーション実行
npx supabase migration up

# または手動でSQL実行
# supabase/migrations/ 内のSQLファイルをSupabase Dashboardで実行
```

### 4. 必要なテーブル作成確認

以下のテーブルが存在するか確認：
- `homepage_content_settings`
- `diagnosis_sessions` 
- `admin_users`
- `admin_email_verification`

## 🔄 現在の回避策

API設定完了まで、以下の機能で動作します：

### SMS認証
- **認証コード**: `123456` (全環境共通)
- **動作**: Supabaseエラーに関係なく認証可能

### データ表示
- **フォールバック**: ローカルストレージとデフォルトデータ使用
- **エラー表示なし**: 静的コンテンツで正常動作

## 📋 完全セットアップチェックリスト

### 必須項目
- [ ] `.env`ファイル作成
- [ ] `VITE_SUPABASE_ANON_KEY` 設定
- [ ] Supabaseマイグレーション実行
- [ ] `homepage_content_settings`テーブル作成確認

### オプション項目（SMS認証）
- [ ] SupabaseでSMS認証有効化
- [ ] Phone認証プロバイダー設定（Twilio等）
- [ ] 適切な認証権限設定

### オプション項目（その他）
- [ ] セキュリティキー生成・設定
- [ ] メール設定（SendGrid）
- [ ] AI API設定（OpenAI/Gemini）

## 🛠️ トラブルシューティング

### 400エラーが続く場合
1. Supabase URLが正しいか確認
2. テーブルが作成されているか確認
3. RLSポリシーが適切か確認

### 403エラーが続く場合  
1. 匿名キーが正しいか確認
2. SMS認証が有効化されているか確認
3. 権限設定を確認

## 📞 サポート

設定でお困りの場合は、以下の情報をご確認ください：
- `ENVIRONMENT_SETUP.md`
- `SMS_SETUP_GUIDE.md` 
- `MIGRATION_GUIDE.md`
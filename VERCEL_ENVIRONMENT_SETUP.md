# 🚀 Vercel環境変数設定ガイド（完全版）

## 🚨 重要：エラー解決のための必須設定

あなたのアプリで表示されているエラー：
```
Uncaught Error: ENCRYPTION_KEY must be set in production environment
```

これを解決するために、以下の環境変数を**必ず**設定してください。

## 📋 設定すべき環境変数リスト

### 1. セキュリティ関連（必須）⚠️

| 変数名 | 説明 | 生成方法 |
|--------|------|----------|
| `VITE_ENCRYPTION_KEY` | データ暗号化用キー | 32文字のランダム文字列 |
| `VITE_JWT_SECRET` | JWT トークン署名用 | 32文字のランダム文字列 |
| `VITE_SESSION_SECRET` | セッション管理用 | 32文字のランダム文字列 |

### 2. AI/MCP関連（必須）🤖

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `GEMINI_API_KEY` | Google AI API キー | Google AI Studio で取得 |

### 3. Supabase関連（必須）💾

| 変数名 | 説明 | 取得場所 |
|--------|------|----------|
| `VITE_SUPABASE_URL` | SupabaseプロジェクトURL | Supabaseダッシュボード |
| `VITE_SUPABASE_ANON_KEY` | Supabase匿名キー | Supabaseダッシュボード |

## 🔧 ステップバイステップ設定手順

### Step 1: 32文字のセキュリティキーを生成

#### 方法1: オンラインツール使用
1. https://generate-random.org/string-generator にアクセス
2. 「Length」を `32` に設定
3. 「Numbers」「Lowercase」「Uppercase」にチェック
4. 「Generate String」をクリック
5. 生成された文字列をコピー

#### 方法2: ターミナルで生成（Mac/Linux）
```bash
# ENCRYPTION_KEY用
openssl rand -hex 32

# JWT_SECRET用  
openssl rand -hex 32

# SESSION_SECRET用
openssl rand -hex 32
```

#### 方法3: パスワードマネージャー
- 1Password、Bitwarden、LastPass などで32文字のランダムパスワードを生成

### Step 2: Google AI APIキーを取得

1. https://aistudio.google.com にアクセス
2. Googleアカウントでログイン
3. 左メニューの「API Key」をクリック
4. 「Create API Key」ボタンをクリック
5. 生成されたキーをコピー（**絶対に他人に見せないこと**）

### Step 3: Supabase情報を取得

1. https://supabase.com にアクセス
2. あなたのプロジェクト「moneyticket01」を選択
3. 左メニューの「Settings」→「API」をクリック
4. 以下をコピー：
   - **Project URL**（`https://eqirzbuqgymrtnfmvwhq.supabase.co`）
   - **anon public key**（`eyJ...` で始まる長い文字列）

### Step 4: Vercelで環境変数を設定

1. **Vercelにアクセス**
   - https://vercel.com にログイン
   - 「moneyticket」プロジェクトをクリック

2. **環境変数設定画面に移動**
   - 「Settings」タブをクリック
   - 左メニューから「Environment Variables」をクリック

3. **各環境変数を追加**

#### VITE_ENCRYPTION_KEY
- 「Add New」をクリック
- **Name**: `VITE_ENCRYPTION_KEY`
- **Value**: Step1で生成した1つ目の32文字文字列
- **Environment**: `Production`, `Preview`, `Development` 全てチェック
- 「Save」をクリック

#### VITE_JWT_SECRET
- 「Add New」をクリック
- **Name**: `VITE_JWT_SECRET`
- **Value**: Step1で生成した2つ目の32文字文字列
- **Environment**: `Production`, `Preview`, `Development` 全てチェック
- 「Save」をクリック

#### VITE_SESSION_SECRET
- 「Add New」をクリック
- **Name**: `VITE_SESSION_SECRET`
- **Value**: Step1で生成した3つ目の32文字文字列
- **Environment**: `Production`, `Preview`, `Development` 全てチェック
- 「Save」をクリック

#### GEMINI_API_KEY
- 「Add New」をクリック
- **Name**: `GEMINI_API_KEY`
- **Value**: Step2で取得したGoogle AI APIキー
- **Environment**: `Production`, `Preview`, `Development` 全てチェック
- 「Save」をクリック

#### VITE_SUPABASE_URL
- 「Add New」をクリック
- **Name**: `VITE_SUPABASE_URL`
- **Value**: Step3で取得したSupabase URL
- **Environment**: `Production`, `Preview`, `Development` 全てチェック
- 「Save」をクリック

#### VITE_SUPABASE_ANON_KEY
- 「Add New」をクリック
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Step3で取得したSupabase anon key
- **Environment**: `Production`, `Preview`, `Development` 全てチェック
- 「Save」をクリック

## 🔄 デプロイと確認

### Step 5: 再デプロイを待つ
1. 環境変数を保存すると、自動的に再デプロイが開始されます
2. 「Deployments」タブで進行状況を確認
3. 「Ready」状態になるまで待ちます（通常2-3分）

### Step 6: 動作確認
1. 「Visit」ボタンでアプリにアクセス
2. ブラウザの開発者ツール（F12）でConsoleタブを開く
3. エラーメッセージが消えていることを確認
4. 財務診断を実行して、MCP機能をテスト

## 🚨 トラブルシューティング

### よくある間違い

❌ **間違い1**: 環境変数名のスペルミス
- 正：`VITE_ENCRYPTION_KEY`
- 誤：`ENCRYPTION_KEY`, `VITE_ENCRIPTION_KEY`

❌ **間違い2**: 文字列の長さ不足
- セキュリティキーは必ず32文字以上

❌ **間違い3**: Environmentの設定漏れ
- `Production` `Preview` `Development` 全てにチェック

❌ **間違い4**: 余分な文字の混入
- コピペ時に改行や空白が入らないよう注意

### エラーが継続する場合

1. **ブラウザキャッシュクリア**
   ```
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Vercelでフルリビルド**
   - Deployments → 最新のデプロイ → 「...」→ 「Redeploy」

3. **環境変数の確認**
   - Settings → Environment Variables で全ての値が設定されているか確認

## ✅ 設定完了チェックリスト

すべて ✅ になったら完了です：

- [ ] `VITE_ENCRYPTION_KEY` (32文字) を設定
- [ ] `VITE_JWT_SECRET` (32文字) を設定  
- [ ] `VITE_SESSION_SECRET` (32文字) を設定
- [ ] `GEMINI_API_KEY` を設定
- [ ] `VITE_SUPABASE_URL` を設定
- [ ] `VITE_SUPABASE_ANON_KEY` を設定
- [ ] 各変数で Production/Preview/Development 全てにチェック
- [ ] Vercelでの再デプロイが完了
- [ ] アプリにアクセスしてエラーが消えた
- [ ] MCP機能が正常に動作する

## 🔒 セキュリティ注意事項

⚠️ **重要**: 
- 生成したキーやAPIキーは絶対に他人と共有しない
- GitHubなどの公開リポジトリにコミットしない
- 定期的に（3-6ヶ月毎）キーを再生成する

## 📞 サポート

問題が解決しない場合は、以下の情報を含めてお問い合わせください：
- エラーメッセージの全文
- 設定した環境変数のリスト（値は含めない）
- ブラウザ名とバージョン
- デプロイメントのURL

---

**MoneyTicket - セキュアな財務プラットフォーム** 🚀 

## 🔧 必須環境変数

### 基本設定
```bash
# Supabase設定
VITE_SUPABASE_URL=https://eqirzbuqgymrtnfmvwhq.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API設定
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key
```

## 🔒 セキュリティ強化設定（追加）

### 暗号化・認証キー
```bash
# セキュア暗号化キー（32文字以上の強力なランダム文字列）
VITE_ENCRYPTION_KEY=your_32_char_encryption_key_here_random

# JWT署名用秘密鍵（64文字以上推奨）
VITE_JWT_SECRET=your_jwt_secret_key_64_chars_or_more_random_string

# セッション管理用秘密鍵（64文字以上推奨）
VITE_SESSION_SECRET=your_session_secret_key_64_chars_or_more_random

# CSRFトークン用秘密鍵
VITE_CSRF_SECRET=your_csrf_secret_key_32_chars_or_more
```

### SMS/Twilio設定（オプション）
```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## 🚀 キー生成方法

### 1. 自動生成スクリプト使用
```bash
npm run generate-keys
```

### 2. 手動生成
```bash
# 32文字のランダムキー生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 64文字のランダムキー生成
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## ⚠️ セキュリティ注意事項

### 重要な変更点
1. **パスワードハッシュ化**: SHA-256からbcryptに変更済み
2. **CSP強化**: `unsafe-eval`を削除、nonceベース実装推奨
3. **機密情報保護**: 本番環境ではハードコードされたキーを削除

### 本番環境でのベストプラクティス
- すべての環境変数を設定（フォールバック禁止）
- 定期的なキーローテーション（3ヶ月ごと）
- 強力なパスワードポリシーの適用
- ログ監視とアラート設定

### データベース設定
Supabaseで以下を確認してください：
- Row Level Security (RLS) が有効
- 適切なポリシー設定
- 管理者テーブルへのアクセス制限

## 🔍 設定確認方法

1. アプリケーションのログを確認
2. セキュリティヘッダーをブラウザ開発者ツールで確認
3. HTTPS強制が有効か確認
4. CSPエラーがないか確認
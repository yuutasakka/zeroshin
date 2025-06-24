# SMS認証機能 セットアップガイド

このプロジェクトには、Twilioを使用したSMS認証機能が実装されています。

## 機能概要

- 電話番号入力による認証コード送信
- 4桁の認証コード検証
- 日本の携帯電話番号に対応（090, 080, 070）
- デモモード（Twilio未設定時）

## セットアップ手順

### 1. Twilioアカウントの作成

1. [Twilio Console](https://console.twilio.com/) にアクセス
2. アカウントを作成（無料試用版でOK）
3. Phone Number を取得（日本の番号推奨）

### 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の内容を設定：

```env
# Twilio設定
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+815012345678

# サーバー設定
PORT=3001
```

**設定値の取得方法：**
- `TWILIO_ACCOUNT_SID`: Twilio Console > Account Info > Account SID
- `TWILIO_AUTH_TOKEN`: Twilio Console > Account Info > Auth Token
- `TWILIO_PHONE_NUMBER`: Twilio Console > Phone Numbers > 取得した電話番号

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

フロントエンドとバックエンドを同時に起動：

```bash
npm run dev:all
```

または、別々に起動：

```bash
# ターミナル1: フロントエンド
npm run dev

# ターミナル2: バックエンドAPI
npm run dev:server
```

## 使用方法

### 1. デモモード（Twilio未設定時）

Twilioが設定されていない場合、自動的にデモモードで動作します：

1. 電話番号を入力して「認証コードを送信する」をクリック
2. アラートとコンソールに認証コードが表示されます
3. 表示された4桁のコードを入力して認証完了

### 2. 本番モード（Twilio設定済み）

1. 電話番号を入力して「認証コードを送信する」をクリック
2. 入力した電話番号にSMSで認証コードが送信されます
3. 受信した4桁のコードを入力して認証完了

## API エンドポイント

### SMS送信: `POST /api/sms/send`

```json
{
  "phoneNumber": "09012345678"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "SMS認証コードを送信しました",
  "phoneNumber": "+819012345678",
  "demoCode": "1234" // デモモードのみ
}
```

### SMS検証: `POST /api/sms/verify`

```json
{
  "phoneNumber": "09012345678",
  "code": "1234"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "認証が完了しました",
  "verified": true
}
```

### ヘルスチェック: `GET /api/health`

```json
{
  "status": "OK",
  "twilioConfigured": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## トラブルシューティング

### よくある問題

1. **「サーバーとの通信に失敗しました」**
   - バックエンドサーバーが起動しているか確認
   - `npm run dev:server` でサーバーを起動

2. **SMS が届かない**
   - Twilio の電話番号が正しく設定されているか確認
   - 送信先電話番号の形式を確認（090-1234-5678 など）
   - Twilio Console で送信ログを確認

3. **認証コードが無効**
   - 5分以内に入力しているか確認
   - 正確な4桁のコードを入力しているか確認

### デバッグ方法

1. **サーバーログの確認**
   ```bash
   npm run dev:server
   ```

2. **ブラウザのコンソールログ確認**
   - DevTools > Console でエラーメッセージを確認

3. **Twilio ログの確認**
   - Twilio Console > Monitor > Logs

## セキュリティ注意事項

⚠️ **重要**: 本番環境では以下の対策を実施してください：

1. **環境変数の保護**
   - `.env` ファイルをGitにコミットしない
   - 本番環境では安全なシークレット管理システムを使用

2. **レート制限**
   - SMS送信の頻度制限を実装
   - IP アドレスベースの制限

3. **データ保存**
   - インメモリストレージではなく、Redis やデータベースを使用
   - 認証コードの暗号化

4. **ログ管理**
   - 機密情報をログに出力しない
   - 適切なログレベルの設定

## 料金について

- **Twilio SMS**: 送信1件あたり約8円（2024年時点）
- **無料クレジット**: 新規登録時に約2,000円分のクレジット付与
- 詳細は [Twilio Pricing](https://www.twilio.com/pricing) を参照

## サポート

技術的な問題やTwilio設定についてご質問がある場合は、Twilioの公式ドキュメントまたはサポートにお問い合わせください。 
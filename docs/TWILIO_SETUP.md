# Twilio SMS設定ガイド

## 1. Twilioアカウントの作成

1. [Twilio Console](https://console.twilio.com) にアクセス
2. アカウントを作成（無料トライアル可能）
3. 電話番号の認証を完了

## 2. Twilio Console設定

### Account SIDとAuth Tokenの取得
1. Console Dashboard → Account Info
2. `Account SID` と `Auth Token` をコピー

### 電話番号の取得
1. Phone Numbers → Manage → Buy a number
2. 日本の電話番号またはToll-free番号を購入
3. SMS機能が有効な番号を選択

## 3. Vercel環境変数の設定

Vercelプロジェクトの Environment Variables に以下を追加：

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

## 4. 実装詳細

### SMS送信処理
- `api/send-otp.ts`: Twilio REST APIを使用
- 日本の電話番号（090/080/070）を+81国際形式に変換
- OTPは6桁のランダム数字
- 有効期限は5分間

### SMS内容
```
【タスカル】認証コード: 123456

このコードは5分間有効です。第三者には絶対に教えないでください。
```

### エラーハンドリング
- Twilio設定が不完全: 開発モード（コンソール出力のみ）
- SMS送信失敗: 本番環境ではエラー返却
- レート制限: 同一番号への連続送信制限

## 5. テスト方法

### 開発環境
```bash
# ローカルでテスト
npm run dev

# SMS送信テスト
curl -X POST http://localhost:3000/api/send-otp \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_TOKEN" \
  -d '{"phoneNumber":"09012345678"}'
```

### OTP検証テスト
```bash
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_TOKEN" \
  -d '{"phoneNumber":"09012345678","otp":"123456"}'
```

## 6. セキュリティ設定

### Twilio Webhook検証
```javascript
// 将来的な実装案
const webhook = require('twilio').webhook;
const isValid = webhook(authToken, signature, url, params);
```

### IP制限
Twilio Console → Settings → General で許可IPを設定可能

## 7. 本番環境での注意事項

1. **料金**: SMS送信は有料（約$0.0075/通）
2. **レート制限**: Twilioの送信制限に注意
3. **ログ**: 本番では電話番号を完全に秘匿
4. **監視**: SMS送信失敗の監視を設定

## 8. トラブルシューティング

### よくあるエラー

#### 21211: Invalid 'To' phone number
- 電話番号形式が正しくない
- 国際形式（+81）への変換を確認

#### 21608: The number is unverified
- Trial account では認証済み番号のみ送信可能
- 本番アカウントにアップグレードが必要

#### 21614: 'To' number is not a valid mobile number
- 固定電話番号にSMS送信不可
- 携帯電話番号（090/080/070）のみ対応

### デバッグ情報
```bash
# Twilioログの確認
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$ACCOUNT_SID/Messages.json" \
  --data-urlencode "DateSent=2025-01-28" \
  -u $ACCOUNT_SID:$AUTH_TOKEN
```

## 9. 代替SMS送信サービス

Twilio以外の選択肢：
- AWS SNS
- Firebase Cloud Messaging
- 国内SMS事業者（NTTコムなど）

## 10. コスト最適化

- 開発環境: Twilio設定なしでコンソール出力のみ
- ステージング: 限定された番号のみ送信
- 本番環境: フル機能有効
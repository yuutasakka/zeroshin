# 📱 Twilio SMS認証セットアップガイド

MoneyTicketアプリケーションでTwilio SMS認証を完全に機能させるための詳細ガイドです。

## 🚀 1. Twilioアカウントの準備

### 1.1 アカウント作成・ログイン

1. [Twilio](https://www.twilio.com/)にアクセス
2. アカウントを作成またはログイン
3. [Console Dashboard](https://www.twilio.com/console)に移動

### 1.2 認証情報の取得

Console Dashboardから以下の情報を取得：

```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 📞 2. 電話番号の購入

### 2.1 日本の電話番号を購入

1. Console → Phone Numbers → Manage → Buy a number
2. Country: Japan (+81)を選択
3. SMS機能付きの番号を選択
4. 購入を完了

### 2.2 電話番号の設定

購入した番号の形式例：
```
+815012345678  # これを環境変数に設定
```

## 🔧 3. SMS認証の実装

### 3.1 現在の実装の確認

`components/PhoneVerificationPage.tsx`でSMS認証が実装されています：

```typescript
// 現在は開発環境でのみ動作（本番環境では要設定）
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  console.log('開発環境: SMS認証をスキップしています');
} else {
  // 本番環境では実際のSMS認証を実行
  throw new Error('本番環境ではSMS認証が必要です');
}
```

### 3.2 Supabase SMS設定

SupabaseでTwilio SMS認証を有効化：

1. Supabase Dashboard → Authentication → Settings
2. SMS Provider section で "Enable custom SMTP"を選択
3. 以下を設定：

```
Provider: Twilio
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3.3 SMS認証フローの完全実装

以下のコードで`components/PhoneVerificationPage.tsx`を更新：

```typescript
// 本番環境でのSMS送信
const sendSMSVerification = async (phoneNumber: string) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
    options: {
      channel: 'sms'
    }
  });

  if (error) {
    throw new Error(`SMS送信エラー: ${error.message}`);
  }
  
  return true;
};

// OTP検証
const verifyOTPCode = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizePhoneNumber(phone),
    token: token,
    type: 'sms'
  });

  if (error) {
    throw new Error(`認証エラー: ${error.message}`);
  }

  return data;
};
```

## 🛠️ 4. 環境変数の設定

### 4.1 必要な環境変数

```bash
# Twilio設定
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+815012345678

# SMS関連の設定
SMS_RATE_LIMIT_MAX=5          # 5回/15分の制限
SMS_VERIFICATION_TIMEOUT=300  # 5分間のタイムアウト
```

### 4.2 本番環境での設定

#### Vercelの場合：
```bash
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_PHONE_NUMBER
```

#### その他のホスティング：
各プラットフォームの環境変数設定画面で上記の値を設定

## 🔒 5. セキュリティ設定

### 5.1 レート制限

SMS送信のレート制限を設定：

```typescript
// security.config.ts に追加
export const SMS_RATE_LIMITS = {
  MAX_ATTEMPTS: 5,           // 最大試行回数
  WINDOW_MS: 15 * 60 * 1000, // 15分間
  COOLDOWN_MS: 60 * 1000     // 1分間のクールダウン
};
```

### 5.2 電話番号検証

強化された電話番号検証：

```typescript
const validateJapanesePhoneNumber = (phone: string): boolean => {
  // 日本の携帯電話番号パターン
  const patterns = [
    /^(\+81|0)?[789]0-?[0-9]{4}-?[0-9]{4}$/,  // 090/080/070
    /^(\+81|0)?50-?[0-9]{4}-?[0-9]{4}$/       // 050
  ];
  
  return patterns.some(pattern => pattern.test(phone));
};
```

## 📋 6. テスト手順

### 6.1 開発環境でのテスト

```bash
# 1. 依存関係をインストール
npm install

# 2. 環境変数を設定（.env.development）
cp .env.example .env.development

# 3. 開発サーバーを起動
npm run dev

# 4. ブラウザでテスト
# http://localhost:5173 にアクセス
```

### 6.2 SMS機能のテスト

1. **電話番号入力**: 有効な日本の携帯電話番号を入力
2. **SMS送信**: 「認証コードを送信」ボタンをクリック
3. **コード受信**: 携帯電話にSMSが届くことを確認
4. **コード入力**: 受信したコードを入力
5. **認証完了**: 次のページに遷移することを確認

### 6.3 本番環境でのテスト

```bash
# セキュリティチェック
npm run security-check

# ビルドテスト
npm run build

# 本番デプロイ
vercel --prod
```

## 🚨 7. トラブルシューティング

### 7.1 よくある問題

#### SMSが届かない
- [ ] Twilioアカウントの残高を確認
- [ ] 電話番号が正しい形式か確認
- [ ] Supabaseの設定が正しいか確認
- [ ] レート制限にかかっていないか確認

#### 認証コードエラー
- [ ] コードの有効期限（5分）を確認
- [ ] 入力した番号とSMS送信先が一致するか確認
- [ ] Supabaseの認証設定を確認

#### 開発環境で動かない
- [ ] 環境変数が正しく設定されているか確認
- [ ] NODE_ENVが適切に設定されているか確認

### 7.2 ログの確認

#### フロントエンドログ
```javascript
// ブラウザの開発者ツールのConsoleで確認
console.log('SMS認証の状態:', smsStatus);
```

#### バックエンドログ
```bash
# サーバーログの確認
tail -f logs/combined.log

# Supabaseのログ確認
# Supabase Dashboard → Logs
```

### 7.3 デバッグ手順

1. **ネットワークタブ**でAPI通信を確認
2. **Console**でJavaScriptエラーを確認
3. **Supabase Dashboard**で認証ログを確認
4. **Twilio Console**でSMS送信ログを確認

## 📊 8. 監視とメトリクス

### 8.1 SMS送信の監視

Twilio Consoleで以下を監視：
- 送信成功率
- 配信時間
- エラーメッセージ
- 使用料金

### 8.2 アプリケーションメトリクス

監視すべき指標：
- SMS認証の成功率
- 認証完了までの時間
- エラー発生率
- ユーザー体験の改善点

## 🔄 9. 運用とメンテナンス

### 9.1 定期的なチェック

- [ ] Twilioアカウントの残高確認（月1回）
- [ ] SMS送信ログの確認（週1回）
- [ ] エラーレートの監視（日次）
- [ ] セキュリティ設定の見直し（月1回）

### 9.2 スケーリング

大量のSMS送信が必要な場合：
1. Twilioの送信レート制限を確認
2. 複数の電話番号の購入を検討
3. メッセージキューの導入
4. 負荷分散の実装

## 💰 10. コスト管理

### 10.1 SMS送信料金

日本向けSMS料金（2024年現在）：
- 国内SMS: 約$0.0589/通
- 国際SMS: 約$0.0589/通

### 10.2 コスト最適化

- 不正利用の防止（レート制限）
- 無効な番号への送信回避
- 送信失敗時の再試行制限
- 定期的な使用量レビュー

---

## 📞 サポート

問題が発生した場合：

1. **Twilioサポート**: [Twilio Help Center](https://support.twilio.com/)
2. **Supabaseサポート**: [Supabase Docs](https://supabase.com/docs)
3. **アプリケーションログ**: `logs/combined.log`を確認

このガイドに従って設定すれば、MoneyTicketで完全なSMS認証機能が利用できるようになります。
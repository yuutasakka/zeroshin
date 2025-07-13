# SMS認証機能セットアップガイド

このドキュメントでは、AI ConectXアプリケーションにSMS認証機能を実装するための詳細な手順を説明します。

## 🚀 概要

診断結果を表示する前にSMS認証を必須とすることで、以下のメリットがあります：

- **セキュリティ向上**: 本人確認によりなりすましを防止
- **データ品質向上**: 有効な電話番号のみを収集
- **ユーザー体験向上**: 認証済みユーザーのみが結果を閲覧

## 📋 前提条件

- Supabaseプロジェクトが作成済み
- Twilioアカウントが作成済み
- 本番環境での電話番号認証が有効

## 🔧 1. Twilioアカウントの設定

### 1.1 Twilioコンソールでの設定

1. [Twilio Console](https://console.twilio.com/) にログイン
2. **Phone Numbers** > **Manage** > **Buy a number** で日本の電話番号を購入
3. **Settings** > **General** でAccount SIDとAuth Tokenを確認
4. **Messaging** > **Services** で新しいMessaging Serviceを作成（推奨）

### 1.2 必要な情報の収集

以下の情報をメモしてください：

```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Messaging Service SID: MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
または
From Phone Number: +815012345678
```

## 🔧 2. Supabaseでの設定

### 2.1 SMS認証の有効化

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. **Authentication** > **Settings** に移動
4. **SMS** タブを選択

### 2.2 Twilio設定の入力

**Provider**: Twilio を選択

**Account SID**: Twilioから取得したAccount SIDを入力
```
ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Auth Token**: Twilioから取得したAuth Tokenを入力
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Messaging Service SID** (推奨): 
```
MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

または

**From Phone Number**: Twilioで購入した電話番号
```
+815012345678
```

### 2.3 OTP設定

**OTP Expiry**: 600秒（10分）に設定（セキュリティ推奨値）

**OTP Length**: 6桁（デフォルト）

## 🔧 3. 環境変数の設定

### 3.1 開発環境（.env.local）

```bash
# Supabase設定（既存）
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Twilio設定は不要（Supabaseが管理）
```

### 3.2 本番環境（Vercel）

Vercelダッシュボード > Settings > Environment Variables で設定：

```
VITE_SUPABASE_URL: https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY: your-anon-key
```

## 🔧 4. 実装の確認

### 4.1 フロー確認

1. **診断完了**: ユーザーが診断フォームを完了
2. **電話番号入力**: SMS認証ページで電話番号を入力
3. **OTP送信**: Supabase経由でTwilioがSMSを送信
4. **OTP入力**: ユーザーが6桁のコードを入力
5. **認証完了**: 成功後、診断結果ページに遷移

### 4.2 テスト手順

1. 診断フォームを完了
2. 有効な日本の携帯電話番号を入力
3. SMSでコードが届くことを確認
4. 正しいコードで認証が成功することを確認
5. 間違ったコードで認証が失敗することを確認

## 🛡️ 5. セキュリティ考慮事項

### 5.1 レート制限

- 同一電話番号への送信は60秒間隔で制限
- 1日あたりの送信回数制限を設定
- 異常なアクセスパターンの監視

### 5.2 電話番号検証

- 日本の携帯電話番号形式のみ許可
- 国際形式（+81）への正規化
- 不正な形式の電話番号を拒否

### 5.3 データ保護

- 電話番号は暗号化して保存
- OTPは一時的にのみ保存
- 認証後のセッション管理

## 💰 6. コスト管理

### 6.1 Twilio料金

- SMS送信: 約10円/通（日本国内）
- 電話番号維持費: 約150円/月
- 月間送信量に応じた割引あり

### 6.2 コスト最適化

- 開発環境では認証をスキップ
- 不正利用防止でコスト削減
- 送信失敗時の再試行制限

## 🚨 7. トラブルシューティング

### 7.1 よくある問題

**SMS が届かない**
- 電話番号形式の確認
- キャリアのSMS受信設定確認
- Twilioの送信ログ確認

**認証エラー**
- Supabase設定の確認
- Twilio認証情報の確認
- ネットワーク接続の確認

**OTP期限切れ**
- 10分以内に入力を促す
- 再送信機能の利用
- 期限時間の調整

### 7.2 ログ確認

```javascript
// ブラウザコンソールでの確認
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Auth state:', await supabase.auth.getSession());
```

## 📞 8. サポート

### 8.1 Supabaseサポート

- [Supabase Documentation](https://supabase.com/docs/guides/auth/phone-login)
- [Supabase Community](https://github.com/supabase/supabase/discussions)

### 8.2 Twilioサポート

- [Twilio Documentation](https://www.twilio.com/docs/verify/api)
- [Twilio Console](https://console.twilio.com/)

## 📝 9. 次のステップ

1. **本番環境テスト**: 実際の電話番号でテスト
2. **監視設定**: SMS送信量とエラー率の監視
3. **ユーザーガイド**: SMS認証手順の案内作成
4. **フォールバック**: SMS以外の認証方法の検討

---

**注意**: この設定により、診断結果へのアクセスにはSMS認証が必須となります。ユーザビリティとセキュリティのバランスを考慮して実装してください。 
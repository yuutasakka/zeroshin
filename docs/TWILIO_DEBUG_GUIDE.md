# Twilio SMS送信デバッグガイド

## 現在の状況
- APIレスポンス: ✅ 成功（status: 200, messageSid生成）
- Twilioログ: ❌ メッセージが表示されない

## デバッグ手順

### 1. Vercel Function Logsの確認

1. [Vercelダッシュボード](https://vercel.com) にログイン
2. プロジェクト `moneyticket01` を選択
3. **Functions** タブをクリック
4. `api/send-otp-simple` を選択
5. **Logs** を確認

確認ポイント：
- `[Simple SMS] 正規化後の電話番号: +81...` が正しい形式か
- Twilioエラーメッセージがないか
- 環境変数の読み込みエラーがないか

### 2. Twilioコンソールでの詳細確認

1. [Twilioコンソール](https://console.twilio.com) にログイン
2. **Monitor** > **Logs** > **Messages**
3. フィルター設定：
   - Date Range: 本日
   - From: +18056171413
   - Direction: Outbound

### 3. Twilioアカウント設定確認

#### a) Geographic Permissions（地理的権限）
1. **Messaging** > **Settings** > **Geo permissions**
2. 日本（Japan）が有効になっているか確認
3. 無効の場合は有効化

#### b) Messaging Service設定
1. **Messaging** > **Services**
2. 使用しているサービスの設定確認
3. 送信元番号が正しく設定されているか

#### c) アカウントステータス
1. **Account** > **General Settings**
2. Account Status: Active
3. Balance: 残高確認

### 4. 実際の番号でテスト

```bash
# 実際の携帯番号でテスト実行
node test_real_sms.js
```

### 5. Twilio CLIでの直接テスト

```bash
# Twilio CLIインストール（未インストールの場合）
npm install -g twilio-cli

# ログイン
twilio login

# 直接SMS送信テスト
twilio api:core:messages:create \
  --from +18056171413 \
  --to +819012345678 \
  --body "Test message from CLI"
```

## よくある問題と解決策

### 1. トライアルアカウントの制限
- **問題**: 未検証の番号には送信できない
- **解決**: Verified Caller IDsに番号を追加

### 2. 地理的制限
- **問題**: 日本への送信が無効
- **解決**: Geo permissionsで日本を有効化

### 3. 番号形式の問題
- **問題**: 国際形式でない
- **解決**: +81形式に変換（APIで実装済み）

### 4. 環境変数の問題
- **問題**: Vercelで環境変数が読み込めない
- **解決**: Vercelダッシュボードで再設定

### 5. Twilioサービスの問題
- **問題**: メッセージングサービスの設定ミス
- **解決**: Default serviceの確認

## エラーコード一覧

| コード | 説明 | 解決方法 |
|--------|------|----------|
| 21211 | 無効な電話番号 | 番号形式を確認 |
| 21608 | 未検証の番号 | Verified IDsに追加 |
| 21610 | ブロックリスト | 番号のブロック解除 |
| 21614 | 無効な送信元番号 | Twilio番号を確認 |
| 30003 | ネットワークエラー | 再試行 |
| 30005 | 不明な送信先 | 番号の存在確認 |

## 推奨アクション

1. **Vercel Logsで実際のエラーを確認**
2. **実際の携帯番号でテスト実行**
3. **Twilioの地理的権限を確認**
4. **必要に応じてトライアルから本番アカウントへ**
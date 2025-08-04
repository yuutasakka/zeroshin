# LINE Login設定ガイド

## 1. LINE Developersアカウントの作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. LINEアカウントでログイン
3. プロバイダーを作成（会社名や個人名）
4. 新しいチャンネルを作成

## 2. LINE Loginチャンネルの設定

### チャンネル基本情報
1. チャンネルタイプ: `LINE Login`
2. チャンネル名: `Zero-Shin診断システム`
3. チャンネル説明: 診断結果の確認とユーザー認証
4. アプリタイプ: `ウェブアプリ`

### スコープ設定
必要なスコープを選択：
- `profile`: ユーザーの表示名とプロフィール画像
- `openid`: ユーザーのIDトークン取得

## 3. Callback URLの設定

開発環境とプロダクション環境それぞれに以下を設定：

```
# 開発環境
http://localhost:3000/api/line-callback

# プロダクション環境
https://zeroshin.vercel.app/api/line-callback
```

## 4. チャンネル情報の取得

LINE Developers Console → チャンネル基本設定から以下を取得：

- `Channel ID`: チャンネルの一意識別子
- `Channel Secret`: サーバーサイド認証用秘密鍵

## 5. Vercel環境変数の設定

Vercelプロジェクトの Environment Variables に以下を追加：

```env
# LINE Login設定
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_REDIRECT_URI=https://zeroshin.vercel.app/api/line-callback

# ローカル開発用
LINE_REDIRECT_URI_DEV=http://localhost:3000/api/line-callback
```

## 6. 実装詳細

### 認証フロー
1. **認証開始**: ユーザーがLINE Login URLにリダイレクト
2. **LINE認証**: LINEアプリまたはウェブでログイン
3. **コールバック**: 認可コードでアプリにリダイレクト
4. **トークン交換**: 認可コードをアクセストークンに交換
5. **プロフィール取得**: アクセストークンでユーザー情報取得

### LINE Login URL
```javascript
const authUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
  `response_type=code&` +
  `client_id=${LINE_CHANNEL_ID}&` +
  `redirect_uri=${encodeURIComponent(LINE_REDIRECT_URI)}&` +
  `state=${state}&` +
  `scope=profile%20openid`;
```

### トークン交換エンドポイント
```javascript
const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: LINE_REDIRECT_URI,
    client_id: LINE_CHANNEL_ID,
    client_secret: LINE_CHANNEL_SECRET,
  }),
});
```

### プロフィール取得
```javascript
const profileResponse = await fetch('https://api.line.me/v2/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

## 7. データベーススキーマ

### line_auth_sessions テーブル
```sql
CREATE TABLE line_auth_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line_user_id TEXT NOT NULL UNIQUE,
    display_name TEXT,
    picture_url TEXT,
    state_token TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    diagnosis_answers JSONB,
    ip_address INET,
    user_agent TEXT
);
```

### 既存テーブルの拡張
```sql
-- usersテーブル
ALTER TABLE users 
ADD COLUMN line_user_id TEXT UNIQUE,
ADD COLUMN line_display_name TEXT,
ADD COLUMN line_picture_url TEXT,
ADD COLUMN line_verified_at TIMESTAMP;

-- diagnosis_resultsテーブル
ALTER TABLE diagnosis_results 
ADD COLUMN line_user_id TEXT;
```

## 8. セキュリティ設定

### State パラメータ
CSRF攻撃防止のため、毎回ランダムなstateを生成：
```javascript
const state = crypto.randomBytes(32).toString('hex');
```

### トークンの安全な保存
- アクセストークン: セッションストレージ（短期間）
- リフレッシュトークン: データベース（暗号化）
- 機密情報は環境変数で管理

### CSP ヘッダー更新
```javascript
connectSrc: [
  "'self'",
  "https://api.line.me",
  // ... 他のドメイン
],
```

## 9. テスト方法

### 開発環境での認証テスト
```bash
# ローカルサーバー起動
npm run dev

# ブラウザで認証テスト
# http://localhost:3000 → 診断開始 → LINE認証
```

### API エンドポイントテスト
```bash
# 認証状態確認
curl -X GET http://localhost:3000/api/auth-check \
  -H "Cookie: session=your_session_cookie"

# LINE認証コールバックテスト（手動では困難）
# 実際のLINE認証フローを通じてテスト
```

## 10. 本番環境での注意事項

### 1. チャンネル設定
- プロダクション用チャンネルを別途作成推奨
- 開発と本番でChannel IDを分離

### 2. レート制限
- LINE API の制限に注意（1000 requests/hour）
- エラーハンドリングの実装

### 3. ログ管理
```javascript
// 本番環境ではLINE User IDをハッシュ化
const hashedUserId = crypto
  .createHash('sha256')
  .update(lineUserId)
  .digest('hex')
  .substring(0, 8);
```

### 4. 監視設定
- 認証失敗率の監視
- 異常なアクセスパターンの検出
- トークン有効期限の管理

## 11. トラブルシューティング

### よくあるエラー

#### invalid_request
- パラメータが不正または不足
- redirect_uriの不一致を確認

#### invalid_client
- Channel IDまたはChannel Secretが間違い
- 環境変数の設定を確認

#### invalid_grant
- 認可コードが無効または期限切れ
- コード交換は1回のみ有効

### デバッグ方法
```javascript
// 開発環境でのデバッグログ
console.log('LINE Auth Debug:', {
  channelId: process.env.LINE_CHANNEL_ID?.substring(0, 4) + '****',
  redirectUri: process.env.LINE_REDIRECT_URI,
  state: state.substring(0, 8) + '****'
});
```

## 12. LINE APIリファレンス

### 主要エンドポイント
- 認可: `https://access.line.me/oauth2/v2.1/authorize`
- トークン: `https://api.line.me/oauth2/v2.1/token`
- プロフィール: `https://api.line.me/v2/profile`
- トークン検証: `https://api.line.me/oauth2/v2.1/verify`

### レスポンス例
```json
{
  "userId": "U1234567890abcdef",
  "displayName": "山田太郎",
  "pictureUrl": "https://profile.line-scdn.net/...",
  "statusMessage": "Hello, LINE!"
}
```

## 13. 移行チェックリスト

- [ ] LINE Developersアカウント作成
- [ ] チャンネル作成・設定
- [ ] 環境変数設定
- [ ] データベース移行実行
- [ ] 認証フロー動作確認
- [ ] エラーハンドリング確認
- [ ] セキュリティ設定確認
- [ ] 本番環境デプロイ
- [ ] 監視・ログ設定

## 14. コスト・利用制限

### 料金
- LINE Login API: **無料**
- プロフィール取得 API: **無料**
- レート制限内であれば追加料金なし

### 制限事項
- 1チャンネルあたり月間100万リクエスト
- 秒間最大100リクエスト
- アクセストークン有効期限: 30日間

## 15. サポート・リソース

- [LINE Developers ドキュメント](https://developers.line.biz/ja/docs/)
- [LINE Login API リファレンス](https://developers.line.biz/ja/reference/line-login/)
- [LINE Developers コミュニティ](https://www.line-community.me/)
- 技術サポート: developers-support@linecorp.com
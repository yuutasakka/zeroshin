# CSRF攻撃防止システム

このドキュメントでは、電話番号認証と管理画面ログインに実装されたCSRF（Cross-Site Request Forgery）攻撃防止システムについて説明します。

## 🛡️ 実装されたCSRF保護

### 1. システム概要
- **対象機能**: 電話番号認証（SMS送信・OTP検証）、管理画面ログイン
- **トークンベース**: HMACによる署名付きトークン
- **セッション連携**: セッションIDとの紐付け
- **IP制限**: クライアントIPアドレスとの照合（オプション）

### 2. アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   フロントエンド   │───→│   ミドルウェア    │───→│     API         │
│                 │    │                 │    │                 │
│ 1. CSRF取得     │    │ 1. トークン検証   │    │ 1. ビジネス処理  │
│ 2. ヘッダー送信  │    │ 2. IP制限       │    │ 2. DB操作       │
│ 3. エラー処理    │    │ 3. レート制限    │    │ 3. レスポンス    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 セキュリティ機能

### 1. トークン生成
```typescript
// server/security/csrf-protection.ts
generateToken(sessionId: string, clientIP?: string): { token: string; secret: string } {
  const secret = this.generateSecureRandom(32);
  const tokenData = `${sessionId}:${secret}:${Date.now()}`;
  const token = crypto
    .createHmac('sha256', process.env.CSRF_SECRET)
    .update(tokenData)
    .digest('hex');
  
  return { token, secret };
}
```

**特徴:**
- 32バイトのセキュアなランダム秘密鍵
- セッションID + 秘密鍵 + タイムスタンプによる署名
- 環境変数ベースのマスターシークレット

### 2. トークン検証
```typescript
validateToken(sessionId: string, providedToken: string, clientIP?: string): boolean {
  // 1. 有効期限チェック（1時間）
  // 2. IPアドレス照合（オプション）
  // 3. タイミング攻撃対策
  // 4. ワンタイム使用（使用後削除）
}
```

**セキュリティ対策:**
- 時間ベースの有効期限（1時間）
- IPアドレスの一致確認
- タイミング攻撃防止（crypto.timingSafeEqual）
- ワンタイムトークン（使用後自動削除）

### 3. React Hook統合
```typescript
// src/hooks/useCSRF.ts
const { csrfToken, addCSRFHeaders, refreshToken } = useCSRF();

// 使用例
const response = await csrfFetch('/api/send-otp', {
  method: 'POST',
  headers: addCSRFHeaders(),
  body: JSON.stringify({ phoneNumber })
}, csrfToken);
```

## 📋 実装詳細

### 1. 保護対象API

#### 電話番号認証
- **POST /api/send-otp**: SMS送信
- **POST /api/verify-otp**: OTP検証

#### 管理画面
- **POST /api/admin-login**: 管理者ログイン

### 2. ミドルウェア統合
```typescript
// middleware.ts
const csrfProtectedPaths = ['/api/send-otp', '/api/verify-otp', '/api/admin-login'];
if (csrfProtectedPaths.some(path => pathname.startsWith(path))) {
  const csrfResponse = csrfMiddleware({
    excludePaths: ['/api/csrf-token'],
    methods: ['POST', 'PUT', 'DELETE', 'PATCH']
  })(request);
}
```

### 3. フロントエンド統合

#### SMS認証フロー
```typescript
// SMSAuthFlow.tsx
const { csrfToken, isLoading: csrfLoading, addCSRFHeaders } = useCSRF();

// CSRFトークン確認
if (!csrfToken) {
  setError('セキュリティトークンの取得に失敗しました。');
  await refreshToken();
  return;
}

// CSRF保護付きAPIコール
const response = await csrfFetch('/api/send-otp', {
  method: 'POST',
  headers: addCSRFHeaders(),
  body: JSON.stringify({ phoneNumber })
}, csrfToken);
```

#### 管理画面ログイン
```typescript
// AdminLogin.tsx
const response = await csrfFetch('/api/admin-login', {
  method: 'POST',
  headers: addCSRFHeaders(),
  body: JSON.stringify({ email, password })
}, csrfToken);
```

## 🔄 トークンライフサイクル

### 1. 取得フロー
```
1. ページロード
2. GET /api/csrf-token → セッションID生成 + CSRFトークン生成
3. クッキー設定（HttpOnly, Secure, SameSite=Strict）
4. React Hookでトークン管理
```

### 2. 使用フロー
```
1. フォーム送信時
2. X-CSRF-Token ヘッダーに設定
3. ミドルウェアで検証
4. 成功時：API処理継続
5. 失敗時：403 Forbidden
```

### 3. 自動更新
- 有効期限の80%で自動更新
- ページフォーカス時の有効性確認
- エラー時の自動再取得

## ⚠️ エラーハンドリング

### 1. CSRF検証失敗
```json
{
  "error": "Invalid CSRF token",
  "code": "CSRF_INVALID"
}
```

**対応:**
- トークンの自動再取得
- ユーザーへの適切なエラーメッセージ
- ページリロードの推奨

### 2. セッション不正
```json
{
  "error": "Session ID required",
  "code": "SESSION_REQUIRED"
}
```

**対応:**
- 新しいセッションの生成
- CSRFトークンの再取得

### 3. 有効期限切れ
- 自動的な背景更新
- ユーザー操作を中断しない更新

## 📊 監視とログ

### 1. 成功ログ
```javascript
console.log('SMS OTP sent:', {
  phone: '090****1234',
  ip: '192.168.1.***',
  sessionId: 'abc12345...',
  timestamp: '2024-01-01T12:00:00.000Z'
});
```

### 2. 失敗ログ
```javascript
console.warn('CSRF validation failed:', {
  sessionId: 'abc12345...',
  ip: '192.168.1.***',
  error: 'Invalid CSRF token'
});
```

### 3. 監査項目
- CSRF攻撃の試行回数
- IP別の失敗パターン
- 異常なアクセス頻度
- トークン使用統計

## 🧪 テストケース

### 1. 正常系テスト
```javascript
// 有効なCSRFトークンでのAPI呼び出し
test('Valid CSRF token should allow API access', async () => {
  const token = await getCSRFToken();
  const response = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'X-CSRF-Token': token },
    body: JSON.stringify({ phoneNumber: '09012345678' })
  });
  expect(response.status).toBe(200);
});
```

### 2. 異常系テスト
```javascript
// CSRFトークンなしでのAPI呼び出し
test('Missing CSRF token should be rejected', async () => {
  const response = await fetch('/api/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: '09012345678' })
  });
  expect(response.status).toBe(403);
});

// 無効なCSRFトークンでのAPI呼び出し
test('Invalid CSRF token should be rejected', async () => {
  const response = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'X-CSRF-Token': 'invalid-token' },
    body: JSON.stringify({ phoneNumber: '09012345678' })
  });
  expect(response.status).toBe(403);
});
```

### 3. セキュリティテスト
```javascript
// タイミング攻撃のテスト
test('Timing attack resistance', async () => {
  const validToken = await getCSRFToken();
  const invalidToken = 'invalid-token-same-length';
  
  const start1 = Date.now();
  await verifyToken(validToken);
  const time1 = Date.now() - start1;
  
  const start2 = Date.now();
  await verifyToken(invalidToken);
  const time2 = Date.now() - start2;
  
  // 検証時間の差が小さいことを確認
  expect(Math.abs(time1 - time2)).toBeLessThan(10);
});
```

## 🔧 設定とメンテナンス

### 1. 環境変数
```bash
# .env
CSRF_SECRET=your-csrf-master-secret-here
ADMIN_IP_WHITELIST=192.168.1.100,203.0.113.0
```

### 2. 設定のカスタマイズ
```typescript
// csrf-protection.ts
const CSRF_CONFIG = {
  tokenLength: 32,        // トークン長
  maxAge: 3600000,       // 有効期限（1時間）
  headerName: 'X-CSRF-Token',
  cookieName: '_csrf'
};
```

### 3. パフォーマンス最適化
- メモリ内トークンストア
- 期限切れトークンの自動クリーンアップ
- トークン生成の非同期処理

## 🚀 本番環境での考慮事項

### 1. スケーラビリティ
- Redis等の外部ストレージへの移行
- 複数サーバー間でのトークン共有
- ロードバランサーでのセッション維持

### 2. セキュリティ強化
- CSRFシークレットの定期ローテーション
- IPホワイトリストの厳格化
- 異常検知システムとの連携

### 3. モニタリング
- リアルタイムでの攻撃検知
- Grafana等でのメトリクス可視化
- アラート設定と自動対応

この実装により、CSRF攻撃から電話番号認証と管理画面ログインが完全に保護されています。
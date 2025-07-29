# 電話番号検証API (Twilio Lookup API統合)

## 概要

Twilio Lookup APIを使用した高度な電話番号検証システム。SMS送信前に電話番号の有効性、キャリア情報、回線タイプを検証し、固定電話やVoIP番号への誤送信を防止します。

## 機能

### 🔍 電話番号検証
- **E.164形式正規化**: 国際標準形式への自動変換
- **有効性検証**: Twilio Lookup APIによる実際の番号存在確認
- **国コード検証**: 日本国内番号のみ許可
- **キャリア情報取得**: 通信事業者の特定

### 🚫 フィルタリング機能
- **固定電話除外**: SMSを受信できない固定電話番号をブロック
- **VoIP番号検出**: 配信の信頼性が低いVoIP番号に警告
- **海外番号除外**: 日本以外の国コードをブロック
- **リスクスコア算出**: 0-100のスコアで番号のリスクを評価

### ⚡ パフォーマンス最適化
- **24時間キャッシュ**: 検証結果をメモリキャッシュ
- **レート制限**: 分間50リクエストの制限
- **データベース保存**: Supabaseでの永続化
- **フォールバック**: API障害時の基本検証

## API エンドポイント

### 1. 電話番号検証API

```
POST /api/phone-validation
```

#### リクエスト
```json
{
  "phoneNumber": "090-1234-5678"
}
```

#### レスポンス（成功時）
```json
{
  "success": true,
  "data": {
    "phoneNumber": "090-1234-5678",
    "validation": {
      "isValid": true,
      "normalizedE164": "+819012345678",
      "nationalFormat": "090-1234-5678",
      "countryCode": "JP",
      "isJapanese": true
    },
    "carrier": {
      "name": "NTT DOCOMO",
      "lineType": "mobile"
    },
    "sms": {
      "canSend": true,
      "canReceiveSMS": true
    },
    "risk": {
      "score": 5,
      "level": "low"
    },
    "errors": [],
    "warnings": [],
    "timestamp": "2025-01-29T10:30:00.000Z"
  }
}
```

#### レスポンス（エラー時）
```json
{
  "success": false,
  "error": "Cannot send SMS to this number",
  "reason": "Landline number cannot receive SMS",
  "details": "固定電話番号にはSMSを送信できません。携帯電話番号をご入力ください。"
}
```

### 2. OTP送信API（統合済み）

```
POST /api/send-otp
```

電話番号検証が自動的に実行され、SMS送信前にフィルタリングされます。

## 回線タイプと対応

| 回線タイプ | SMS送信 | 説明 |
|------------|---------|------|
| `mobile` | ✅ 可能 | 携帯電話（推奨） |
| `landline` | ❌ 不可 | 固定電話（完全ブロック） |
| `voip` | ⚠️ 警告 | VoIP番号（配信不安定） |
| `unknown` | ⚠️ 警告 | 不明な回線タイプ |

## リスクスコア算出

| 要因 | スコア加算 |
|------|------------|
| 無効な番号 | +100 |
| 海外番号 | +50 |
| 固定電話 | +80 |
| VoIP番号 | +40 |
| 不明な回線 | +20 |
| キャリア情報なし | +10 |

- **0-30**: 低リスク（送信推奨）
- **31-70**: 中リスク（注意）
- **71-100**: 高リスク（送信ブロック）

## 設定

### 環境変数

```bash
# Twilio Lookup API用（必須）
TWILIO_ACCOUNT_SID=AC********************************
TWILIO_AUTH_TOKEN=********************************

# Supabase（データ保存用）
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ************************
```

### データベースschema

```sql
-- 既存のphone_number_intelligenceテーブルを使用
CREATE TABLE phone_number_intelligence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    carrier VARCHAR(100),
    line_type VARCHAR(50), -- mobile, landline, voip
    country_code VARCHAR(2),
    risk_score INTEGER DEFAULT 0,
    last_verification TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 使用例

### JavaScript/TypeScript

```javascript
// 電話番号検証
const validatePhone = async (phoneNumber) => {
  const response = await fetch('/api/phone-validation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });
  
  const result = await response.json();
  
  if (!result.success) {
    console.error('Validation failed:', result.error);
    return false;
  }
  
  return result.data.sms.canSend;
};

// OTP送信（検証統合済み）
const sendOTP = async (phoneNumber) => {
  const response = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });
  
  const result = await response.json();
  
  if (!result.success) {
    if (result.reason === 'Landline number cannot receive SMS') {
      alert('固定電話番号にはSMSを送信できません。');
    }
    return false;
  }
  
  return true;
};
```

### React Hook

```tsx
import { useState } from 'react';

export const usePhoneValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  
  const validatePhone = async (phoneNumber: string) => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/phone-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      
      const result = await response.json();
      return result;
    } finally {
      setIsValidating(false);
    }
  };
  
  return { validatePhone, isValidating };
};
```

## エラーハンドリング

### 一般的なエラーと対処法

| エラー | 原因 | 対処法 |
|--------|------|--------|
| `Phone number not found` | 無効な番号 | 番号を確認してもらう |
| `Landline number cannot receive SMS` | 固定電話 | 携帯番号の入力を促す |
| `Non-Japanese number` | 海外番号 | 日本の番号のみ受付を案内 |
| `API rate limit exceeded` | レート制限 | 少し待ってから再試行 |
| `Phone validation service unavailable` | API障害 | フォールバック検証で継続 |

### フォールバック動作

Twilio Lookup APIが利用できない場合：
1. 基本的な正規表現パターンマッチング
2. 日本の携帯電話番号形式の確認（090/080/070）
3. 中程度のリスクスコア（30）を設定
4. 警告ログの出力

## 監視とメトリクス

### ログ出力例

```
Phone validation completed: {
  phone: "090****",
  isValid: true,
  lineType: "mobile",
  canSendSMS: true,
  riskScore: 5,
  carrier: "NTT DOCOMO"
}
```

### 統計情報取得

```javascript
// サービス統計の確認（開発用）
const stats = phoneNumberValidator.getStats();
console.log('Cache size:', stats.cacheSize);
console.log('Requests in last minute:', stats.requestsInLastMinute);
```

## ベストプラクティス

### 1. ユーザビリティ
- エラーメッセージは分かりやすい日本語で表示
- 固定電話入力時は携帯番号の入力を促す
- VoIP番号には配信の不安定性を警告

### 2. パフォーマンス
- 検証結果のキャッシュを活用
- レート制限内での利用
- 必要な場合のみAPIを呼び出し

### 3. セキュリティ
- 電話番号の機密情報をログに出力しない
- 検証結果をセキュアに保存
- 不正な番号の利用をブロック

## トラブルシューティング

### Q: Twilio Lookup APIの料金は？
A: 検証1回につき約0.005USD。キャッシュ機能で重複検証を防止。

### Q: キャッシュはいつクリアされる？
A: 24時間自動期限切れ。手動クリアも可能。

### Q: VoIP番号はなぜ警告？
A: SMS配信の信頼性が低く、到達しない可能性があるため。

### Q: フォールバック検証の精度は？
A: 基本的なパターンマッチングのみ。Lookup API復旧後に再検証推奨。
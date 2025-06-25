import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import twilio from 'twilio';

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Twilioクライアントの初期化（必須設定）
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Twilio設定の検証
if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('❌ Twilioの設定が不完全です。以下の環境変数を設定してください:');
  console.error('- TWILIO_ACCOUNT_SID');
  console.error('- TWILIO_AUTH_TOKEN'); 
  console.error('- TWILIO_PHONE_NUMBER');
  process.exit(1);
}

console.log('✅ Twilio設定確認完了');
console.log('- ACCOUNT_SID:', accountSid.substring(0, 10) + '...');
console.log('- AUTH_TOKEN:', authToken.substring(0, 10) + '...');
console.log('- PHONE_NUMBER:', twilioPhoneNumber);

const client = twilio(accountSid, authToken);

// ミドルウェア
app.use(cors());
app.use(express.json());

// インメモリストレージ（本番環境ではRedisやDBを使用）
const verificationCodes = new Map<string, { code: string; expiry: number }>();

// 日本の電話番号を国際形式に正規化
function normalizeJapanesePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.startsWith('090') || digits.startsWith('080') || digits.startsWith('070')) {
    return '+81' + digits.substring(1);
  }
  
  if (digits.startsWith('0')) {
    return '+81' + digits.substring(1);
  }
  
  if (digits.startsWith('81')) {
    return '+' + digits;
  }
  
  return '+81' + digits;
}

// SMS送信エンドポイント
app.post('/api/sms/send', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      error: '電話番号が必要です'
    });
  }

  try {
    const normalizedPhoneNumber = normalizeJapanesePhoneNumber(phoneNumber);
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5分後に期限切れ

    // 認証コードを一時保存
    verificationCodes.set(normalizedPhoneNumber, {
      code: verificationCode,
      expiry: expiry,
    });

    // SMSメッセージの内容
    const message = `マネーチケット認証コード: ${verificationCode}\n5分以内にご入力ください。`;

    // TwilioでSMS送信
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: normalizedPhoneNumber,
    });

    console.log(`SMS送信成功: ${normalizedPhoneNumber} に認証コード ${verificationCode} を送信`);

    res.json({
      success: true,
      message: 'SMS認証コードを送信しました',
      phoneNumber: normalizedPhoneNumber
    });

  } catch (error) {
    console.error('SMS送信エラー:', error);
    
    // Twilioエラーの詳細情報を出力
    if (error && typeof error === 'object') {
      console.error('- エラーコード:', (error as any).code);
      console.error('- エラーメッセージ:', (error as any).message);
      console.error('- ステータス:', (error as any).status);
      console.error('- 詳細:', (error as any).moreInfo);
    }
    
    res.status(500).json({
      error: 'SMS送信に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// SMS認証コード検証エンドポイント
app.post('/api/sms/verify', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        error: '電話番号と認証コードが必要です'
      });
    }

    const normalizedPhoneNumber = normalizeJapanesePhoneNumber(phoneNumber);
    const stored = verificationCodes.get(normalizedPhoneNumber);
    
    if (!stored) {
      return res.status(400).json({
        error: '認証コードが見つかりません',
        verified: false
      });
    }
    
    // 有効期限をチェック
    if (Date.now() > stored.expiry) {
      verificationCodes.delete(normalizedPhoneNumber);
      return res.status(400).json({
        error: '認証コードの有効期限が切れています',
        verified: false
      });
    }
    
    // コードが一致するかチェック
    if (stored.code === code) {
      verificationCodes.delete(normalizedPhoneNumber);
      console.log(`認証成功: ${normalizedPhoneNumber}`);
      
      return res.json({
        success: true,
        message: '認証が完了しました',
        verified: true
      });
    } else {
      return res.status(400).json({
        error: '認証コードが正しくありません',
        verified: false
      });
    }

  } catch (error) {
    console.error('認証エラー:', error);
    res.status(500).json({
      error: '認証処理に失敗しました'
    });
  }
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    twilioConfigured: true,
    timestamp: new Date().toISOString()
  });
});

// サーバー開始
app.listen(PORT, () => {
  console.log(`🚀 SMS認証サーバーが http://localhost:${PORT} で起動しました`);
  console.log(`📱 Twilio本番モードで稼働中`);
});

export default app; 
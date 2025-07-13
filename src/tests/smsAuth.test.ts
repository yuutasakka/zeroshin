// SMS認証システムのテスト
import { SMSAuthService } from '../api/smsAuth';

// テスト用のモック設定
jest.mock('../lib/supabaseAuth', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      delete: jest.fn(() => ({ eq: jest.fn() })),
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  otp_code: '123456',
                  expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                  attempts: 0
                },
                error: null
              }))
            }))
          }))
        }))
      })),
      update: jest.fn(() => ({ eq: jest.fn() })),
      rpc: jest.fn(() => ({ data: true, error: null }))
    }))
  }
}));

// Twilioのモック
jest.mock('twilio', () => ({
  default: jest.fn(() => ({
    messages: {
      create: jest.fn(() => Promise.resolve({ sid: 'test-sid' }))
    }
  }))
}));

describe('SMS認証システム', () => {
  beforeEach(() => {
    // 環境変数のモック
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
  });

  describe('電話番号正規化', () => {
    test('全角数字が半角に変換される', async () => {
      const result = await SMSAuthService.sendOTP('０９０１２３４５６７８');
      expect(result.success).toBe(true);
    });

    test('ハイフンが削除される', async () => {
      const result = await SMSAuthService.sendOTP('090-1234-5678');
      expect(result.success).toBe(true);
    });

    test('無効な電話番号が拒否される', async () => {
      const result = await SMSAuthService.sendOTP('123456789');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number format');
    });
  });

  describe('OTP送信', () => {
    test('有効な電話番号でOTP送信が成功する', async () => {
      const result = await SMSAuthService.sendOTP('09012345678');
      expect(result.success).toBe(true);
    });

    test('無効な電話番号でOTP送信が失敗する', async () => {
      const result = await SMSAuthService.sendOTP('invalid-phone');
      expect(result.success).toBe(false);
    });
  });

  describe('OTP検証', () => {
    test('正しいOTPで検証が成功する', async () => {
      // まずOTPを送信
      await SMSAuthService.sendOTP('09012345678');
      
      // 正しいOTPで検証
      const result = await SMSAuthService.verifyOTP('09012345678', '123456');
      expect(result.success).toBe(true);
    });

    test('間違ったOTPで検証が失敗する', async () => {
      await SMSAuthService.sendOTP('09012345678');
      
      const result = await SMSAuthService.verifyOTP('09012345678', '999999');
      expect(result.success).toBe(false);
    });

    test('存在しない電話番号で検証が失敗する', async () => {
      const result = await SMSAuthService.verifyOTP('09099999999', '123456');
      expect(result.success).toBe(false);
      expect(result.error).toBe('OTP not found or expired');
    });
  });
});

// 統合テスト用の関数
export async function testSMSAuthFlow() {
  console.log('🧪 SMS認証フローのテスト開始...');
  
  const testPhone = '09012345678';
  const results = [];

  try {
    // 1. OTP送信テスト
    console.log('📱 OTP送信テスト...');
    const sendResult = await SMSAuthService.sendOTP(testPhone);
    results.push({
      test: 'OTP送信',
      success: sendResult.success,
      error: sendResult.error
    });

    if (sendResult.success) {
      // 2. OTP検証テスト（テスト用の固定OTP）
      console.log('🔐 OTP検証テスト...');
      const verifyResult = await SMSAuthService.verifyOTP(testPhone, '123456');
      results.push({
        test: 'OTP検証',
        success: verifyResult.success,
        error: verifyResult.error
      });
    }

    // 3. レート制限テスト
    console.log('⏱️ レート制限テスト...');
    const rateLimitResults = [];
    for (let i = 0; i < 4; i++) {
      const result = await SMSAuthService.sendOTP(testPhone);
      rateLimitResults.push(result.success);
    }
    
    results.push({
      test: 'レート制限',
      success: rateLimitResults[3] === false, // 4回目は失敗するはず
      details: rateLimitResults
    });

  } catch (error) {
    results.push({
      test: 'エラーハンドリング',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  console.log('🧪 テスト結果:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.success ? '成功' : `失敗 - ${result.error}`}`);
  });

  return results;
}
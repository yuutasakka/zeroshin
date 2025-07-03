// モックストレージ
const diagnosisSessions: Record<string, any> = {};
const otpStore: Record<string, string> = {};

// 診断開始
export const startDiagnosis = async () => {
  const sessionId = 'session_' + Math.random().toString(36).slice(2, 10);
  diagnosisSessions['09012345678'] = {
    sessionId,
    phone: '09012345678',
    prevent_redo: false,
    verified: false,
  };
  return { sessionId };
};

// CSRFトークン生成
export const generateTestCSRFToken = () => 'test_csrf_token';

// SMS送信APIモック
export const apiSmsSend = async (phone: string, headers: Record<string, string>) => {
  if (headers['X-CSRF-Token'] !== 'test_csrf_token') {
    return { status: 403 };
  }
  // OTP生成
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[phone] = otp;
  return { status: 200 };
};

// モックされたOTP取得
export const getMockedOtp = (phone: string) => otpStore[phone];

// SMS認証APIモック
export const apiSmsVerify = async (phone: string, otp: string, headers: Record<string, string>) => {
  if (headers['X-CSRF-Token'] !== 'test_csrf_token') {
    return { verified: false };
  }
  if (otpStore[phone] && otpStore[phone] === otp) {
    if (diagnosisSessions[phone]) {
      diagnosisSessions[phone].verified = true;
      diagnosisSessions[phone].prevent_redo = true;
    }
    return { verified: true };
  }
  return { verified: false };
};

// 診断セッション取得
export const fetchDiagnosisSession = async (phone: string) => {
  return diagnosisSessions[phone];
};

// テスト用リセット
export const resetIntegrationTestState = () => {
  for (const k in diagnosisSessions) delete diagnosisSessions[k];
  for (const k in otpStore) delete otpStore[k];
}; 
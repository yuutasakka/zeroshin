/**
 * Twilio SMS送信テストスクリプト
 * 使用方法: node scripts/test-twilio-sms.js 090xxxxxxxx
 */

require('dotenv').config({ path: '.env.local' });

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

console.log('=== Twilio環境変数チェック ===');
console.log('TWILIO_ACCOUNT_SID:', twilioAccountSid ? `${twilioAccountSid.substring(0, 6)}...` : '未設定');
console.log('TWILIO_AUTH_TOKEN:', twilioAuthToken ? `${twilioAuthToken.substring(0, 6)}...` : '未設定');
console.log('TWILIO_PHONE_NUMBER:', twilioPhoneNumber || '未設定');

if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
  console.error('\n❌ Twilio環境変数が設定されていません。');
  console.error('.env.localファイルに以下を追加してください：');
  console.error('TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  console.error('TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  console.error('TWILIO_PHONE_NUMBER=+1234567890');
  process.exit(1);
}

// コマンドライン引数から電話番号を取得
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error('\n❌ 電話番号を指定してください');
  console.error('使用方法: node scripts/test-twilio-sms.js 090xxxxxxxx');
  process.exit(1);
}

// 電話番号の正規化
let normalizedPhone = phoneNumber.replace(/[^\d]/g, '');
if (normalizedPhone.startsWith('0')) {
  normalizedPhone = '+81' + normalizedPhone.substring(1);
} else if (!normalizedPhone.startsWith('+')) {
  normalizedPhone = '+' + normalizedPhone;
}

console.log('\n=== SMS送信テスト ===');
console.log('送信先:', normalizedPhone);

async function sendTestSMS() {
  try {
    // Twilioクライアントの初期化
    const twilio = require('twilio');
    const client = twilio(twilioAccountSid, twilioAuthToken);
    
    // テストOTPの生成
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('送信中...');
    
    // SMS送信
    const message = await client.messages.create({
      body: `【タスカル】テスト認証コード: ${otp}\n\n※これはテストメッセージです。`,
      from: twilioPhoneNumber,
      to: normalizedPhone
    });
    
    console.log('\n✅ SMS送信成功！');
    console.log('メッセージSID:', message.sid);
    console.log('ステータス:', message.status);
    console.log('送信元:', message.from);
    console.log('送信先:', message.to);
    console.log('認証コード:', otp);
    
  } catch (error) {
    console.error('\n❌ SMS送信エラー:');
    console.error('エラーメッセージ:', error.message);
    if (error.code) {
      console.error('エラーコード:', error.code);
    }
    if (error.moreInfo) {
      console.error('詳細情報:', error.moreInfo);
    }
    console.error('\n考えられる原因:');
    console.error('1. Twilioアカウントの認証情報が正しくない');
    console.error('2. Twilio電話番号が正しくない、または購入されていない');
    console.error('3. 送信先の電話番号形式が正しくない');
    console.error('4. Twilioアカウントに十分なクレジットがない');
    console.error('5. 地域制限により送信がブロックされている');
  }
}

// テスト実行
sendTestSMS();
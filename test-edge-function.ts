// Edge Function動作検証用スクリプト
// Node.js環境で実行: node test-edge-function.ts

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://eqirzbuqgymrtnfmvwhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXJ6YnVxZ3ltcnRuZm12d2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1Mjg1MTEsImV4cCI6MjA1MTEwNDUxMX0.bYgWmKdC9YMpuHhBEcmDfzQpO8j5qQWHnSPyLyKCyQE';

async function testEdgeFunction() {
  console.log('🧪 Edge Function動作検証開始...\n');

  // テストケース1: 申請承認
  console.log('📝 テストケース1: 申請承認');
  try {
    const approveResponse = await fetch(`${SUPABASE_URL}/functions/v1/approve-registration`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: 'req_test_approve',
        action: 'approve',
        adminNotes: 'テスト承認です。システムの動作確認を行っています。',
        reviewedBy: 'test_admin'
      })
    });

    const approveResult = await approveResponse.json();
    console.log('✅ 承認テスト結果:', approveResult);
  } catch (error) {
    console.error('❌ 承認テストエラー:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // テストケース2: 申請却下
  console.log('📝 テストケース2: 申請却下');
  try {
    const rejectResponse = await fetch(`${SUPABASE_URL}/functions/v1/approve-registration`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: 'req_test_reject',
        action: 'reject',
        adminNotes: 'テスト却下です。利用目的が不明確なため。',
        reviewedBy: 'test_admin'
      })
    });

    const rejectResult = await rejectResponse.json();
    console.log('✅ 却下テスト結果:', rejectResult);
  } catch (error) {
    console.error('❌ 却下テストエラー:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // テストケース3: 無効なリクエスト
  console.log('📝 テストケース3: 無効なリクエスト');
  try {
    const invalidResponse = await fetch(`${SUPABASE_URL}/functions/v1/approve-registration`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: '',
        action: 'invalid_action'
      })
    });

    const invalidResult = await invalidResponse.json();
    console.log('✅ 無効リクエストテスト結果:', invalidResult);
  } catch (error) {
    console.error('❌ 無効リクエストテストエラー:', error);
  }

  console.log('\n🎯 Edge Function動作検証完了！');
}

// テスト実行
testEdgeFunction(); 
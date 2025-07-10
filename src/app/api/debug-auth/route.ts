import { NextRequest, NextResponse } from 'next/server';
import { DiagnosisSessionManager } from '../../../../components/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🟢 デバッグAPI: リクエスト受信');
    
    const body = await request.json();
    console.log('🟢 リクエストボディ:', body);
    
    const { action, sessionId, phoneNumber } = body;
    
    const diagnosisManager = new DiagnosisSessionManager();
    
    let result: any = {};
    
    switch (action) {
      case 'check_session':
        if (sessionId) {
          console.log('🔍 セッションチェック:', sessionId);
          const session = await diagnosisManager.getDiagnosisSession(sessionId);
          result = {
            action: 'check_session',
            sessionId,
            session,
            exists: !!session,
            sms_verified: session?.sms_verified || false
          };
        } else {
          result = { error: 'sessionId が必要です' };
        }
        break;
        
      case 'check_phone':
        if (phoneNumber) {
          console.log('🔍 電話番号チェック:', phoneNumber);
          const isUsed = await diagnosisManager.checkPhoneNumberUsage(phoneNumber);
          result = {
            action: 'check_phone',
            phoneNumber,
            isUsed
          };
        } else {
          result = { error: 'phoneNumber が必要です' };
        }
        break;
        
      case 'list_sessions':
        console.log('🔍 全セッション一覧取得');
        // 管理者用の全セッション取得（開発環境のみ）
        if (process.env.NODE_ENV !== 'production') {
          try {
            const sessions = await diagnosisManager.getAllSessions();
            result = {
              action: 'list_sessions',
              sessions,
              count: sessions ? sessions.length : 0
            };
          } catch (error) {
            result = { error: 'セッション取得エラー', details: error };
          }
        } else {
          result = { error: '本番環境では利用できません' };
        }
        break;
        
      default:
        result = { error: '不明なアクション', availableActions: ['check_session', 'check_phone', 'list_sessions'] };
    }
    
    console.log('🟢 デバッグAPI結果:', result);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
    
  } catch (error) {
    console.error('❌ デバッグAPIエラー:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🟢 デバッグAPI GET: ヘルスチェック');
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'health') {
      return NextResponse.json({
        success: true,
        message: 'デバッグAPIは正常に動作しています',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'MoneyTicket 認証デバッグAPI',
      availableActions: [
        'POST /api/debug-auth - { action: "check_session", sessionId: "..." }',
        'POST /api/debug-auth - { action: "check_phone", phoneNumber: "..." }',
        'POST /api/debug-auth - { action: "list_sessions" }',
        'GET /api/debug-auth?action=health'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ デバッグAPI GETエラー:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
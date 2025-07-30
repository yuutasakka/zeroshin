import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { supabase } from '../src/components/supabaseClient';
import { calculateWasteScore, getWasteDiagnosisResult } from '../data/wasteDiagnosisResults';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, answers, score, result, timestamp } = req.body;

    // 入力データの検証
    if (!userId || !answers || typeof score !== 'number' || !result) {
      return res.status(400).json({ 
        error: '必要なパラメータが不足しています',
        required: ['userId', 'answers', 'score', 'result']
      });
    }

    // スコアの再計算（セキュリティ目的）
    const recalculatedScore = calculateWasteScore(answers);
    const diagnosisResult = getWasteDiagnosisResult(recalculatedScore);

    // セッションIDを生成
    const sessionId = `waste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 診断結果をデータベースに保存
    const { data: savedResult, error: saveError } = await supabase
      .from('waste_diagnosis_results')
      .insert({
        line_user_id: userId,
        session_id: sessionId,
        answers: answers,
        score: recalculatedScore,
        result_level: diagnosisResult.level,
        potential_monthly_savings: diagnosisResult.potentialSavings.monthly,
        potential_yearly_savings: diagnosisResult.potentialSavings.yearly,
        recommendations: {
          title: diagnosisResult.recommendations.title,
          items: diagnosisResult.recommendations.items,
          tips: diagnosisResult.tips,
          motivation: diagnosisResult.motivation
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error('診断結果保存エラー:', saveError);
      return res.status(500).json({ 
        error: '診断結果の保存に失敗しました',
        details: process.env.NODE_ENV === 'development' ? saveError : undefined
      });
    }

    // ユーザーの最終ログイン時刻を更新
    await supabase
      .from('line_users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('line_user_id', userId);

    // 統計情報を取得（オプション）
    const { data: userStats } = await supabase
      .from('waste_diagnosis_results')
      .select('id, score, result_level, created_at')
      .eq('line_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return res.json({
      success: true,
      message: '診断結果を保存しました',
      data: {
        id: savedResult.id,
        sessionId: savedResult.session_id,
        score: savedResult.score,
        resultLevel: savedResult.result_level,
        potentialSavings: {
          monthly: savedResult.potential_monthly_savings,
          yearly: savedResult.potential_yearly_savings
        },
        createdAt: savedResult.created_at
      },
      stats: {
        totalDiagnoses: userStats?.length || 0,
        previousResults: userStats?.slice(1) || [], // 最新を除く過去の結果
        averageScore: userStats?.length > 0 
          ? userStats.reduce((sum, item) => sum + parseFloat(item.score), 0) / userStats.length 
          : null
      }
    });

  } catch (error) {
    console.error('診断結果保存処理エラー:', error);
    return res.status(500).json({ 
      error: '診断結果保存処理中にエラーが発生しました',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
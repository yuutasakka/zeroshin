import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'ダウンロードトークンが必要です' });
    }

    // Supabase設定
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        error: 'データベース接続エラー'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // ダウンロード情報を取得
    const { data: downloadData, error: fetchError } = await supabase
      .from('email_downloads')
      .select('*')
      .eq('download_token', token)
      .single();

    if (fetchError || !downloadData) {
      return res.status(404).json({ error: '無効なダウンロードリンクです' });
    }

    // 有効期限チェック
    if (new Date(downloadData.expires_at) < new Date()) {
      return res.status(410).json({ error: 'ダウンロードリンクの有効期限が切れています' });
    }

    // 既にダウンロード済みかチェック（ワンタイムリンク）
    if (downloadData.is_downloaded) {
      return res.status(410).json({ error: 'このダウンロードリンクは既に使用されています' });
    }

    // ダウンロード済みフラグを更新
    const { error: updateError } = await supabase
      .from('email_downloads')
      .update({
        is_downloaded: true,
        downloaded_at: new Date().toISOString()
      })
      .eq('id', downloadData.id);

    if (updateError) {
      // エラーが発生してもダウンロードは継続
    }

    // 診断結果データを整形
    const diagnosisData = downloadData.diagnosis_data || {};
    
    // HTMLコンテンツを生成
    const htmlContent = generateResultHTML(diagnosisData, downloadData.phone_number);

    // レスポンスヘッダーを設定
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="diagnosis-result-${Date.now()}.html"`);
    
    res.status(200).send(htmlContent);

  } catch (error: any) {
    res.status(500).json({
      error: 'ダウンロードに失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// 診断結果のHTMLを生成
function generateResultHTML(diagnosisData: any, phoneNumber: string): string {
  const score = diagnosisData.score || 0;
  const answers = diagnosisData.answers || {};
  const timestamp = new Date().toLocaleString('ja-JP');

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>タスカル 診断結果</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2563eb;
            text-align: center;
            margin-bottom: 30px;
        }
        .score-section {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            margin: 30px 0;
        }
        .score-value {
            font-size: 72px;
            font-weight: bold;
            margin: 10px 0;
        }
        .score-label {
            font-size: 24px;
            opacity: 0.9;
        }
        .answer-section {
            margin-top: 40px;
        }
        .answer-item {
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #2563eb;
        }
        .question {
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
        }
        .answer {
            color: #2563eb;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
        }
        .recommendations {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .recommendations h2 {
            color: #0066cc;
            margin-bottom: 15px;
        }
        .recommendation-item {
            margin: 10px 0;
            padding-left: 20px;
            position: relative;
        }
        .recommendation-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #28a745;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>タスカル 資産運用診断結果</h1>
        
        <div class="score-section">
            <div class="score-label">あなたの資金調達力</div>
            <div class="score-value">${score}点</div>
            <div>診断日時: ${timestamp}</div>
        </div>

        <div class="recommendations">
            <h2>あなたへのおすすめ</h2>
            ${getRecommendations(score)}
        </div>

        <div class="answer-section">
            <h2>診断回答内容</h2>
            ${Object.entries(answers).map(([question, answer]) => `
                <div class="answer-item">
                    <div class="question">${question}</div>
                    <div class="answer">${answer}</div>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>この診断結果は ${timestamp} に作成されました</p>
            <p>お問い合わせ: support@taskaru.jp</p>
            <p>&copy; 2024 タスカル All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>
`;
}

function getRecommendations(score: number): string {
  let recommendations = [];
  
  if (score >= 80) {
    recommendations = [
      '積極的な資産運用が可能な状態です',
      '分散投資でリスクを管理しながら高いリターンを狙えます',
      '専門家との相談で更なる最適化が可能です'
    ];
  } else if (score >= 60) {
    recommendations = [
      'バランスの取れた資産運用をお勧めします',
      'リスクとリターンのバランスを重視した投資戦略が適しています',
      '定期的な見直しで着実な資産形成を目指しましょう'
    ];
  } else if (score >= 40) {
    recommendations = [
      '堅実な資産運用から始めることをお勧めします',
      'まずは少額から始めて、徐々に投資額を増やしていきましょう',
      '基礎知識の習得と並行して実践することが大切です'
    ];
  } else {
    recommendations = [
      '資産運用の基礎から学ぶことをお勧めします',
      'リスクの低い商品から始めて、経験を積みましょう',
      '専門家のアドバイスを受けながら計画を立てることが重要です'
    ];
  }

  return recommendations.map(item => 
    `<div class="recommendation-item">${item}</div>`
  ).join('');
}
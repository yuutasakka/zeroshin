import { VercelRequest, VercelResponse } from '@vercel/node';

// 本番環境でテスト/デバッグエンドポイントを無効化するミドルウェア
export function disableInProduction(handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // 本番環境でテストエンドポイントを無効化
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_ENDPOINTS) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'This endpoint is not available in production'
      });
    }
    
    // 開発環境またはテストエンドポイントが許可されている場合のみ実行
    return handler(req, res);
  };
}
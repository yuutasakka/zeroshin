import { VercelRequest, VercelResponse } from '@vercel/node';

// LINE認証コールバック用リダイレクトハンドラー
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  // フロントエンドにリダイレクトしてパラメータを渡す
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://zeroshin.vercel.app' 
    : 'http://localhost:8081';

  if (error) {
    // エラーの場合
    return res.redirect(`${frontendUrl}/line-auth-error?error=${encodeURIComponent(error as string)}`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/line-auth-error?error=invalid_params`);
  }

  // 成功の場合、フロントエンドの認証処理ページに遷移
  return res.redirect(`${frontendUrl}/line-auth-success?code=${encodeURIComponent(code as string)}&state=${encodeURIComponent(state as string)}`);
}
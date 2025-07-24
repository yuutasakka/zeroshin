import { VercelRequest, VercelResponse } from '@vercel/node';
import * as argon2 from 'argon2';

// セキュアなパスワードハッシュ化API（サーバーサイドのみ）
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 内部APIのみアクセス可能
  const internalKey = req.headers['x-internal-api-key'];
  const expectedKey = process.env.INTERNAL_API_KEY;
  
  // 環境変数が設定されていない場合はエラー
  if (!expectedKey) {
    console.error('INTERNAL_API_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (internalKey !== expectedKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { password, action } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid password' });
    }

    if (action === 'hash') {
      // Argon2idでハッシュ化（最も安全）
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1,
      });

      return res.status(200).json({ hash });
    } else if (action === 'verify') {
      const { hash } = req.body;
      
      if (!hash || typeof hash !== 'string') {
        return res.status(400).json({ error: 'Invalid hash' });
      }

      const isValid = await argon2.verify(hash, password);
      return res.status(200).json({ isValid });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Password hashing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimitMonitor, distributedRateLimiter } from '../../src/middleware/advancedRateLimit';
import { ipAnalyzer } from '../../src/utils/ipAnalyzer';

// 管理者権限チェック用のミドルウェア
const requireAdmin = (req: NextApiRequest): boolean => {
  // ここでは簡単な実装。実際の管理者認証ロジックを実装してください
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token === process.env.ADMIN_API_TOKEN;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 管理者権限チェック
  if (!requireAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { method, query } = req;
  const endpoint = query.endpoint as string;
  
  try {
    switch (method) {
      case 'GET':
        if (endpoint === 'stats') {
          // レート制限統計を取得
          const timeRange = query.timeRange as string || '1h';
          const stats = await getRateLimitStats(timeRange);
          return res.status(200).json(stats);
        }
        
        if (endpoint === 'configs') {
          // レート制限設定を取得
          const configs = await getRateLimitConfigs();
          return res.status(200).json(configs);
        }
        
        if (endpoint === 'violations') {
          // 違反履歴を取得
          const limit = parseInt(query.limit as string) || 100;
          const violations = await rateLimitMonitor.getRecentViolations(limit);
          return res.status(200).json(violations);
        }
        
        break;
        
      case 'POST':
        if (endpoint === 'clear') {
          // 違反履歴をクリア
          const ip = query.ip as string;
          await clearRateLimitViolations(ip);
          return res.status(200).json({ success: true });
        }
        
        if (endpoint === 'blacklist') {
          // IPをブラックリストに追加
          const ip = req.body.ip;
          const duration = req.body.duration || 24 * 60 * 60 * 1000;
          await blacklistIP(ip, duration);
          return res.status(200).json({ success: true });
        }
        
        break;
        
      case 'PUT':
        if (endpoint === 'config') {
          // レート制限設定を更新
          const configName = query.config as string;
          const updates = req.body;
          await updateRateLimitConfig(configName, updates);
          return res.status(200).json({ success: true });
        }
        
        break;
        
      case 'DELETE':
        if (endpoint === 'blacklist') {
          // IPをブラックリストから削除
          const ip = query.ip as string;
          await removeFromBlacklist(ip);
          return res.status(200).json({ success: true });
        }
        
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
    
    return res.status(404).json({ error: 'Endpoint not found' });
    
  } catch (error) {
    console.error('Rate limit API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// レート制限統計を取得
async function getRateLimitStats(timeRange: string) {
  const stats = await rateLimitMonitor.getStats();
  const violations = await rateLimitMonitor.getRecentViolations(1000);
  
  // 時間範囲による絞り込み
  const now = Date.now();
  const ranges: { [key: string]: number } = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const rangeMs = ranges[timeRange] || ranges['1h'];
  const filteredViolations = violations.filter(v => 
    now - new Date(v.timestamp).getTime() <= rangeMs
  );
  
  // 統計を計算
  const totalRequests = parseInt(stats.total_requests || '0');
  const blockedRequests = filteredViolations.length;
  
  const limiterCounts = filteredViolations.reduce((acc: any, v) => {
    acc[v.limiter] = (acc[v.limiter] || 0) + 1;
    return acc;
  }, {});
  
  const topLimiters = Object.entries(limiterCounts)
    .map(([name, violations]) => ({ name, violations: violations as number }))
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 5);
  
  return {
    totalRequests,
    blockedRequests,
    topLimiters,
    recentViolations: filteredViolations.slice(0, 50)
  };
}

// レート制限設定を取得
async function getRateLimitConfigs() {
  // デフォルト設定
  const defaultConfigs = [
    { name: 'general', windowMs: 15 * 60 * 1000, maxRequests: 100, enabled: true },
    { name: 'auth', windowMs: 15 * 60 * 1000, maxRequests: 5, enabled: true },
    { name: 'sms', windowMs: 60 * 60 * 1000, maxRequests: 3, enabled: true },
    { name: 'diagnosis', windowMs: 30 * 60 * 1000, maxRequests: 10, enabled: true },
    { name: 'admin', windowMs: 5 * 60 * 1000, maxRequests: 50, enabled: true },
    { name: 'read', windowMs: 1 * 60 * 1000, maxRequests: 60, enabled: true },
    { name: 'write', windowMs: 5 * 60 * 1000, maxRequests: 20, enabled: true }
  ];
  
  // 現在のリクエスト数を取得
  const configsWithCurrent = await Promise.all(
    defaultConfigs.map(async (config) => ({
      ...config,
      currentRequests: await distributedRateLimiter.getCount(config.name)
    }))
  );
  
  return configsWithCurrent;
}

// 違反履歴をクリア
async function clearRateLimitViolations(ip?: string) {
  if (ip) {
    // 特定のIPの違反をクリア
    await distributedRateLimiter.reset(`ip:${ip}`);
  } else {
    // すべての違反をクリア
    // Redisの場合、パターンマッチでキーを削除
  }
}

// レート制限設定を更新
async function updateRateLimitConfig(configName: string, updates: any) {
  // 設定の検証
  if (updates.maxRequests && (updates.maxRequests < 1 || updates.maxRequests > 10000)) {
    throw new Error('Invalid maxRequests value');
  }
  
  if (updates.windowMs && (updates.windowMs < 1000 || updates.windowMs > 24 * 60 * 60 * 1000)) {
    throw new Error('Invalid windowMs value');
  }
  
  // 設定を保存（実際の実装では永続化する）
  console.log(`Updating rate limit config for ${configName}:`, updates);
}

// IPをブラックリストに追加
async function blacklistIP(ip: string, duration: number) {
  // IP分析を行い、妥当性を確認
  const analysis = await ipAnalyzer.checkReputation(ip);
  
  // ブラックリストに追加
  // 実装では、永続化されたブラックリストを使用
  console.log(`Blacklisting IP ${ip} for ${duration}ms`);
}

// IPをブラックリストから削除
async function removeFromBlacklist(ip: string) {
  // ブラックリストから削除
  console.log(`Removing IP ${ip} from blacklist`);
}
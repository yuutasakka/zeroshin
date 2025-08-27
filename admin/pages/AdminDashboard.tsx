import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../src/components/supabaseClient';
import { logger } from '../utils/logger';
import { errorHandler, ErrorTypes } from '../utils/errorHandler';
import { navigateTo } from '../utils/navigation';

interface DashboardStats {
  totalUsers: number;
  todayRegistrations: number;
  activeAnalyses: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todayRegistrations: 0,
    activeAnalyses: 0,
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      logger.info('Loading dashboard data', {}, 'AdminDashboard');
      
      // ユーザー統計を取得
      const { data: users, error: usersError } = await supabase
        .from('phone_verifications')
        .select('*');

      if (usersError) {
        const appError = errorHandler.handleSupabaseError(usersError, 'AdminDashboard');
        logger.error('Failed to load user statistics', { error: usersError }, 'AdminDashboard');
        throw appError;
      }

      if (users) {
        const today = new Date().toISOString().split('T')[0];
        const todayUsers = users.filter(user => 
          user.created_at?.startsWith(today)
        );

        const newStats: DashboardStats = {
          totalUsers: users.length,
          todayRegistrations: todayUsers.length,
          activeAnalyses: users.filter(u => u.verified).length,
          systemHealth: 'healthy'
        };

        setStats(newStats);
        
        logger.info('Dashboard data loaded successfully', {
          totalUsers: newStats.totalUsers,
          todayRegistrations: newStats.todayRegistrations,
          activeAnalyses: newStats.activeAnalyses
        }, 'AdminDashboard');
      }
    } catch (error) {
      const appError = errorHandler.handleError(error, 'AdminDashboard');
      logger.error('Dashboard data loading failed', { error }, 'AdminDashboard');
      
      // エラー状態をUIに反映
      setStats(prevStats => ({
        ...prevStats,
        systemHealth: 'critical'
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // システムヘルスの色を計算（メモ化）
  const healthColor = useMemo(() => {
    switch (stats.systemHealth) {
      case 'healthy': return '#28a745';
      case 'warning': return '#ffc107';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  }, [stats.systemHealth]);

  // 統計情報の表示テキスト（メモ化）
  const statusText = useMemo(() => {
    switch (stats.systemHealth) {
      case 'healthy': return '正常';
      case 'warning': return '警告';
      case 'critical': return 'エラー';
      default: return '不明';
    }
  }, [stats.systemHealth]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = useCallback(async () => {
    try {
      logger.info('Admin logout initiated', {}, 'AdminDashboard');
      await supabase.auth.signOut();
      logger.info('Admin logout successful', {}, 'AdminDashboard');
      navigateTo.reload();
    } catch (error) {
      const appError = errorHandler.handleSupabaseError(error, 'AdminDashboard');
      logger.error('Logout failed', { error }, 'AdminDashboard');
      // ログアウトエラーでも強制的にリダイレクト
      navigateTo.login();
    }
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>ダッシュボードを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>管理者ダッシュボード</h1>
          <div className="header-actions">
            <button className="settings-btn" onClick={() => navigateTo.settings()}>
              設定
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>総ユーザー数</h3>
              <p className="stat-number">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>本日の新規登録</h3>
              <p className="stat-number">{stats.todayRegistrations}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>アクティブ分析</h3>
              <p className="stat-number">{stats.activeAnalyses}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔧</div>
            <div className="stat-content">
              <h3>システム状態</h3>
              <p className={`stat-status ${stats.systemHealth}`} style={{ color: healthColor }}>
                {statusText}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <section className="recent-activity">
            <h2>最近のアクティビティ</h2>
            <div className="activity-list">
              <p>アクティビティデータを読み込み中...</p>
            </div>
          </section>

          <section className="quick-actions">
            <h2>クイックアクション</h2>
            <div className="action-buttons">
              <button className="action-btn" onClick={() => navigateTo.users()}>
                ユーザー管理
              </button>
              <button className="action-btn" onClick={() => navigateTo.settings()}>
                システム設定
              </button>
              <button className="action-btn" onClick={() => navigateTo.reports()}>
                レポート表示
              </button>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem 2rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-content h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .settings-btn, .logout-btn {
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          background: transparent;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .logout-btn:hover {
          background: rgba(220, 53, 69, 0.2);
          border-color: #dc3545;
        }

        .dashboard-main {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .stat-number {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .stat-status {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .stat-status.healthy {
          color: #28a745;
        }

        .stat-status.warning {
          color: #ffc107;
        }

        .stat-status.critical {
          color: #dc3545;
        }

        .dashboard-sections {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .recent-activity, .quick-actions {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .recent-activity h2, .quick-actions h2 {
          margin: 0 0 1rem 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-btn {
          padding: 0.75rem;
          background: rgba(0, 122, 204, 0.2);
          border: 1px solid #007acc;
          border-radius: 6px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: rgba(0, 122, 204, 0.3);
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        .loading-content {
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid #007acc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 1rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .dashboard-main {
            padding: 1rem;
          }

          .dashboard-sections {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// パフォーマンス向上のためのメモ化
const MemoizedAdminDashboard = React.memo(AdminDashboard);

export default MemoizedAdminDashboard;
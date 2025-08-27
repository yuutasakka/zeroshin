import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../src/components/supabaseClient';
import { logger } from '../utils/logger';
import { errorHandler, ErrorTypes } from '../utils/errorHandler';
import { sanitizeInput } from '../utils/validation';
import { navigateTo } from '../utils/navigation';

interface User {
  id: string;
  phone_number: string;
  verified: boolean;
  created_at: string;
  verification_attempts: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 検索フィルターのメモ化
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    const sanitizedSearch = sanitizeInput.searchQuery(searchTerm);
    logger.debug('Filtering users', { searchTerm: sanitizedSearch, totalUsers: users.length }, 'UserManagement');
    
    const filtered = users.filter(user =>
      user.phone_number.includes(sanitizedSearch) ||
      user.id.toLowerCase().includes(sanitizedSearch.toLowerCase())
    );
    
    return filtered;
  }, [users, searchTerm]);

  // 統計情報のメモ化
  const statistics = useMemo(() => ({
    total: users.length,
    verified: users.filter(u => u.verified).length,
    unverified: users.filter(u => !u.verified).length
  }), [users]);

  const loadUsers = useCallback(async () => {
    try {
      logger.info('Loading user data', {}, 'UserManagement');
      
      const { data, error } = await supabase
        .from('phone_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        const appError = errorHandler.handleSupabaseError(error, 'UserManagement');
        logger.error('Failed to load user data', { error }, 'UserManagement');
        throw appError;
      }

      if (data) {
        setUsers(data);
        logger.info('User data loaded successfully', { count: data.length }, 'UserManagement');
      }
    } catch (error) {
      const appError = errorHandler.handleError(error, 'UserManagement');
      logger.error('User data loading failed', { error }, 'UserManagement');
      // エラーは上位コンポーネントで処理
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteUser = useCallback(async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      logger.warn('User to delete not found', { userId }, 'UserManagement');
      return;
    }

    const confirmMessage = `ユーザー "${userToDelete.phone_number}" を削除してもよろしいですか？この操作は取り消せません。`;
    if (!confirm(confirmMessage)) {
      logger.info('User deletion cancelled by user', { userId }, 'UserManagement');
      return;
    }

    try {
      logger.info('Deleting user', { userId, phoneNumber: userToDelete.phone_number }, 'UserManagement');
      
      const { error } = await supabase
        .from('phone_verifications')
        .delete()
        .eq('id', userId);

      if (error) {
        const appError = errorHandler.handleSupabaseError(error, 'UserManagement');
        logger.error('Failed to delete user', { userId, error }, 'UserManagement');
        alert(`ユーザーの削除に失敗しました: ${appError.userMessage}`);
        return;
      }

      // ローカル状態を更新
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.filter(user => user.id !== userId);
        logger.info('User deleted successfully', { 
          userId, 
          phoneNumber: userToDelete.phone_number,
          remainingUsers: updatedUsers.length 
        }, 'UserManagement');
        return updatedUsers;
      });
      
    } catch (error) {
      const appError = errorHandler.handleError(error, 'UserManagement');
      logger.error('User deletion failed', { userId, error }, 'UserManagement');
      alert(`ユーザーの削除中にエラーが発生しました: ${errorHandler.getUserMessage(appError)}`);
    }
  }, [users]);

  const handleBack = useCallback(() => {
    navigateTo.dashboard();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (loading) {
    return (
      <div className="user-management loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>ユーザーデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <header className="management-header">
        <div className="header-content">
          <button className="back-btn" onClick={handleBack}>
            ← ダッシュボードに戻る
          </button>
          <h1>ユーザー管理</h1>
        </div>
      </header>

      <main className="management-main">
        <div className="management-container">
          <div className="management-controls">
            <div className="search-section">
              <input
                type="text"
                placeholder="電話番号またはIDで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="stats-section">
              <div className="stat-item">
                <span className="stat-label">総ユーザー数:</span>
                <span className="stat-value">{statistics.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">認証済み:</span>
                <span className="stat-value">{statistics.verified}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">未認証:</span>
                <span className="stat-value">{statistics.unverified}</span>
              </div>
            </div>
          </div>

          <div className="users-table-container">
            {filteredUsers.length === 0 ? (
              <div className="no-users">
                <p>
                  {searchTerm ? '検索条件に一致するユーザーが見つかりません' : 'ユーザーデータがありません'}
                </p>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>電話番号</th>
                    <th>認証状態</th>
                    <th>認証試行回数</th>
                    <th>登録日時</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="user-id">{user.id.substring(0, 8)}...</td>
                      <td className="phone-number">{user.phone_number}</td>
                      <td>
                        <span className={`status-badge ${user.verified ? 'verified' : 'unverified'}`}>
                          {user.verified ? '認証済み' : '未認証'}
                        </span>
                      </td>
                      <td className="attempts">{user.verification_attempts || 0}</td>
                      <td className="created-date">{formatDate(user.created_at)}</td>
                      <td className="actions">
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .user-management {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
        }

        .management-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem 2rem;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .back-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .header-content h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .management-main {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .management-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2rem;
        }

        .management-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-input {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          font-size: 1rem;
          width: 300px;
          max-width: 100%;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-input:focus {
          outline: none;
          border-color: #007acc;
          background: rgba(255, 255, 255, 0.15);
        }

        .stats-section {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .stat-value {
          font-size: 1.2rem;
          font-weight: 600;
          color: #007acc;
        }

        .users-table-container {
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
        }

        .users-table th,
        .users-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .users-table th {
          background: rgba(255, 255, 255, 0.1);
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .users-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .user-id {
          font-family: monospace;
          font-size: 0.9rem;
        }

        .phone-number {
          font-weight: 500;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-badge.verified {
          background: rgba(40, 167, 69, 0.2);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.5);
        }

        .status-badge.unverified {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.5);
        }

        .attempts {
          text-align: center;
          font-weight: 500;
        }

        .created-date {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .delete-btn {
          padding: 0.5rem 1rem;
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid rgba(220, 53, 69, 0.5);
          border-radius: 6px;
          color: #ff6b6b;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }

        .delete-btn:hover {
          background: rgba(220, 53, 69, 0.3);
        }

        .no-users {
          text-align: center;
          padding: 3rem;
          opacity: 0.7;
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
          .management-main {
            padding: 1rem;
          }

          .management-container {
            padding: 1.5rem;
          }

          .management-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .search-input {
            width: 100%;
          }

          .stats-section {
            justify-content: center;
          }

          .users-table {
            font-size: 0.9rem;
          }

          .users-table th,
          .users-table td {
            padding: 0.75rem;
          }

          .user-id,
          .created-date {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

// パフォーマンス向上のためのメモ化
const MemoizedUserManagement = React.memo(UserManagement);

export default MemoizedUserManagement;
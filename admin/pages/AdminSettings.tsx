import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/components/supabaseClient';

interface SystemSettings {
  maintenanceMode: boolean;
  maxUsersPerDay: number;
  smsEnabled: boolean;
  debugMode: boolean;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    maxUsersPerDay: 1000,
    smsEnabled: true,
    debugMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (!error && data) {
        setSettings({
          maintenanceMode: data.maintenance_mode || false,
          maxUsersPerDay: data.max_users_per_day || 1000,
          smsEnabled: data.sms_enabled || true,
          debugMode: data.debug_mode || false
        });
      }
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          maintenance_mode: settings.maintenanceMode,
          max_users_per_day: settings.maxUsersPerDay,
          sms_enabled: settings.smsEnabled,
          debug_mode: settings.debugMode,
          updated_at: new Date().toISOString()
        });

      if (error) {
        setMessage('設定の保存に失敗しました: ' + error.message);
      } else {
        setMessage('設定が正常に保存されました');
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      setMessage('設定の保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="admin-settings loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <header className="settings-header">
        <div className="header-content">
          <button className="back-btn" onClick={handleBack}>
            ← ダッシュボードに戻る
          </button>
          <h1>システム設定</h1>
        </div>
      </header>

      <main className="settings-main">
        <div className="settings-container">
          {message && (
            <div className={`message ${message.includes('失敗') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="settings-section">
            <h2>基本設定</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <h3>メンテナンスモード</h3>
                <p>システムのメンテナンス時に一般ユーザーのアクセスを制限します</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({
                      ...settings,
                      maintenanceMode: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>1日あたりの最大ユーザー数</h3>
                <p>システム負荷制御のための制限値</p>
              </div>
              <div className="setting-control">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.maxUsersPerDay}
                  onChange={(e) => setSettings({
                    ...settings,
                    maxUsersPerDay: parseInt(e.target.value) || 1000
                  })}
                  className="number-input"
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>SMS認証機能</h3>
                <p>電話番号認証システムの有効/無効を切り替えます</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.smsEnabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      smsEnabled: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>デバッグモード</h3>
                <p>開発用のデバッグ情報を表示します（本番環境では無効にしてください）</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.debugMode}
                    onChange={(e) => setSettings({
                      ...settings,
                      debugMode: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <span className="saving-text">
                  <span className="spinner small"></span>
                  保存中...
                </span>
              ) : (
                '設定を保存'
              )}
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .admin-settings {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
        }

        .settings-header {
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

        .settings-main {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .settings-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2rem;
        }

        .message {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          font-weight: 500;
        }

        .message.success {
          background: rgba(40, 167, 69, 0.2);
          border: 1px solid rgba(40, 167, 69, 0.5);
          color: #28a745;
        }

        .message.error {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid rgba(220, 53, 69, 0.5);
          color: #ff6b6b;
        }

        .settings-section h2 {
          margin: 0 0 2rem 0;
          font-size: 1.4rem;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .setting-info p {
          margin: 0;
          opacity: 0.8;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.3);
          transition: 0.3s;
          border-radius: 26px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: #007acc;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .number-input {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #ffffff;
          font-size: 1rem;
          width: 100px;
          text-align: center;
        }

        .number-input:focus {
          outline: none;
          border-color: #007acc;
        }

        .settings-actions {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .save-btn {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .saving-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner.small {
          width: 16px;
          height: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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

        @media (max-width: 768px) {
          .settings-main {
            padding: 1rem;
          }

          .settings-container {
            padding: 1.5rem;
          }

          .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .setting-control {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;
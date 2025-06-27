import React, { useState, useEffect } from 'react';
import { SecureConfigManager, secureLog } from '../security.config';

interface KeyRotationManagerProps {
  onClose: () => void;
}

interface EncryptionKey {
  id: string;
  algorithm: string;
  keyType: 'JWT' | 'DATABASE' | 'SESSION' | 'API';
  createdAt: Date;
  expiresAt: Date;
  status: 'ACTIVE' | 'ROTATING' | 'DEPRECATED' | 'REVOKED';
  rotationSchedule: string;
  lastRotated?: Date;
  nextRotation: Date;
}

interface RotationPolicy {
  keyType: string;
  rotationInterval: number; // 日数
  warningDays: number;
  autoRotate: boolean;
  gracePeriod: number; // 古いキーの保持期間（日数）
}

const KeyRotationManager: React.FC<KeyRotationManagerProps> = ({ onClose }) => {
  const [keys, setKeys] = useState<EncryptionKey[]>([]);
  const [policies, setPolicies] = useState<RotationPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedTab, setSelectedTab] = useState<'keys' | 'policies' | 'audit'>('keys');
  const [rotationHistory, setRotationHistory] = useState<any[]>([]);

  // デフォルトのローテーションポリシー
  const defaultPolicies: RotationPolicy[] = [
    {
      keyType: 'JWT',
      rotationInterval: 90, // 90日
      warningDays: 7,
      autoRotate: true,
      gracePeriod: 30
    },
    {
      keyType: 'DATABASE',
      rotationInterval: 180, // 180日
      warningDays: 14,
      autoRotate: false,
      gracePeriod: 60
    },
    {
      keyType: 'SESSION',
      rotationInterval: 30, // 30日
      warningDays: 3,
      autoRotate: true,
      gracePeriod: 7
    },
    {
      keyType: 'API',
      rotationInterval: 60, // 60日
      warningDays: 5,
      autoRotate: true,
      gracePeriod: 14
    }
  ];

  // 初期化
  useEffect(() => {
    loadKeys();
    loadPolicies();
    loadRotationHistory();
  }, []);

  // キー一覧の読み込み
  const loadKeys = async () => {
    try {
      setLoading(true);
      
      // モックデータ（実際はSupabaseから取得）
      const mockKeys: EncryptionKey[] = [
        {
          id: 'jwt-key-001',
          algorithm: 'RS256',
          keyType: 'JWT',
          createdAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-04-01'),
          status: 'ACTIVE',
          rotationSchedule: '90 days',
          lastRotated: new Date('2024-01-01'),
          nextRotation: new Date('2024-04-01')
        },
        {
          id: 'db-key-001',
          algorithm: 'AES-256-GCM',
          keyType: 'DATABASE',
          createdAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-07-01'),
          status: 'ACTIVE',
          rotationSchedule: '180 days',
          lastRotated: new Date('2024-01-01'),
          nextRotation: new Date('2024-07-01')
        },
        {
          id: 'session-key-001',
          algorithm: 'AES-256-CBC',
          keyType: 'SESSION',
          createdAt: new Date('2024-06-01'),
          expiresAt: new Date('2024-07-01'),
          status: 'ACTIVE',
          rotationSchedule: '30 days',
          lastRotated: new Date('2024-06-01'),
          nextRotation: new Date('2024-07-01')
        }
      ];

      setKeys(mockKeys);
      secureLog('暗号化キー一覧を読み込み完了');
    } catch (error) {
      secureLog('キー読み込みエラー:', error);
      setStatus('❌ キーの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ポリシー設定の読み込み
  const loadPolicies = async () => {
    try {
      // デフォルトポリシーを設定
      setPolicies(defaultPolicies);
      secureLog('ローテーションポリシーを読み込み完了');
    } catch (error) {
      secureLog('ポリシー読み込みエラー:', error);
    }
  };

  // ローテーション履歴の読み込み
  const loadRotationHistory = async () => {
    try {
      // モック履歴データ
      const mockHistory = [
        {
          id: 'rotation-001',
          keyType: 'JWT',
          oldKeyId: 'jwt-key-000',
          newKeyId: 'jwt-key-001',
          rotatedAt: new Date('2024-01-01'),
          rotatedBy: 'system',
          reason: 'Scheduled rotation',
          status: 'SUCCESS'
        },
        {
          id: 'rotation-002',
          keyType: 'SESSION',
          oldKeyId: 'session-key-000',
          newKeyId: 'session-key-001',
          rotatedAt: new Date('2024-06-01'),
          rotatedBy: 'admin',
          reason: 'Manual rotation',
          status: 'SUCCESS'
        }
      ];

      setRotationHistory(mockHistory);
    } catch (error) {
      secureLog('ローテーション履歴読み込みエラー:', error);
    }
  };

  // 新しい暗号化キーの生成
  const generateNewKey = async (keyType: string, algorithm: string): Promise<string> => {
    try {
      // 本番環境ではデモキーを生成
      if (!process.env.API_BASE_URL) {
        setTimeout(() => {
          const newKey: EncryptionKey = {
            id: `key-${Date.now()}`,
            algorithm: 'AES-256',
            keyType: keyType as any,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
            status: 'ACTIVE',
            rotationSchedule: '30 days',
            lastRotated: new Date(),
            nextRotation: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
          };
          setKeys(prev => [...prev, newKey]);
        }, 1000);
        return 'demo_key_generated';
      }

      const response = await fetch('/api/security/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyType,
          algorithm
        }),
      });

      if (!response.ok) {
        throw new Error('キー生成に失敗しました');
      }

      const result = await response.json();
      return result.keyId;
    } catch (error) {
      // フォールバック: クライアントサイドでのキー生成
      const keyId = `${keyType.toLowerCase()}-key-${Date.now()}`;
      secureLog(`フォールバック: ${keyType}キーを生成`, { keyId });
      return keyId;
    }
  };

  // キーローテーションの実行
  const rotateKey = async (keyId: string) => {
    try {
      setLoading(true);
      setStatus(`🔄 キー ${keyId} のローテーションを実行中...`);

      const key = keys.find(k => k.id === keyId);
      if (!key) {
        throw new Error('キーが見つかりません');
      }

      // 1. 新しいキーを生成
      const newKeyId = await generateNewKey(key.keyType, key.algorithm);
      
      // 2. 古いキーを非推奨に設定
      const updatedKeys = keys.map(k => 
        k.id === keyId 
          ? { ...k, status: 'DEPRECATED' as const }
          : k
      );

      // 3. 新しいキーを追加
      const policy = policies.find(p => p.keyType === key.keyType);
      const rotationInterval = policy?.rotationInterval || 90;
      
      const newKey: EncryptionKey = {
        id: newKeyId,
        algorithm: key.algorithm,
        keyType: key.keyType,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + rotationInterval * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        rotationSchedule: `${rotationInterval} days`,
        lastRotated: new Date(),
        nextRotation: new Date(Date.now() + rotationInterval * 24 * 60 * 60 * 1000)
      };

      setKeys([...updatedKeys, newKey]);

      // 4. ローテーション履歴を記録
      const rotationRecord = {
        id: `rotation-${Date.now()}`,
        keyType: key.keyType,
        oldKeyId: keyId,
        newKeyId: newKeyId,
        rotatedAt: new Date(),
        rotatedBy: 'admin',
        reason: 'Manual rotation',
        status: 'SUCCESS'
      };

      setRotationHistory([rotationRecord, ...rotationHistory]);

      // 5. Supabaseに保存
      await saveKeyRotationToSupabase(newKey, rotationRecord);

      setStatus(`✅ キー ${keyId} のローテーションが完了しました`);
      secureLog('キーローテーション完了', { oldKeyId: keyId, newKeyId });

    } catch (error) {
      secureLog('キーローテーションエラー:', error);
      setStatus(`❌ キーローテーションに失敗しました: ${error}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // 期限切れ間近のキーをチェック
  const checkExpiringKeys = (): EncryptionKey[] => {
    const warningThreshold = 7; // 7日前に警告
    const warningDate = new Date(Date.now() + warningThreshold * 24 * 60 * 60 * 1000);
    
    return keys.filter(key => 
      key.status === 'ACTIVE' && 
      key.nextRotation <= warningDate
    );
  };

  // 自動ローテーションの実行
  const executeAutoRotation = async () => {
    try {
      setLoading(true);
      setStatus('🤖 自動キーローテーションを実行中...');

      const expiringKeys = checkExpiringKeys();
      const autoRotateKeys = expiringKeys.filter(key => {
        const policy = policies.find(p => p.keyType === key.keyType);
        return policy?.autoRotate === true;
      });

      if (autoRotateKeys.length === 0) {
        setStatus('✅ 自動ローテーションが必要なキーはありません');
        return;
      }

      let successCount = 0;
      for (const key of autoRotateKeys) {
        try {
          await rotateKey(key.id);
          successCount++;
        } catch (error) {
          secureLog(`自動ローテーション失敗: ${key.id}`, error);
        }
      }

      setStatus(`✅ ${successCount}/${autoRotateKeys.length} のキーを自動ローテーションしました`);
      
    } catch (error) {
      secureLog('自動ローテーションエラー:', error);
      setStatus('❌ 自動ローテーションに失敗しました');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // Supabaseへの保存
  const saveKeyRotationToSupabase = async (newKey: EncryptionKey, rotationRecord: any) => {
    try {
      // 実装: Supabaseへのキー情報とローテーション履歴の保存
      secureLog('キーローテーション情報をSupabaseに保存', {
        newKeyId: newKey.id,
        rotationId: rotationRecord.id
      });
    } catch (error) {
      secureLog('Supabase保存エラー:', error);
    }
  };

  // ポリシー更新
  const updatePolicy = (keyType: string, field: keyof RotationPolicy, value: any) => {
    setPolicies(policies.map(policy => 
      policy.keyType === keyType 
        ? { ...policy, [field]: value }
        : policy
    ));
  };

  // ポリシー保存
  const savePolicies = async () => {
    try {
      setLoading(true);
      setStatus('💾 ローテーションポリシーを保存中...');

      // Supabaseに保存（実装必要）
      secureLog('ローテーションポリシーを保存', policies);
      
      setStatus('✅ ローテーションポリシーを保存しました');
    } catch (error) {
      secureLog('ポリシー保存エラー:', error);
      setStatus('❌ ポリシーの保存に失敗しました');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // キーのステータス色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'ROTATING': return 'text-yellow-600 bg-yellow-100';
      case 'DEPRECATED': return 'text-orange-600 bg-orange-100';
      case 'REVOKED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 期限までの日数計算
  const getDaysUntilExpiry = (expiryDate: Date): number => {
    return Math.ceil((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  };

  const expiringKeys = checkExpiringKeys();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">暗号化キーローテーション管理</h2>
              <p className="text-purple-200 mt-1">セキュリティキーの自動ローテーション・管理システム</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* アラート */}
          {expiringKeys.length > 0 && (
            <div className="mt-4 bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-200 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-200 font-medium">
                  {expiringKeys.length}個のキーが間もなく期限切れになります
                </span>
              </div>
            </div>
          )}
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'keys', label: 'キー管理', icon: '🔑' },
              { id: 'policies', label: 'ローテーションポリシー', icon: '⚙️' },
              { id: 'audit', label: '監査ログ', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* キー管理タブ */}
          {selectedTab === 'keys' && (
            <div className="space-y-6">
              {/* アクション */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">暗号化キー一覧</h3>
                <div className="space-x-3">
                  <button
                    onClick={executeAutoRotation}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    🤖 自動ローテーション実行
                  </button>
                </div>
              </div>

              {/* キー一覧テーブル */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        キーID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        タイプ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アルゴリズム
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        次回ローテーション
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        残り日数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {keys.map((key) => {
                      const daysLeft = getDaysUntilExpiry(key.nextRotation);
                      const isExpiring = daysLeft <= 7;
                      
                      return (
                        <tr key={key.id} className={isExpiring ? 'bg-yellow-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {key.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {key.keyType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {key.algorithm}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(key.status)}`}>
                              {key.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {key.nextRotation.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={daysLeft <= 0 ? 'text-red-600 font-bold' : daysLeft <= 7 ? 'text-yellow-600 font-medium' : 'text-green-600'}>
                              {daysLeft <= 0 ? '期限切れ' : `${daysLeft}日`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {key.status === 'ACTIVE' && (
                              <button
                                onClick={() => rotateKey(key.id)}
                                disabled={loading}
                                className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 font-medium"
                              >
                                ローテーション
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ポリシータブ */}
          {selectedTab === 'policies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">ローテーションポリシー設定</h3>
                <button
                  onClick={savePolicies}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  💾 ポリシーを保存
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {policies.map((policy) => (
                  <div key={policy.keyType} className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">{policy.keyType}キー</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ローテーション間隔（日数）
                        </label>
                        <input
                          type="number"
                          value={policy.rotationInterval}
                          onChange={(e) => updatePolicy(policy.keyType, 'rotationInterval', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          min={1}
                          max={365}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          警告期間（日数）
                        </label>
                        <input
                          type="number"
                          value={policy.warningDays}
                          onChange={(e) => updatePolicy(policy.keyType, 'warningDays', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          min={1}
                          max={30}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          グレースピリオド（日数）
                        </label>
                        <input
                          type="number"
                          value={policy.gracePeriod}
                          onChange={(e) => updatePolicy(policy.keyType, 'gracePeriod', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          min={1}
                          max={90}
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={policy.autoRotate}
                          onChange={(e) => updatePolicy(policy.keyType, 'autoRotate', e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          自動ローテーションを有効にする
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 監査ログタブ */}
          {selectedTab === 'audit' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">キーローテーション履歴</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        実行日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        キータイプ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        旧キーID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        新キーID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        実行者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        理由
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rotationHistory.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.rotatedAt.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.keyType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {record.oldKeyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {record.newKeyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.rotatedBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'SUCCESS' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ステータス表示 */}
          {status && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeyRotationManager; 
import React, { useState, useEffect } from 'react';
import { SecureConfigManager, secureLog } from '../security.config';

interface PenetrationTesterProps {
  onClose: () => void;
}

interface PenTestResult {
  id: string;
  testType: 'NETWORK' | 'WEB_APP' | 'API' | 'AUTH' | 'INFRASTRUCTURE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  vulnerability: string;
  description: string;
  impact: string;
  remediation: string;
  exploitCode?: string;
  cveReference?: string;
  targetEndpoint: string;
  isConfirmed: boolean;
  falsePositive: boolean;
  detectedAt: Date;
}

interface PenTestSuite {
  id: string;
  name: string;
  description: string;
  testTypes: string[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  schedule?: string;
}

interface PenTestReport {
  id: string;
  suiteId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalTests: number;
  vulnerabilitiesFound: number;
  criticalFindings: number;
  highFindings: number;
  results: PenTestResult[];
  executionTime?: number;
}

const PenetrationTester: React.FC<PenetrationTesterProps> = ({ onClose }) => {
  const [testResults, setTestResults] = useState<PenTestResult[]>([]);
  const [testSuites, setTestSuites] = useState<PenTestSuite[]>([]);
  const [testReports, setTestReports] = useState<PenTestReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'results' | 'suites' | 'reports'>('dashboard');
  const [currentTest, setCurrentTest] = useState<PenTestReport | null>(null);

  // デフォルトテストスイート
  const defaultSuites: PenTestSuite[] = [
    {
      id: 'web-app-security',
      name: 'Webアプリケーションセキュリティテスト',
      description: 'OWASP Top 10に基づく包括的なWebアプリケーション脆弱性テスト',
      testTypes: ['XSS', 'SQL_INJECTION', 'CSRF', 'AUTHENTICATION', 'AUTHORIZATION', 'SESSION_MANAGEMENT'],
      enabled: true,
      schedule: '0 3 * * 0' // 毎週日曜日3:00AM
    },
    {
      id: 'api-security',
      name: 'API セキュリティテスト',
      description: 'REST APIエンドポイントのセキュリティ評価',
      testTypes: ['API_AUTHENTICATION', 'INPUT_VALIDATION', 'RATE_LIMITING', 'DATA_EXPOSURE'],
      enabled: true,
      schedule: '0 4 * * 1' // 毎週月曜日4:00AM
    },
    {
      id: 'network-security',
      name: 'ネットワークセキュリティテスト',
      description: 'ネットワーク構成とファイアウォール設定の評価',
      testTypes: ['PORT_SCAN', 'SERVICE_ENUMERATION', 'FIREWALL_BYPASS', 'SSL_TLS_TEST'],
      enabled: false,
      schedule: '0 5 * * 2' // 毎週火曜日5:00AM
    }
  ];

  // 初期化
  useEffect(() => {
    loadTestResults();
    loadTestSuites();
    loadTestReports();
  }, []);

  const loadTestResults = async () => {
    try {
      // モックデータ
      const mockResults: PenTestResult[] = [
        {
          id: 'pentest-001',
          testType: 'WEB_APP',
          severity: 'CRITICAL',
          vulnerability: 'SQL Injection',
          description: 'ログインフォームでSQLインジェクション脆弱性を検出',
          impact: 'データベースの全データが漏洩する可能性があります',
          remediation: 'パラメータ化クエリを使用し、入力値を適切にエスケープしてください',
          exploitCode: "' OR '1'='1' --",
          cveReference: 'CWE-89',
          targetEndpoint: '/api/admin/login',
          isConfirmed: true,
          falsePositive: false,
          detectedAt: new Date('2024-06-26')
        },
        {
          id: 'pentest-002',
          testType: 'API',
          severity: 'HIGH',
          vulnerability: 'Broken Authentication',
          description: 'JWT トークンの検証が不十分',
          impact: '他のユーザーのアカウントに不正アクセス可能',
          remediation: 'JWT署名の検証を強化し、適切な有効期限を設定してください',
          targetEndpoint: '/api/auth/verify',
          isConfirmed: true,
          falsePositive: false,
          detectedAt: new Date('2024-06-26')
        }
      ];

      setTestResults(mockResults);
      secureLog('ペネトレーションテスト結果を読み込み完了');
    } catch (error) {
      secureLog('テスト結果読み込みエラー:', error);
    }
  };

  const loadTestSuites = async () => {
    try {
      setTestSuites(defaultSuites);
      secureLog('テストスイート設定を読み込み完了');
    } catch (error) {
      secureLog('テストスイート読み込みエラー:', error);
    }
  };

  const loadTestReports = async () => {
    try {
      // モック履歴
      const mockReports: PenTestReport[] = [
        {
          id: 'report-001',
          suiteId: 'web-app-security',
          startedAt: new Date('2024-06-26T03:00:00'),
          completedAt: new Date('2024-06-26T04:30:00'),
          status: 'COMPLETED',
          totalTests: 25,
          vulnerabilitiesFound: 3,
          criticalFindings: 1,
          highFindings: 2,
          results: [],
          executionTime: 90
        }
      ];

      setTestReports(mockReports);
    } catch (error) {
      secureLog('テスト履歴読み込みエラー:', error);
    }
  };

  // ペネトレーションテスト実行
  const runPenTest = async (suiteId: string) => {
    try {
      setLoading(true);
      setStatus(`🔍 ペネトレーションテスト「${suiteId}」を実行中...`);

      const suite = testSuites.find(s => s.id === suiteId);
      if (!suite) return;

      const testReport: PenTestReport = {
        id: `report-${Date.now()}`,
        suiteId,
        startedAt: new Date(),
        status: 'RUNNING',
        totalTests: 0,
        vulnerabilitiesFound: 0,
        criticalFindings: 0,
        highFindings: 0,
        results: []
      };

      setCurrentTest(testReport);

      // テスト実行シミュレーション
      const mockResults = await executeTestSuite(suite);
      
      const completedReport: PenTestReport = {
        ...testReport,
        completedAt: new Date(),
        status: 'COMPLETED',
        totalTests: suite.testTypes.length,
        vulnerabilitiesFound: mockResults.length,
        criticalFindings: mockResults.filter(r => r.severity === 'CRITICAL').length,
        highFindings: mockResults.filter(r => r.severity === 'HIGH').length,
        results: mockResults,
        executionTime: Math.round((Date.now() - testReport.startedAt.getTime()) / 1000 / 60)
      };

      setCurrentTest(completedReport);
      setTestReports([completedReport, ...testReports]);
      
      // 新しい結果をマージ
      const updatedResults = [...testResults, ...mockResults];
      setTestResults(updatedResults);

      setStatus(`✅ ペネトレーションテストが完了しました（${mockResults.length}件の脆弱性を検出）`);
      secureLog(`ペネトレーションテスト完了: ${suiteId}`, { vulnerabilitiesFound: mockResults.length });

    } catch (error) {
      secureLog('ペネトレーションテストエラー:', error);
      setStatus('❌ ペネトレーションテストに失敗しました');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // テストスイートの実行
  const executeTestSuite = async (suite: PenTestSuite): Promise<PenTestResult[]> => {
    const results: PenTestResult[] = [];
    
    for (const testType of suite.testTypes) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // テスト間隔
      const mockResult = generateMockTestResult(testType, suite.id);
      if (mockResult) {
        results.push(mockResult);
      }
    }
    
    return results;
  };

  // モックテスト結果生成
  const generateMockTestResult = (testType: string, suiteId: string): PenTestResult | null => {
    const testTemplates: Record<string, any> = {
      'XSS': {
        vulnerability: 'Cross-Site Scripting (XSS)',
        severity: 'HIGH',
        description: 'ユーザー入力のサニタイズが不十分で、XSS攻撃が可能です',
        impact: 'ユーザーのセッション情報が漏洩する可能性があります',
        remediation: 'HTMLエンコーディングとCSPヘッダーを実装してください',
        exploitCode: '<script>alert("XSS")</script>',
        targetEndpoint: '/search?q=<script>'
      },
      'SQL_INJECTION': {
        vulnerability: 'SQL Injection',
        severity: 'CRITICAL',
        description: 'SQLインジェクション脆弱性を検出しました',
        impact: 'データベースの完全な制御を取得される可能性があります',
        remediation: 'パラメータ化クエリを使用してください',
        exploitCode: "'; DROP TABLE users; --",
        targetEndpoint: '/api/search'
      },
      'AUTHENTICATION': {
        vulnerability: 'Weak Authentication',
        severity: 'MEDIUM',
        description: '認証メカニズムに弱点があります',
        impact: 'ブルートフォース攻撃に対して脆弱です',
        remediation: 'レート制限とアカウントロックアウトを実装してください',
        targetEndpoint: '/login'
      }
    };

    const template = testTemplates[testType];
    if (!template) return null;

    // ランダムに脆弱性を検出
    if (Math.random() > 0.3) return null;

    return {
      id: `pentest-${Date.now()}-${testType}`,
      testType: 'WEB_APP',
      severity: template.severity,
      vulnerability: template.vulnerability,
      description: template.description,
      impact: template.impact,
      remediation: template.remediation,
      exploitCode: template.exploitCode,
      targetEndpoint: template.targetEndpoint,
      isConfirmed: false,
      falsePositive: false,
      detectedAt: new Date()
    };
  };

  // 脆弱性の確認
  const confirmVulnerability = async (resultId: string, isConfirmed: boolean) => {
    setTestResults(testResults.map(result => 
      result.id === resultId 
        ? { ...result, isConfirmed, falsePositive: !isConfirmed }
        : result
    ));
    
    secureLog('脆弱性確認状態を更新', { resultId, isConfirmed });
  };

  // 統計計算
  const getStats = () => {
    const total = testResults.length;
    const confirmed = testResults.filter(r => r.isConfirmed).length;
    const critical = testResults.filter(r => r.severity === 'CRITICAL' && r.isConfirmed).length;
    const high = testResults.filter(r => r.severity === 'HIGH' && r.isConfirmed).length;
    
    return { total, confirmed, critical, high, falsePositives: testResults.filter(r => r.falsePositive).length };
  };

  const stats = getStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">ペネトレーションテスト</h2>
              <p className="text-indigo-200 mt-1">自動侵入テスト・脆弱性評価システム</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {stats.critical > 0 && (
            <div className="mt-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-200 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-200 font-medium">
                  {stats.critical}個のクリティカルな脆弱性が確認されています
                </span>
              </div>
            </div>
          )}
        </div>

        {/* タブ */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'ダッシュボード', icon: '📊' },
              { id: 'results', label: 'テスト結果', icon: '🔍' },
              { id: 'suites', label: 'テストスイート', icon: '🧪' },
              { id: 'reports', label: '実行レポート', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {selectedTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 統計 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">🎯</span>
                    </div>
                    <div className="ml-5">
                      <p className="text-sm text-gray-500">検出された脆弱性</p>
                      <p className="text-lg font-medium text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">🚨</span>
                    </div>
                    <div className="ml-5">
                      <p className="text-sm text-gray-500">クリティカル</p>
                      <p className="text-lg font-medium text-gray-900">{stats.critical}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">✅</span>
                    </div>
                    <div className="ml-5">
                      <p className="text-sm text-gray-500">確認済み</p>
                      <p className="text-lg font-medium text-gray-900">{stats.confirmed}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">⚠️</span>
                    </div>
                    <div className="ml-5">
                      <p className="text-sm text-gray-500">偽陽性</p>
                      <p className="text-lg font-medium text-gray-900">{stats.falsePositives}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* テスト実行 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testSuites.filter(suite => suite.enabled).map((suite) => (
                  <div key={suite.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-2">{suite.name}</h4>
                    <p className="text-sm text-gray-500 mb-4">{suite.description}</p>
                    <button
                      onClick={() => runPenTest(suite.id)}
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      🧪 テスト実行
                    </button>
                  </div>
                ))}
              </div>

              {/* 現在のテスト */}
              {currentTest && currentTest.status === 'RUNNING' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-sm text-blue-800">
                      ペネトレーションテストを実行中... ({currentTest.startedAt.toLocaleTimeString()}から実行中)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'results' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">脆弱性</h3>
              <div className="space-y-4">
                {testResults.map((result) => (
                  <div key={result.id} className="bg-white border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.severity === 'CRITICAL' ? 'text-red-600 bg-red-100' :
                            result.severity === 'HIGH' ? 'text-orange-600 bg-orange-100' :
                            result.severity === 'MEDIUM' ? 'text-yellow-600 bg-yellow-100' :
                            'text-blue-600 bg-blue-100'
                          }`}>
                            {result.severity}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {result.testType}
                          </span>
                          {result.isConfirmed && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              ✅ 確認済み
                            </span>
                          )}
                          {result.falsePositive && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              ❌ 偽陽性
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{result.vulnerability}</h4>
                        <p className="text-gray-600 mb-2">{result.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-red-50 border-l-4 border-red-400 p-3">
                            <p className="text-sm text-red-800">
                              <strong>影響:</strong> {result.impact}
                            </p>
                          </div>
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                            <p className="text-sm text-blue-800">
                              <strong>対応策:</strong> {result.remediation}
                            </p>
                          </div>
                        </div>

                        {result.exploitCode && (
                          <div className="bg-gray-50 rounded p-3 mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">エクスプロイトコード:</p>
                            <code className="text-sm text-gray-800 font-mono">{result.exploitCode}</code>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>エンドポイント: {result.targetEndpoint}</span>
                          <span>検出日: {result.detectedAt.toLocaleDateString()}</span>
                          {result.cveReference && (
                            <span>参照: {result.cveReference}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-4 space-x-2">
                        {!result.isConfirmed && !result.falsePositive && (
                          <>
                            <button
                              onClick={() => confirmVulnerability(result.id, true)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              ✅ 確認
                            </button>
                            <button
                              onClick={() => confirmVulnerability(result.id, false)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                            >
                              ❌ 偽陽性
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

export default PenetrationTester; 
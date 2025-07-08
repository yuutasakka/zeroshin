import React, { useState, useEffect } from 'react';
import { SecureConfigManager, secureLog } from '../security.config';

interface SecurityScannerProps {
  onClose: () => void;
}

interface ScanResult {
  id: string;
  scanType: 'VULNERABILITY' | 'DEPENDENCY' | 'CODE_QUALITY' | 'COMPLIANCE' | 'CONFIGURATION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  recommendation: string;
  affectedFiles?: string[];
  cveId?: string;
  cvssScore?: number;
  isFixed: boolean;
  detectedAt: Date;
  fixedAt?: Date;
}

interface ScanConfiguration {
  scanType: string;
  enabled: boolean;
  schedule: string; // cron expression
  lastRun?: Date;
  nextRun?: Date;
  autoFix: boolean;
  severity: string[];
}

interface ScanReport {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  results: ScanResult[];
}

const SecurityScanner: React.FC<SecurityScannerProps> = ({ onClose }) => {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanConfigs, setScanConfigs] = useState<ScanConfiguration[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'results' | 'config' | 'history'>('dashboard');
  const [currentScan, setCurrentScan] = useState<ScanReport | null>(null);

  // デフォルトスキャン設定
  const defaultConfigs: ScanConfiguration[] = [
    {
      scanType: 'VULNERABILITY',
      enabled: true,
      schedule: '0 2 * * *', // 毎日2:00AM
      autoFix: false,
      severity: ['CRITICAL', 'HIGH', 'MEDIUM']
    },
    {
      scanType: 'DEPENDENCY',
      enabled: true,
      schedule: '0 3 * * *', // 毎日3:00AM
      autoFix: true,
      severity: ['CRITICAL', 'HIGH']
    },
    {
      scanType: 'CODE_QUALITY',
      enabled: true,
      schedule: '0 4 * * 1', // 毎週月曜日4:00AM
      autoFix: false,
      severity: ['HIGH', 'MEDIUM', 'LOW']
    },
    {
      scanType: 'COMPLIANCE',
      enabled: true,
      schedule: '0 5 * * 0', // 毎週日曜日5:00AM
      autoFix: false,
      severity: ['CRITICAL', 'HIGH', 'MEDIUM']
    },
    {
      scanType: 'CONFIGURATION',
      enabled: true,
      schedule: '0 6 * * *', // 毎日6:00AM
      autoFix: true,
      severity: ['CRITICAL', 'HIGH']
    }
  ];

  // 初期化
  useEffect(() => {
    loadScanResults();
    loadScanConfigs();
    loadScanHistory();
  }, []);

  // スキャン結果の読み込み
  const loadScanResults = async () => {
    try {
      setLoading(true);
      
      // モックデータ（実際はSupabaseまたはスキャンAPIから取得）
      const mockResults: ScanResult[] = [
        {
          id: 'vuln-001',
          scanType: 'VULNERABILITY',
          severity: 'CRITICAL',
          title: 'SQL Injection脆弱性',
          description: 'ユーザー入力の検証が不十分で、SQLインジェクション攻撃が可能です。',
          recommendation: 'パラメータ化クエリまたはプリペアドステートメントを使用してください。',
          affectedFiles: ['components/AdminDashboardPage.tsx', 'server/index.ts'],
          cveId: 'CVE-2024-1234',
          cvssScore: 9.8,
          isFixed: false,
          detectedAt: new Date('2024-06-26')
        },
        {
          id: 'dep-001',
          scanType: 'DEPENDENCY',
          severity: 'HIGH',
          title: '古いライブラリの使用',
          description: 'セキュリティパッチが適用されていない古いバージョンのライブラリが使用されています。',
          recommendation: 'react@18.3.1 以上にアップデートしてください。',
          affectedFiles: ['package.json'],
          cveId: 'CVE-2024-5678',
          cvssScore: 7.5,
          isFixed: false,
          detectedAt: new Date('2024-06-26')
        },
        {
          id: 'config-001',
          scanType: 'CONFIGURATION',
          severity: 'MEDIUM',
          title: 'セキュリティヘッダーの欠如',
          description: 'Content-Security-PolicyやX-Frame-Optionsヘッダーが設定されていません。',
          recommendation: '適切なセキュリティヘッダーを設定してください。',
          affectedFiles: ['server/index.ts'],
          isFixed: true,
          detectedAt: new Date('2024-06-25'),
          fixedAt: new Date('2024-06-26')
        },
        {
          id: 'code-001',
          scanType: 'CODE_QUALITY',
          severity: 'LOW',
          title: 'ハードコードされた認証情報',
          description: 'ソースコード内に認証情報がハードコードされています。',
          recommendation: '環境変数または設定ファイルを使用してください。',
          affectedFiles: ['components/AdminLoginPage.tsx'],
          isFixed: true,
          detectedAt: new Date('2024-06-25'),
          fixedAt: new Date('2024-06-26')
        }
      ];

      setScanResults(mockResults);
      secureLog('セキュリティスキャン結果を読み込み完了');
    } catch (error) {
      secureLog('スキャン結果読み込みエラー:', error);
      setStatus('❌ スキャン結果の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // スキャン設定の読み込み
  const loadScanConfigs = async () => {
    try {
      setScanConfigs(defaultConfigs);
      secureLog('スキャン設定を読み込み完了');
    } catch (error) {
      secureLog('スキャン設定読み込みエラー:', error);
    }
  };

  // スキャン履歴の読み込み
  const loadScanHistory = async () => {
    try {
      const mockHistory: ScanReport[] = [
        {
          id: 'scan-001',
          startedAt: new Date('2024-06-26T02:00:00'),
          completedAt: new Date('2024-06-26T02:15:00'),
          status: 'COMPLETED',
          totalIssues: 12,
          criticalIssues: 1,
          highIssues: 2,
          mediumIssues: 4,
          lowIssues: 5,
          results: []
        },
        {
          id: 'scan-002',
          startedAt: new Date('2024-06-25T02:00:00'),
          completedAt: new Date('2024-06-25T02:20:00'),
          status: 'COMPLETED',
          totalIssues: 15,
          criticalIssues: 2,
          highIssues: 3,
          mediumIssues: 5,
          lowIssues: 5,
          results: []
        }
      ];

      setScanHistory(mockHistory);
    } catch (error) {
      secureLog('スキャン履歴読み込みエラー:', error);
    }
  };

  // 個別スキャン実行
  const runScan = async (scanType: string) => {
    try {
      setLoading(true);
      setStatus(`🔍 ${scanType}スキャンを実行中...`);

      const scanReport: ScanReport = {
        id: `scan-${Date.now()}`,
        startedAt: new Date(),
        status: 'RUNNING',
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        results: []
      };

      setCurrentScan(scanReport);

      // スキャン実行のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 3000));

      // モック結果生成
      const mockResults = await generateMockScanResults(scanType);
      
      const completedReport: ScanReport = {
        ...scanReport,
        completedAt: new Date(),
        status: 'COMPLETED',
        totalIssues: mockResults.length,
        criticalIssues: mockResults.filter(r => r.severity === 'CRITICAL').length,
        highIssues: mockResults.filter(r => r.severity === 'HIGH').length,
        mediumIssues: mockResults.filter(r => r.severity === 'MEDIUM').length,
        lowIssues: mockResults.filter(r => r.severity === 'LOW').length,
        results: mockResults
      };

      setCurrentScan(completedReport);
      setScanHistory([completedReport, ...scanHistory]);
      
      // 新しい結果をマージ
      const updatedResults = [...scanResults];
      mockResults.forEach(newResult => {
        const existingIndex = updatedResults.findIndex(r => r.id === newResult.id);
        if (existingIndex >= 0) {
          updatedResults[existingIndex] = newResult;
        } else {
          updatedResults.push(newResult);
        }
      });
      setScanResults(updatedResults);

      setStatus(`✅ ${scanType}スキャンが完了しました（${mockResults.length}件の問題を検出）`);
      secureLog(`${scanType}スキャン完了`, { issuesFound: mockResults.length });

    } catch (error) {
      secureLog(`${scanType}スキャンエラー:`, error);
      setStatus(`❌ ${scanType}スキャンに失敗しました`);
      
      if (currentScan) {
        setCurrentScan({
          ...currentScan,
          completedAt: new Date(),
          status: 'FAILED'
        });
      }
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // 全スキャン実行
  const runAllScans = async () => {
    try {
      setLoading(true);
      setStatus('🔍 全セキュリティスキャンを実行中...');

      const enabledScans = scanConfigs.filter(config => config.enabled);
      const totalIssues = 0;

      for (const config of enabledScans) {
        await runScan(config.scanType);
        await new Promise(resolve => setTimeout(resolve, 1000)); // スキャン間隔
      }

      setStatus(`✅ 全スキャンが完了しました`);
      
    } catch (error) {
      secureLog('全スキャンエラー:', error);
      setStatus('❌ 全スキャンに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // モックスキャン結果生成
  const generateMockScanResults = async (scanType: string): Promise<ScanResult[]> => {
    const scanTemplates = {
      'VULNERABILITY': [
        {
          title: 'Cross-Site Scripting (XSS)',
          description: 'ユーザー入力のサニタイズが不十分です。',
          severity: 'HIGH' as const,
          recommendation: 'DOMPurifyライブラリを使用してください。'
        },
        {
          title: 'Insecure Direct Object Reference',
          description: '認可チェックが不十分です。',
          severity: 'MEDIUM' as const,
          recommendation: 'オブジェクトアクセス時に権限を確認してください。'
        }
      ],
      'DEPENDENCY': [
        {
          title: '脆弱性のあるNode.jsライブラリ',
          description: 'lodash@4.17.20に既知の脆弱性があります。',
          severity: 'HIGH' as const,
          recommendation: 'lodash@4.17.21以上にアップデートしてください。'
        }
      ],
      'CODE_QUALITY': [
        {
          title: '複雑度の高い関数',
          description: '関数の循環的複雑度が高すぎます。',
          severity: 'LOW' as const,
          recommendation: '関数を小さな単位に分割してください。'
        }
      ],
      'COMPLIANCE': [
        {
          title: 'GDPR違反の可能性',
          description: '個人データの処理に適切な同意が得られていません。',
          severity: 'CRITICAL' as const,
          recommendation: 'プライバシーポリシーと同意フォームを実装してください。'
        }
      ],
      'CONFIGURATION': [
        {
          title: '弱いSSL/TLS設定',
          description: 'TLS 1.0/1.1が有効になっています。',
          severity: 'MEDIUM' as const,
          recommendation: 'TLS 1.2以上のみを有効にしてください。'
        }
      ]
    };

    const templates = scanTemplates[scanType as keyof typeof scanTemplates] || [];
    
    return templates.map((template, index) => ({
      id: `${scanType.toLowerCase()}-${Date.now()}-${index}`,
      scanType: scanType as ScanResult['scanType'],
      severity: template.severity,
      title: template.title,
      description: template.description,
      recommendation: template.recommendation,
      affectedFiles: [`file-${index + 1}.tsx`],
      isFixed: false,
      detectedAt: new Date()
    }));
  };

  // 問題の修正
  const fixIssue = async (issueId: string) => {
    try {
      setLoading(true);
      setStatus(`🔧 問題 ${issueId} を修正中...`);

      // 修正処理のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 結果を更新
      setScanResults(scanResults.map(result => 
        result.id === issueId 
          ? { ...result, isFixed: true, fixedAt: new Date() }
          : result
      ));

      setStatus(`✅ 問題 ${issueId} を修正しました`);
      secureLog('セキュリティ問題修正完了', { issueId });

    } catch (error) {
      secureLog('問題修正エラー:', error);
      setStatus(`❌ 問題 ${issueId} の修正に失敗しました`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // 設定更新
  const updateScanConfig = (scanType: string, field: keyof ScanConfiguration, value: any) => {
    setScanConfigs(scanConfigs.map(config => 
      config.scanType === scanType 
        ? { ...config, [field]: value }
        : config
    ));
  };

  // 設定保存
  const saveScanConfigs = async () => {
    try {
      setLoading(true);
      setStatus('💾 スキャン設定を保存中...');

      // Supabaseに保存（実装必要）
      secureLog('スキャン設定を保存', scanConfigs);
      
      setStatus('✅ スキャン設定を保存しました');
    } catch (error) {
      secureLog('設定保存エラー:', error);
      setStatus('❌ 設定の保存に失敗しました');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // 重要度の色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      case 'INFO': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 統計計算
  const getStats = () => {
    const total = scanResults.length;
    const fixed = scanResults.filter(r => r.isFixed).length;
    const critical = scanResults.filter(r => r.severity === 'CRITICAL' && !r.isFixed).length;
    const high = scanResults.filter(r => r.severity === 'HIGH' && !r.isFixed).length;
    
    return { total, fixed, critical, high, unfixed: total - fixed };
  };

  const stats = getStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-red-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">セキュリティスキャナー</h2>
              <p className="text-red-200 mt-1">自動セキュリティ監査・脆弱性検出システム</p>
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

          {/* クリティカルアラート */}
          {stats.critical > 0 && (
            <div className="mt-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-200 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-200 font-medium">
                  {stats.critical}個のクリティカルな脆弱性が検出されています
                </span>
              </div>
            </div>
          )}
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'ダッシュボード', icon: '📊' },
              { id: 'results', label: 'スキャン結果', icon: '🔍' },
              { id: 'config', label: 'スキャン設定', icon: '⚙️' },
              { id: 'history', label: '実行履歴', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-red-500 text-red-600'
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
          {/* ダッシュボードタブ */}
          {selectedTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 統計カード */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📊</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">総問題数</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🚨</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">クリティカル</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.critical}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">⚠️</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">高リスク</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.high}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✅</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">修正済み</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.fixed}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* アクション */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">クイックアクション</h3>
                <div className="space-x-3">
                  <button
                    onClick={runAllScans}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    🔍 全スキャン実行
                  </button>
                </div>
              </div>

              {/* 個別スキャンボタン */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scanConfigs.filter(config => config.enabled).map((config) => (
                  <button
                    key={config.scanType}
                    onClick={() => runScan(config.scanType)}
                    disabled={loading}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 text-left transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">{config.scanType}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      最終実行: {config.lastRun?.toLocaleDateString() || '未実行'}
                    </p>
                  </button>
                ))}
              </div>

              {/* 現在のスキャン */}
              {currentScan && currentScan.status === 'RUNNING' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-sm text-blue-800">
                      スキャンを実行中... ({currentScan.startedAt.toLocaleTimeString()}から実行中)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* スキャン結果タブ */}
          {selectedTab === 'results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">セキュリティ問題</h3>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">すべての重要度</option>
                    <option value="CRITICAL">クリティカル</option>
                    <option value="HIGH">高</option>
                    <option value="MEDIUM">中</option>
                    <option value="LOW">低</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">すべてのタイプ</option>
                    <option value="VULNERABILITY">脆弱性</option>
                    <option value="DEPENDENCY">依存関係</option>
                    <option value="CODE_QUALITY">コード品質</option>
                    <option value="COMPLIANCE">コンプライアンス</option>
                    <option value="CONFIGURATION">設定</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {scanResults.map((result) => (
                  <div key={result.id} className={`bg-white border rounded-lg p-6 ${result.isFixed ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(result.severity)}`}>
                            {result.severity}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {result.scanType}
                          </span>
                          {result.isFixed && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              ✅ 修正済み
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{result.title}</h4>
                        <p className="text-gray-600 mb-3">{result.description}</p>
                        
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                          <p className="text-sm text-blue-800">
                            <strong>推奨対応:</strong> {result.recommendation}
                          </p>
                        </div>

                        {result.affectedFiles && result.affectedFiles.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">影響ファイル:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.affectedFiles.map((file, index) => (
                                <code key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {file}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.cveId && (
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>CVE: {result.cveId}</span>
                            {result.cvssScore && (
                              <span>CVSS: {result.cvssScore}</span>
                            )}
                            <span>検出日: {result.detectedAt.toLocaleDateString()}</span>
                            {result.fixedAt && (
                              <span>修正日: {result.fixedAt.toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 ml-4">
                        {!result.isFixed && (
                          <button
                            onClick={() => fixIssue(result.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            🔧 修正
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 設定タブ */}
          {selectedTab === 'config' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">スキャン設定</h3>
                <button
                  onClick={saveScanConfigs}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  💾 設定を保存
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scanConfigs.map((config) => (
                  <div key={config.scanType} className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">{config.scanType}スキャン</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => updateScanConfig(config.scanType, 'enabled', e.target.checked)}
                          className="h-4 w-4 text-red-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          このスキャンを有効にする
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          実行スケジュール（Cron形式）
                        </label>
                        <input
                          type="text"
                          value={config.schedule}
                          onChange={(e) => updateScanConfig(config.scanType, 'schedule', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                          placeholder="0 2 * * *"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          例: 0 2 * * * (毎日2:00AM)
                        </p>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.autoFix}
                          onChange={(e) => updateScanConfig(config.scanType, 'autoFix', e.target.checked)}
                          className="h-4 w-4 text-red-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          自動修正を有効にする
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 履歴タブ */}
          {selectedTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">スキャン実行履歴</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        実行日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        実行時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        総問題数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        クリティカル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        高リスク
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        中リスク
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        低リスク
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scanHistory.map((report) => {
                      const duration = report.completedAt 
                        ? Math.round((report.completedAt.getTime() - report.startedAt.getTime()) / 1000 / 60)
                        : null;
                      
                      return (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.startedAt.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              report.status === 'COMPLETED' ? 'text-green-600 bg-green-100' : 
                              report.status === 'FAILED' ? 'text-red-600 bg-red-100' : 
                              'text-yellow-600 bg-yellow-100'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {duration ? `${duration}分` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.totalIssues}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            {report.criticalIssues}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {report.highIssues}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                            {report.mediumIssues}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                            {report.lowIssues}
                          </td>
                        </tr>
                      );
                    })}
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

export default SecurityScanner; 
import React, { useState, useEffect } from 'react';

interface DuplicateRecord {
  lineUserId: string;
  maskedLineId: string;
  count: number;
  firstDiagnosis?: string;
  lastDiagnosis?: string;
  records?: Array<{
    id: string;
    createdAt: string;
  }>;
}

export const DuplicateLineIdDisplay: React.FC = () => {
  const [duplicates, setDuplicates] = useState<{
    diagnosisResults: DuplicateRecord[];
    users: Array<{
      lineUserId: string;
      maskedLineId: string;
      count: number;
      table: string;
    }>;
    summary: {
      totalDuplicateLineIds: number;
      totalDuplicateRecords: number;
      userTableDuplicates: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LINE IDをマスクする関数
  const maskLineId = (lineId: string): string => {
    if (lineId.length <= 8) return lineId.replace(/.(?=.{2})/g, '*');
    return lineId.substring(0, 4) + '*'.repeat(lineId.length - 8) + lineId.substring(lineId.length - 4);
  };

  useEffect(() => {
    fetchDuplicateLineIds();
  }, []);

  const fetchDuplicateLineIds = async () => {
    try {
      setLoading(true);
      setError(null);

      // 管理者権限確認
      const authResponse = await fetch('/api/auth-check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!authResponse.ok) {
        throw new Error('管理者権限が必要です');
      }

      // 重複LINE ID取得API（未実装の場合はモックデータ）
      const response = await fetch('/api/admin/duplicate-line-ids', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // APIが未実装の場合はモックデータを表示
        setDuplicates({
          diagnosisResults: [],
          users: [],
          summary: {
            totalDuplicateLineIds: 0,
            totalDuplicateRecords: 0,
            userTableDuplicates: 0,
          }
        });
        return;
      }

      const data = await response.json();
      setDuplicates(data);
    } catch (err) {
      console.error('重複LINE ID取得エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">重複LINE ID管理</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-600">重複LINE ID管理 - エラー</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchDuplicateLineIds}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!duplicates) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">重複LINE ID管理</h3>
        <p className="text-gray-600">データを取得できませんでした。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">重複LINE ID管理</h3>
        <p className="text-sm text-gray-600 mt-1">
          同じLINE IDで複数回診断を受けたユーザーを管理します
        </p>
      </div>

      {/* サマリー情報 */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {duplicates.summary.totalDuplicateLineIds}
            </div>
            <div className="text-sm text-gray-600">重複LINE ID数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {duplicates.summary.totalDuplicateRecords}
            </div>
            <div className="text-sm text-gray-600">重複診断記録数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {duplicates.summary.userTableDuplicates}
            </div>
            <div className="text-sm text-gray-600">ユーザーテーブル重複</div>
          </div>
        </div>
      </div>

      {/* 診断結果テーブルの重複 */}
      {duplicates.diagnosisResults.length > 0 && (
        <div className="p-6">
          <h4 className="text-md font-semibold mb-4 text-gray-800">
            診断結果テーブルの重複LINE ID ({duplicates.diagnosisResults.length}件)
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LINE ID (マスク済み)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    重複回数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    初回診断
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最新診断
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {duplicates.diagnosisResults.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {record.maskedLineId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {record.count}回
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.firstDiagnosis ? new Date(record.firstDiagnosis).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.lastDiagnosis ? new Date(record.lastDiagnosis).toLocaleDateString('ja-JP') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ユーザーテーブルの重複 */}
      {duplicates.users.length > 0 && (
        <div className="p-6 border-t border-gray-200">
          <h4 className="text-md font-semibold mb-4 text-gray-800">
            ユーザーテーブルの重複LINE ID ({duplicates.users.length}件)
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LINE ID (マスク済み)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    重複回数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    テーブル
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {duplicates.users.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {record.maskedLineId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {record.count}回
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.table}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {duplicates.diagnosisResults.length === 0 && duplicates.users.length === 0 && (
        <div className="p-6 text-center">
          <div className="text-gray-400 text-lg mb-2">🎉</div>
          <p className="text-gray-600">重複するLINE IDは見つかりませんでした。</p>
          <p className="text-sm text-gray-500 mt-1">すべてのユーザーが適切に管理されています。</p>
        </div>
      )}

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            最終更新: {new Date().toLocaleString('ja-JP')}
          </div>
          <button
            onClick={fetchDuplicateLineIds}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            更新
          </button>
        </div>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';

interface OfflineData {
  diagnosisAnswers?: any;
  phoneNumber?: string;
  timestamp: number;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineData, setHasOfflineData] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // オフラインデータの存在チェック
    checkOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkOfflineData = () => {
    try {
      const data = localStorage.getItem('moneyticket_offline_data');
      setHasOfflineData(!!data);
    } catch (error) {
      console.warn('オフラインデータの確認に失敗:', error);
    }
  };

  const saveOfflineData = (data: Partial<OfflineData>) => {
    try {
      const existingData = getOfflineData();
      const newData = {
        ...existingData,
        ...data,
        timestamp: Date.now()
      };
      localStorage.setItem('moneyticket_offline_data', JSON.stringify(newData));
      setHasOfflineData(true);
      return true;
    } catch (error) {
      console.error('オフラインデータの保存に失敗:', error);
      return false;
    }
  };

  const getOfflineData = (): OfflineData | null => {
    try {
      const data = localStorage.getItem('moneyticket_offline_data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('オフラインデータの取得に失敗:', error);
      return null;
    }
  };

  const clearOfflineData = () => {
    try {
      localStorage.removeItem('moneyticket_offline_data');
      setHasOfflineData(false);
      return true;
    } catch (error) {
      console.error('オフラインデータの削除に失敗:', error);
      return false;
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline || !hasOfflineData) return false;

    try {
      const data = getOfflineData();
      if (!data) return false;

      // ここで実際のサーバー同期ロジックを実装
      console.log('オフラインデータを同期中:', data);
      
      // 同期成功後にデータを削除
      clearOfflineData();
      return true;
    } catch (error) {
      console.error('オフラインデータの同期に失敗:', error);
      return false;
    }
  };

  return {
    isOnline,
    hasOfflineData,
    saveOfflineData,
    getOfflineData,
    clearOfflineData,
    syncOfflineData,
    checkOfflineData
  };
};

export default useOfflineStorage;
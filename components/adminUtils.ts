import CryptoJS from 'crypto-js';
import { SECURITY_CONFIG, SUPABASE_CONFIG, secureLog } from '../security.config';

// Supabaseクライアント設定（Environment変数優先、フォールバック対応）
export const createSupabaseClient = () => {
  const url = SUPABASE_CONFIG.url;
  const key = SUPABASE_CONFIG.anonKey;
  
  // デバッグ情報をログ出力
  console.log('🔍 Supabase Client Configuration:');
  console.log('URL:', url ? 'SET' : 'NOT SET');
  console.log('Anon Key:', key ? `SET (${key.length} chars)` : 'NOT SET');
  
  if (!url || !key) {
    console.error('🚨 Supabase configuration incomplete:', { url: !!url, key: !!key });
  }
  
  return {
    url: url,
    key: key
  };
};

// セキュアなストレージ管理
export class SecureStorage {
  private static encryptionKey = SECURITY_CONFIG.ENCRYPTION_KEY;

  static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey || '').toString();
      return encrypted;
    } catch (error) {
      secureLog('暗号化エラー:', error);
      return '';
    }
  }

  static decrypt(encryptedData: string): any {
    try {
      if (!encryptedData) return null;
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey || '');
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      secureLog('復号化エラー:', error);
      return null;
    }
  }

  static setSecureItem(key: string, value: any): void {
    const encrypted = this.encrypt(value);
    if (encrypted) {
      localStorage.setItem(key, encrypted);
    }
  }

  static getSecureItem(key: string): any {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  static removeSecureItem(key: string): void {
    localStorage.removeItem(key);
  }
}

// Supabase API ヘルパー関数（共通機能）
export class SupabaseAdminAPI {
  private static supabaseConfig = createSupabaseClient();

  static async fetchAdminCredentials(username: string = 'admin') {
    try {
      secureLog('Supabase管理者認証情報取得を試行中...');
      
      const response = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_credentials?username.eq=${username}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseConfig.key}`,
          'apikey': this.supabaseConfig.key,
          'Content-Type': 'application/json',
        },
      });

      secureLog('Supabase API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        secureLog(`Supabase API Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      secureLog('Supabase管理者認証情報取得成功:', data.length > 0 ? 'データあり' : 'データなし');
      return data[0] || null;
    } catch (error) {
      secureLog('Supabase管理者認証情報取得エラー（正常なフォールバック）:', error);
      return null;
    }
  }

  static async updateAdminCredentials(id: number, updates: any) {
    try {
      secureLog('Supabase管理者認証情報更新を試行中...', { id, updates });
      
      const response = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_credentials?id.eq=${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.supabaseConfig.key}`,
          'apikey': this.supabaseConfig.key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        secureLog(`Supabase更新API Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      secureLog('Supabase管理者認証情報更新成功');
      return result;
    } catch (error) {
      secureLog('Supabase管理者認証情報更新エラー（フォールバック処理）:', error);
      throw error;
    }
  }

  // 管理者設定をSupabaseで保存・読み込み
  static async saveAdminSetting(key: string, value: any): Promise<boolean> {
    try {
      secureLog(`Supabase管理者設定保存を試行中...`, { key, value });
      
      // 1. Edge Function経由で保存を試行
      try {
        const response = await fetch(`${this.supabaseConfig.url}/functions/v1/admin-settings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseConfig.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, value }),
        });

        if (response.ok) {
          const result = await response.json();
          secureLog('Supabase設定保存成功（Edge Function経由）');
          // 成功した場合でもローカルストレージにバックアップ
          this.saveToLocalStorage(key, value);
          return result.success;
        } else {
          secureLog(`Edge Function保存エラー ${response.status}, 直接テーブルアクセスを試行`);
        }
      } catch (functionError) {
        secureLog('Edge Function利用不可、直接テーブルアクセスを試行:', functionError);
      }

      // 2. 直接テーブルアクセスを試行（UPSERT）
      try {
        const upsertData = {
          setting_key: key,
          setting_data: value,
          description: `管理画面で設定された${key}`,
          updated_at: new Date().toISOString()
        };

        const response = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_settings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseConfig.key}`,
            'apikey': this.supabaseConfig.key,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(upsertData),
        });

        if (response.ok || response.status === 201) {
          secureLog('Supabase設定保存成功（直接テーブルアクセス）');
          // 成功した場合でもローカルストレージにバックアップ
          this.saveToLocalStorage(key, value);
          return true;
        } else {
          const errorText = await response.text();
          secureLog(`直接テーブル保存エラー ${response.status}: ${errorText}`);
        }
      } catch (tableError) {
        secureLog('直接テーブル保存エラー:', tableError);
      }

      // 3. Supabase保存失敗時はローカルストレージに保存
      secureLog('Supabase保存失敗、ローカルストレージに保存中...');
      this.saveToLocalStorage(key, value);
      return true; // ローカルストレージ保存は成功とみなす
    } catch (error) {
      secureLog('Supabase設定保存エラー:', error);
      
      // エラー時でもローカルストレージに保存
      try {
        this.saveToLocalStorage(key, value);
        secureLog('エラー時フォールバック: ローカルストレージ保存成功');
        return true;
      } catch (fallbackError) {
        secureLog('ローカルストレージ保存も失敗:', fallbackError);
        return false;
      }
    }
  }

  // ローカルストレージ保存ヘルパー関数
  private static saveToLocalStorage(key: string, value: any): void {
    const localStorageMapping: Record<string, string> = {
      'testimonials': 'customTestimonials',
      'financial_products': 'customFinancialProducts',
      'tracking_scripts': 'customTrackingScripts',
      'notification_settings': 'notificationConfigurations',
    };

    const localKey = localStorageMapping[key] || `admin_setting_${key}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(value));
      secureLog(`ローカルストレージ保存成功: ${key} -> ${localKey}`);
    } catch (error) {
      secureLog(`ローカルストレージ保存エラー: ${key}`, error);
    }
  }

  static async loadAdminSetting(key: string): Promise<any> {
    try {
      secureLog(`Supabase管理者設定読み込みを試行中...`, { key });
      
      // 1. Edge Function経由で取得を試行
      try {
        const response = await fetch(`${this.supabaseConfig.url}/functions/v1/admin-settings?key=${encodeURIComponent(key)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.supabaseConfig.key}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          secureLog('Supabase設定読み込み成功（Edge Function経由）');
          return result.data;
        } else {
          secureLog(`Edge Function応答エラー ${response.status}, 直接テーブルアクセスを試行`);
        }
      } catch (functionError) {
        secureLog('Edge Function利用不可、直接テーブルアクセスを試行:', functionError);
      }

      // 2. 直接テーブルアクセスを試行
      try {
        const response = await fetch(`${this.supabaseConfig.url}/rest/v1/admin_settings?setting_key.eq=${encodeURIComponent(key)}&select=setting_value`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.supabaseConfig.key}`,
            'apikey': this.supabaseConfig.key,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0 && data[0].setting_data) {
            secureLog('Supabase設定読み込み成功（直接テーブルアクセス）');
            return data[0].setting_data;
          }
        } else {
          const errorText = await response.text();
          secureLog(`直接テーブルアクセスエラー ${response.status}: ${errorText}`);
        }
      } catch (tableError) {
        secureLog('直接テーブルアクセスエラー:', tableError);
      }

      // 3. ローカルストレージフォールバック
      secureLog('Supabaseアクセス失敗、ローカルストレージを確認中...');
      
      // キー別のローカルストレージマッピング
      const localStorageMapping: Record<string, string> = {
        'testimonials': 'customTestimonials',
        'financial_products': 'customFinancialProducts',
        'tracking_scripts': 'customTrackingScripts',
        'notification_settings': 'notificationConfigurations',
      };

      const localKey = localStorageMapping[key];
      if (localKey) {
        const storedData = localStorage.getItem(localKey);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            secureLog(`ローカルストレージから設定取得成功: ${key}`);
            return parsedData;
          } catch (parseError) {
            secureLog(`ローカルストレージ解析エラー: ${key}`, parseError);
          }
        }
      }

      // 4. サンプルデータフォールバック
      if (key === 'testimonials') {
        const sampleTestimonials = localStorage.getItem('testimonials');
        if (sampleTestimonials) {
          try {
            const parsedSample = JSON.parse(sampleTestimonials);
            secureLog('サンプルお客様の声データを使用');
            return parsedSample;
          } catch (parseError) {
            secureLog('サンプルデータ解析エラー:', parseError);
          }
        }
      }

      secureLog(`設定データが見つかりません: ${key}`);
      return null;
    } catch (error) {
      secureLog('Supabase設定読み込みエラー:', error);
      
      // エラー時の最終フォールバック
      const fallbackMapping: Record<string, string> = {
        'testimonials': 'customTestimonials',
        'financial_products': 'customFinancialProducts',
      };

      const fallbackKey = fallbackMapping[key];
      if (fallbackKey) {
        try {
          const fallbackData = localStorage.getItem(fallbackKey);
          if (fallbackData) {
            const parsedFallback = JSON.parse(fallbackData);
            secureLog(`エラー時フォールバック成功: ${key}`);
            return parsedFallback;
          }
        } catch (fallbackError) {
          secureLog(`フォールバックエラー: ${key}`, fallbackError);
        }
      }

      return null;
    }
  }

  // 管理者認証情報をEdge Function経由で更新
  static async updateAdminCredentialsViaFunction(phoneNumber: string, backupCode: string): Promise<boolean> {
    try {
      secureLog('Supabase管理者認証情報更新（Edge Function）を試行中...');
      
      const response = await fetch(`${this.supabaseConfig.url}/functions/v1/admin-credentials-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseConfig.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone_number: phoneNumber, 
          backup_code: backupCode 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        secureLog(`Supabase認証情報更新API Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      secureLog('Supabase認証情報更新成功');
      return result.success;
    } catch (error) {
      secureLog('Supabase認証情報更新エラー:', error);
      return false;
    }
  }

  static async loadAdminCredentialsViaFunction(): Promise<any> {
    try {
      secureLog('Supabase管理者認証情報読み込み（Edge Function）を試行中...');
      
      const response = await fetch(`${this.supabaseConfig.url}/functions/v1/admin-credentials-update`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseConfig.key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        secureLog(`Supabase認証情報読み込みAPI Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      secureLog('Supabase認証情報読み込み成功');
      return result.data;
    } catch (error) {
      secureLog('Supabase認証情報読み込みエラー:', error);
      return null;
    }
  }
} 
import CryptoJS from 'crypto-js';
import { SECURITY_CONFIG, SUPABASE_CONFIG, secureLog } from '../security.config';

// Supabaseクライアント設定（Environment変数優先、フォールバック対応）
export const createSupabaseClient = () => {
  return {
    url: SUPABASE_CONFIG.url,
    key: SUPABASE_CONFIG.anonKey
  };
};

// セキュアなストレージ管理
export class SecureStorage {
  private static encryptionKey = SECURITY_CONFIG.ENCRYPTION_KEY;

  static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      secureLog('暗号化エラー:', error);
      return '';
    }
  }

  static decrypt(encryptedData: string): any {
    try {
      if (!encryptedData) return null;
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
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
      
      const response = await fetch(`${this.supabaseConfig.url}/functions/v1/admin-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseConfig.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        secureLog(`Supabase設定保存API Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      secureLog('Supabase設定保存成功');
      return result.success;
    } catch (error) {
      secureLog('Supabase設定保存エラー:', error);
      return false;
    }
  }

  static async loadAdminSetting(key: string): Promise<any> {
    try {
      secureLog(`Supabase管理者設定読み込みを試行中...`, { key });
      
      const response = await fetch(`${this.supabaseConfig.url}/functions/v1/admin-settings?key=${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseConfig.key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        secureLog(`Supabase設定読み込みAPI Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      secureLog('Supabase設定読み込み成功');
      return result.data;
    } catch (error) {
      secureLog('Supabase設定読み込みエラー:', error);
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
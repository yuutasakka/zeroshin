// エンタープライズ級暗号化・鍵管理・ハッシュ化システム
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

export interface CryptographicConfig {
  aes: {
    keySize: number;
    algorithm: string;
    ivSize: number;
    tagSize: number;
  };
  hash: {
    algorithm: string;
    saltSize: number;
    pepperSize: number;
    iterations: number;
    bcryptRounds: number;
  };
  keyManagement: {
    rotationInterval: number;
    maxKeyAge: number;
    backupCount: number;
    compressionEnabled: boolean;
  };
}

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  authTag: string;
  keyId: string;
  algorithm: string;
  timestamp: number;
}

export interface HashResult {
  hash: string;
  salt: string;
  pepper: string;
  algorithm: string;
  iterations: number;
  timestamp: number;
}

export interface KeyMetadata {
  keyId: string;
  algorithm: string;
  keySize: number;
  createdAt: number;
  lastUsed: number;
  usageCount: number;
  status: 'active' | 'deprecated' | 'revoked';
  purpose: 'encryption' | 'signing' | 'master';
}

export class EnhancedCryptographicManager {
  private static instance: EnhancedCryptographicManager;
  private keys: Map<string, Buffer> = new Map();
  private keyMetadata: Map<string, KeyMetadata> = new Map();
  private pepperCache: Map<string, string> = new Map();
  private masterKey: Buffer | null = null;
  
  private readonly config: CryptographicConfig = {
    aes: {
      keySize: 32, // AES-256
      algorithm: 'aes-256-gcm',
      ivSize: 16,
      tagSize: 16
    },
    hash: {
      algorithm: 'sha512',
      saltSize: 32,
      pepperSize: 64,
      iterations: 100000,
      bcryptRounds: 14 // 高セキュリティ設定
    },
    keyManagement: {
      rotationInterval: 24 * 60 * 60 * 1000, // 24時間
      maxKeyAge: 30 * 24 * 60 * 60 * 1000, // 30日
      backupCount: 3,
      compressionEnabled: true
    }
  };

  private constructor() {
    this.initializeMasterKey();
    this.startKeyRotationScheduler();
  }

  public static getInstance(): EnhancedCryptographicManager {
    if (!EnhancedCryptographicManager.instance) {
      EnhancedCryptographicManager.instance = new EnhancedCryptographicManager();
    }
    return EnhancedCryptographicManager.instance;
  }

  /**
   * マスターキーの初期化
   */
  private async initializeMasterKey(): Promise<void> {
    try {
      // 環境変数からマスターキーを取得
      const masterKeyHex = process.env.MASTER_ENCRYPTION_KEY;
      
      if (masterKeyHex) {
        this.masterKey = Buffer.from(masterKeyHex, 'hex');
      } else if (process.env.NODE_ENV === 'production') {
        throw new Error('Master key not configured in production environment');
      } else {
        // 開発環境でのみランダム生成
        this.masterKey = crypto.randomBytes(32);
        console.warn('Using randomly generated master key for development');
      }

      // マスターキーの検証
      if (!this.masterKey || this.masterKey.length !== 32) {
        throw new Error('Invalid master key configuration');
      }

    } catch (error) {
      console.error('Master key initialization failed:', error);
      throw error;
    }
  }

  /**
   * 強力なAES-256-GCM暗号化
   */
  async encryptData(data: string | Buffer, keyId?: string): Promise<EncryptionResult> {
    try {
      const inputBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      
      // 暗号化キーの取得または生成
      const actualKeyId = keyId || await this.generateEncryptionKey();
      const key = await this.getEncryptionKey(actualKeyId);
      
      // IV（初期化ベクトル）の生成
      const iv = crypto.randomBytes(this.config.aes.ivSize);
      
      // AES-256-GCM暗号化
      const cipher = crypto.createCipheriv(this.config.aes.algorithm, key, iv);
      
      let encryptedData = cipher.update(inputBuffer);
      encryptedData = Buffer.concat([encryptedData, cipher.final()]);
      
      // 認証タグの取得
      const authTag = cipher.getAuthTag();
      
      // 使用回数の更新
      await this.updateKeyUsage(actualKeyId);
      
      const result: EncryptionResult = {
        encryptedData: encryptedData.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        keyId: actualKeyId,
        algorithm: this.config.aes.algorithm,
        timestamp: Date.now()
      };

      console.log('Data encrypted successfully', {
        keyId: actualKeyId,
        dataSize: inputBuffer.length,
        algorithm: this.config.aes.algorithm
      });

      return result;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * AES-256-GCM復号化
   */
  async decryptData(encryptionResult: EncryptionResult): Promise<Buffer> {
    try {
      const key = await this.getEncryptionKey(encryptionResult.keyId);
      const iv = Buffer.from(encryptionResult.iv, 'base64');
      const authTag = Buffer.from(encryptionResult.authTag, 'base64');
      const encryptedData = Buffer.from(encryptionResult.encryptedData, 'base64');
      
      // AES-256-GCM復号化
      const decipher = crypto.createDecipheriv(encryptionResult.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      let decryptedData = decipher.update(encryptedData);
      decryptedData = Buffer.concat([decryptedData, decipher.final()]);
      
      // 使用回数の更新
      await this.updateKeyUsage(encryptionResult.keyId);
      
      console.log('Data decrypted successfully', {
        keyId: encryptionResult.keyId,
        dataSize: decryptedData.length
      });

      return decryptedData;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * ソルト・ペッパー対応の強化ハッシュ化
   */
  async hashPasswordAdvanced(password: string, userId?: string): Promise<HashResult> {
    try {
      // ユニークソルトの生成
      const salt = crypto.randomBytes(this.config.hash.saltSize).toString('base64');
      
      // グローバルペッパーの取得
      const pepper = await this.getGlobalPepper();
      
      // ユーザー固有ペッパーの生成
      const userPepper = userId ? await this.getUserSpecificPepper(userId) : '';
      
      // 複合パスワードの作成（パスワード + ソルト + グローバルペッパー + ユーザーペッパー）
      const combinedPassword = password + salt + pepper + userPepper;
      
      // PBKDF2による高強度ハッシュ化
      const pbkdf2Hash = crypto.pbkdf2Sync(
        combinedPassword,
        salt,
        this.config.hash.iterations,
        64,
        this.config.hash.algorithm
      );
      
      // bcryptによる二重ハッシュ化
      const finalHash = await bcrypt.hash(pbkdf2Hash.toString('base64'), this.config.hash.bcryptRounds);
      
      const result: HashResult = {
        hash: finalHash,
        salt: salt,
        pepper: pepper,
        algorithm: `pbkdf2-${this.config.hash.algorithm}+bcrypt`,
        iterations: this.config.hash.iterations,
        timestamp: Date.now()
      };

      console.log('Password hashed successfully', {
        algorithm: result.algorithm,
        iterations: result.iterations,
        saltLength: salt.length,
        pepperLength: pepper.length
      });

      return result;
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * パスワード検証
   */
  async verifyPasswordAdvanced(password: string, hashResult: HashResult, userId?: string): Promise<boolean> {
    try {
      // ユーザー固有ペッパーの取得
      const userPepper = userId ? await this.getUserSpecificPepper(userId) : '';
      
      // 複合パスワードの再作成
      const combinedPassword = password + hashResult.salt + hashResult.pepper + userPepper;
      
      // PBKDF2ハッシュの再計算
      const pbkdf2Hash = crypto.pbkdf2Sync(
        combinedPassword,
        hashResult.salt,
        hashResult.iterations,
        64,
        this.config.hash.algorithm.replace('pbkdf2-', '').replace('+bcrypt', '')
      );
      
      // bcryptでの検証
      const isValid = await bcrypt.compare(pbkdf2Hash.toString('base64'), hashResult.hash);
      
      console.log('Password verification completed', {
        isValid,
        algorithm: hashResult.algorithm,
        userId: userId ? 'provided' : 'not provided'
      });

      return isValid;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * 暗号化キーの生成
   */
  async generateEncryptionKey(purpose: 'encryption' | 'signing' | 'master' = 'encryption'): Promise<string> {
    try {
      const keyId = `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      const key = crypto.randomBytes(this.config.aes.keySize);
      
      // マスターキーで暗号化して保存
      const encryptedKey = await this.encryptKeyWithMaster(key);
      
      const metadata: KeyMetadata = {
        keyId,
        algorithm: this.config.aes.algorithm,
        keySize: this.config.aes.keySize,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        usageCount: 0,
        status: 'active',
        purpose
      };
      
      // キーとメタデータの保存
      this.keys.set(keyId, encryptedKey);
      this.keyMetadata.set(keyId, metadata);
      
      // データベースに永続化
      await this.persistKeyMetadata(metadata);
      
      console.log('Encryption key generated successfully', {
        keyId,
        purpose,
        algorithm: metadata.algorithm
      });

      return keyId;
    } catch (error) {
      console.error('Key generation failed:', error);
      throw new Error('Key generation failed');
    }
  }

  /**
   * 暗号化キーの取得
   */
  private async getEncryptionKey(keyId: string): Promise<Buffer> {
    try {
      const encryptedKey = this.keys.get(keyId);
      if (!encryptedKey) {
        // データベースから取得を試行
        await this.loadKeyFromDatabase(keyId);
        const reloadedKey = this.keys.get(keyId);
        if (!reloadedKey) {
          throw new Error(`Key not found: ${keyId}`);
        }
        return this.decryptKeyWithMaster(reloadedKey);
      }
      
      return this.decryptKeyWithMaster(encryptedKey);
    } catch (error) {
      console.error(`Failed to get encryption key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * マスターキーによるキー暗号化
   */
  private async encryptKeyWithMaster(key: Buffer): Promise<Buffer> {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }
    
    const iv = crypto.randomBytes(this.config.aes.ivSize);
    const cipher = crypto.createCipheriv(this.config.aes.algorithm, this.masterKey, iv);
    
    let encryptedKey = cipher.update(key);
    encryptedKey = Buffer.concat([encryptedKey, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    // IV + AuthTag + 暗号化キー
    return Buffer.concat([iv, authTag, encryptedKey]);
  }

  /**
   * マスターキーによるキー復号化
   */
  private async decryptKeyWithMaster(encryptedKey: Buffer): Promise<Buffer> {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }
    
    const iv = encryptedKey.slice(0, this.config.aes.ivSize);
    const authTag = encryptedKey.slice(this.config.aes.ivSize, this.config.aes.ivSize + this.config.aes.tagSize);
    const encrypted = encryptedKey.slice(this.config.aes.ivSize + this.config.aes.tagSize);
    
    const decipher = crypto.createDecipheriv(this.config.aes.algorithm, this.masterKey, iv);
    decipher.setAuthTag(authTag);
    
    let key = decipher.update(encrypted);
    key = Buffer.concat([key, decipher.final()]);
    
    return key;
  }

  /**
   * グローバルペッパーの取得
   */
  private async getGlobalPepper(): Promise<string> {
    const cacheKey = 'global_pepper';
    
    if (this.pepperCache.has(cacheKey)) {
      return this.pepperCache.get(cacheKey)!;
    }
    
    // 環境変数から取得
    let pepper = process.env.GLOBAL_PEPPER;
    
    if (!pepper) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Global pepper not configured in production');
      } else {
        // 開発環境では固定値
        pepper = 'dev_global_pepper_' + crypto.randomBytes(32).toString('base64');
      }
    }
    
    this.pepperCache.set(cacheKey, pepper);
    return pepper;
  }

  /**
   * ユーザー固有ペッパーの生成
   */
  private async getUserSpecificPepper(userId: string): Promise<string> {
    const cacheKey = `user_pepper_${userId}`;
    
    if (this.pepperCache.has(cacheKey)) {
      return this.pepperCache.get(cacheKey)!;
    }
    
    // ユーザーIDベースの決定的ペッパー生成
    const globalPepper = await this.getGlobalPepper();
    const userPepper = crypto.createHmac('sha256', globalPepper)
      .update(`user_${userId}_pepper`)
      .digest('base64');
    
    this.pepperCache.set(cacheKey, userPepper);
    return userPepper;
  }

  /**
   * キー使用状況の更新
   */
  private async updateKeyUsage(keyId: string): Promise<void> {
    const metadata = this.keyMetadata.get(keyId);
    if (metadata) {
      metadata.lastUsed = Date.now();
      metadata.usageCount++;
      
      // データベースも更新
      await this.persistKeyMetadata(metadata);
    }
  }

  /**
   * 鍵ローテーション（自動）
   */
  async rotateKeys(): Promise<void> {
    try {
      const now = Date.now();
      const keysToRotate: string[] = [];
      
      // 古いキーの特定
      for (const [keyId, metadata] of this.keyMetadata.entries()) {
        const keyAge = now - metadata.createdAt;
        
        if (keyAge > this.config.keyManagement.maxKeyAge && metadata.status === 'active') {
          keysToRotate.push(keyId);
        }
      }
      
      // キーのローテーション実行
      for (const keyId of keysToRotate) {
        await this.rotateKey(keyId);
      }
      
      console.log(`Key rotation completed. Rotated ${keysToRotate.length} keys.`);
    } catch (error) {
      console.error('Key rotation failed:', error);
    }
  }

  /**
   * 個別キーのローテーション
   */
  private async rotateKey(oldKeyId: string): Promise<string> {
    try {
      // 新しいキーの生成
      const oldMetadata = this.keyMetadata.get(oldKeyId);
      const newKeyId = await this.generateEncryptionKey(oldMetadata?.purpose || 'encryption');
      
      // 古いキーを非推奨に
      if (oldMetadata) {
        oldMetadata.status = 'deprecated';
        await this.persistKeyMetadata(oldMetadata);
      }
      
      console.log(`Key rotated: ${oldKeyId} -> ${newKeyId}`);
      return newKeyId;
    } catch (error) {
      console.error(`Failed to rotate key ${oldKeyId}:`, error);
      throw error;
    }
  }

  /**
   * キーローテーションスケジューラー
   */
  private startKeyRotationScheduler(): void {
    setInterval(async () => {
      try {
        await this.rotateKeys();
      } catch (error) {
        console.error('Scheduled key rotation failed:', error);
      }
    }, this.config.keyManagement.rotationInterval);
  }

  /**
   * キーメタデータの永続化
   */
  private async persistKeyMetadata(metadata: KeyMetadata): Promise<void> {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase not configured for key metadata persistence');
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('encryption_key_metadata')
        .upsert({
          key_id: metadata.keyId,
          algorithm: metadata.algorithm,
          key_size: metadata.keySize,
          created_at: new Date(metadata.createdAt).toISOString(),
          last_used: new Date(metadata.lastUsed).toISOString(),
          usage_count: metadata.usageCount,
          status: metadata.status,
          purpose: metadata.purpose
        }, {
          onConflict: 'key_id'
        });
        
    } catch (error) {
      console.error('Failed to persist key metadata:', error);
    }
  }

  /**
   * データベースからキーの読み込み
   */
  private async loadKeyFromDatabase(keyId: string): Promise<void> {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase not configured');
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('encryption_key_metadata')
        .select('*')
        .eq('key_id', keyId)
        .single();
      
      if (error || !data) {
        throw new Error(`Key metadata not found: ${keyId}`);
      }
      
      // メタデータの復元
      const metadata: KeyMetadata = {
        keyId: data.key_id,
        algorithm: data.algorithm,
        keySize: data.key_size,
        createdAt: new Date(data.created_at).getTime(),
        lastUsed: new Date(data.last_used).getTime(),
        usageCount: data.usage_count,
        status: data.status,
        purpose: data.purpose
      };
      
      this.keyMetadata.set(keyId, metadata);
      
    } catch (error) {
      console.error(`Failed to load key ${keyId} from database:`, error);
      throw error;
    }
  }

  /**
   * 暗号化統計の取得
   */
  getEncryptionStatistics(): {
    totalKeys: number;
    activeKeys: number;
    deprecatedKeys: number;
    totalEncryptions: number;
    averageKeyAge: number;
  } {
    let totalUsage = 0;
    let activeKeys = 0;
    let deprecatedKeys = 0;
    let totalAge = 0;
    const now = Date.now();
    
    for (const metadata of this.keyMetadata.values()) {
      totalUsage += metadata.usageCount;
      totalAge += (now - metadata.createdAt);
      
      if (metadata.status === 'active') {
        activeKeys++;
      } else if (metadata.status === 'deprecated') {
        deprecatedKeys++;
      }
    }
    
    return {
      totalKeys: this.keyMetadata.size,
      activeKeys,
      deprecatedKeys,
      totalEncryptions: totalUsage,
      averageKeyAge: this.keyMetadata.size > 0 ? totalAge / this.keyMetadata.size : 0
    };
  }
}

// シングルトンインスタンス
export const cryptographicManager = EnhancedCryptographicManager.getInstance();
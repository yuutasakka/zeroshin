// Twilio Lookup API統合による高度な電話番号検証サービス
import { createClient } from '@supabase/supabase-js';

export interface PhoneNumberValidationResult {
  isValid: boolean;
  normalizedE164: string;
  carrier?: string;
  lineType?: 'mobile' | 'landline' | 'voip' | 'unknown';
  countryCode?: string;
  nationalFormat?: string;
  isJapanese: boolean;
  canReceiveSMS: boolean;
  riskScore: number;
  errors: string[];
  warnings: string[];
}

export interface TwilioLookupResponse {
  calling_country_code: string;
  country_code: string;
  phone_number: string;
  national_format: string;
  valid: boolean;
  validation_errors?: string[];
  caller_name?: {
    caller_name?: string;
    caller_type?: string;
    error_code?: string;
  };
  carrier?: {
    mobile_country_code?: string;
    mobile_network_code?: string;
    name?: string;
    type?: 'mobile' | 'landline' | 'voip';
    error_code?: string;
  };
  add_ons?: any;
  url: string;
}

export class PhoneNumberValidationService {
  private static instance: PhoneNumberValidationService;
  private cache: Map<string, { result: PhoneNumberValidationResult; expiry: number }> = new Map();
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24時間
  private static readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1分
  private static readonly MAX_REQUESTS_PER_MINUTE = 50;
  private requestTimes: number[] = [];

  private constructor() {}

  public static getInstance(): PhoneNumberValidationService {
    if (!PhoneNumberValidationService.instance) {
      PhoneNumberValidationService.instance = new PhoneNumberValidationService();
    }
    return PhoneNumberValidationService.instance;
  }

  /**
   * Twilio Lookup APIを使用した包括的な電話番号検証
   */
  async validatePhoneNumber(phoneNumber: string): Promise<PhoneNumberValidationResult> {
    try {
      // 基本的な正規化
      const normalizedInput = this.basicNormalization(phoneNumber);
      
      // キャッシュチェック
      const cached = this.getFromCache(normalizedInput);
      if (cached) {
        return cached;
      }

      // レート制限チェック
      if (!this.checkRateLimit()) {
        return this.createFallbackResult(normalizedInput, ['API rate limit exceeded']);
      }

      // Twilio Lookup API呼び出し
      const lookupResult = await this.performTwilioLookup(normalizedInput);
      
      // 結果の解析と検証
      const validationResult = this.processLookupResult(lookupResult, normalizedInput);
      
      // データベースに保存
      await this.saveToDatabase(validationResult);
      
      // キャッシュに保存
      this.saveToCache(normalizedInput, validationResult);
      
      return validationResult;
      
    } catch (error) {
      console.error('Phone validation error:', error);
      return this.createFallbackResult(phoneNumber, [`Validation service error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  }

  /**
   * SMS送信可能性の高速チェック
   */
  async canSendSMS(phoneNumber: string): Promise<{ canSend: boolean; reason?: string }> {
    const result = await this.validatePhoneNumber(phoneNumber);
    
    if (!result.isValid) {
      return { canSend: false, reason: 'Invalid phone number' };
    }
    
    if (!result.isJapanese) {
      return { canSend: false, reason: 'Non-Japanese number' };
    }
    
    if (result.lineType === 'landline') {
      return { canSend: false, reason: 'Landline number cannot receive SMS' };
    }
    
    if (result.lineType === 'voip') {
      return { canSend: false, reason: 'VoIP number may not reliably receive SMS' };
    }
    
    if (result.riskScore > 70) {
      return { canSend: false, reason: 'High risk number' };
    }
    
    return { canSend: true };
  }

  /**
   * Twilio Lookup API呼び出し
   */
  private async performTwilioLookup(phoneNumber: string): Promise<TwilioLookupResponse> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    // E.164形式に正規化
    const e164Number = this.toE164Format(phoneNumber);
    
    // Twilio Lookup API URL (v2を使用してcarrier情報も取得)
    const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(e164Number)}?Fields=carrier`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Phone number not found or invalid');
      } else if (response.status === 429) {
        throw new Error('API rate limit exceeded');
      } else {
        throw new Error(`Twilio Lookup API error: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  }

  /**
   * Lookup結果の処理と検証
   */
  private processLookupResult(lookupResult: TwilioLookupResponse, originalInput: string): PhoneNumberValidationResult {
    const result: PhoneNumberValidationResult = {
      isValid: lookupResult.valid,
      normalizedE164: lookupResult.phone_number,
      carrier: lookupResult.carrier?.name,
      lineType: this.mapLineType(lookupResult.carrier?.type),
      countryCode: lookupResult.country_code,
      nationalFormat: lookupResult.national_format,
      isJapanese: lookupResult.country_code === 'JP',
      canReceiveSMS: false,
      riskScore: 0,
      errors: lookupResult.validation_errors || [],
      warnings: []
    };

    // SMS送信可能性の判定
    result.canReceiveSMS = this.determineSMSCapability(result);
    
    // リスクスコアの計算
    result.riskScore = this.calculateRiskScore(result, lookupResult);
    
    // 警告の追加
    this.addWarnings(result, lookupResult);
    
    return result;
  }

  /**
   * SMS送信可能性の判定
   */
  private determineSMSCapability(result: PhoneNumberValidationResult): boolean {
    // 無効な番号
    if (!result.isValid) return false;
    
    // 日本以外の番号
    if (!result.isJapanese) return false;
    
    // 固定電話
    if (result.lineType === 'landline') return false;
    
    // 高リスク番号
    if (result.riskScore > 70) return false;
    
    // VoIP番号は警告付きで許可（リスクスコアに反映）
    return true;
  }

  /**
   * リスクスコアの計算
   */
  private calculateRiskScore(result: PhoneNumberValidationResult, lookupResult: TwilioLookupResponse): number {
    let score = 0;
    
    // 基本的な有効性
    if (!result.isValid) score += 100;
    
    // 国コード
    if (!result.isJapanese) score += 50;
    
    // 回線タイプ
    switch (result.lineType) {
      case 'landline':
        score += 80;
        break;
      case 'voip':
        score += 40;
        break;
      case 'unknown':
        score += 20;
        break;
    }
    
    // キャリア情報の欠如
    if (!result.carrier) score += 10;
    
    // Twilio API エラー
    if (lookupResult.carrier?.error_code) score += 30;
    
    return Math.min(score, 100);
  }

  /**
   * 警告の追加
   */
  private addWarnings(result: PhoneNumberValidationResult, lookupResult: TwilioLookupResponse): void {
    if (result.lineType === 'voip') {
      result.warnings.push('VoIP number may have delivery issues');
    }
    
    if (result.lineType === 'unknown') {
      result.warnings.push('Unknown line type - delivery not guaranteed');
    }
    
    if (!result.carrier) {
      result.warnings.push('Carrier information unavailable');
    }
    
    if (lookupResult.carrier?.error_code) {
      result.warnings.push(`Carrier lookup error: ${lookupResult.carrier.error_code}`);
    }
  }

  /**
   * 回線タイプのマッピング
   */
  private mapLineType(twilioType?: string): 'mobile' | 'landline' | 'voip' | 'unknown' {
    switch (twilioType?.toLowerCase()) {
      case 'mobile':
        return 'mobile';
      case 'landline':
      case 'fixed':
        return 'landline';
      case 'voip':
        return 'voip';
      default:
        return 'unknown';
    }
  }

  /**
   * 基本的な正規化
   */
  private basicNormalization(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // 全角数字を半角に変換
    let normalized = phoneNumber.replace(/[０-９]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
    });
    
    // 空白、ハイフン、括弧を削除
    normalized = normalized.replace(/[\s\-\(\)]/g, '');
    
    return normalized;
  }

  /**
   * E.164形式への変換
   */
  private toE164Format(phoneNumber: string): string {
    const normalized = this.basicNormalization(phoneNumber);
    
    // 既にE.164形式の場合
    if (normalized.startsWith('+')) {
      return normalized;
    }
    
    // 0から始まる日本の番号
    if (normalized.startsWith('0')) {
      return '+81' + normalized.substring(1);
    }
    
    // 81から始まる場合
    if (normalized.startsWith('81')) {
      return '+' + normalized;
    }
    
    // デフォルトで日本の国コードを追加
    return '+81' + normalized;
  }

  /**
   * レート制限チェック
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - PhoneNumberValidationService.RATE_LIMIT_WINDOW;
    
    // 古いリクエストを削除
    this.requestTimes = this.requestTimes.filter(time => time > windowStart);
    
    // 制限チェック
    if (this.requestTimes.length >= PhoneNumberValidationService.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    
    // 現在のリクエストを記録
    this.requestTimes.push(now);
    return true;
  }

  /**
   * キャッシュからの取得
   */
  private getFromCache(phoneNumber: string): PhoneNumberValidationResult | null {
    const cached = this.cache.get(phoneNumber);
    if (cached && Date.now() < cached.expiry) {
      return cached.result;
    }
    
    if (cached) {
      this.cache.delete(phoneNumber);
    }
    
    return null;
  }

  /**
   * キャッシュへの保存
   */
  private saveToCache(phoneNumber: string, result: PhoneNumberValidationResult): void {
    this.cache.set(phoneNumber, {
      result,
      expiry: Date.now() + PhoneNumberValidationService.CACHE_TTL
    });
    
    // キャッシュサイズ制限（1000エントリ）
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * データベースへの保存
   */
  private async saveToDatabase(result: PhoneNumberValidationResult): Promise<void> {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase not configured for phone number intelligence storage');
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('phone_number_intelligence')
        .upsert({
          phone_number: result.normalizedE164,
          carrier: result.carrier,
          line_type: result.lineType,
          country_code: result.countryCode,
          risk_score: result.riskScore,
          last_verification: new Date().toISOString()
        }, {
          onConflict: 'phone_number'
        });
        
    } catch (error) {
      console.error('Failed to save phone intelligence to database:', error);
      // データベース保存失敗は処理を停止しない
    }
  }

  /**
   * フォールバック結果の作成
   */
  private createFallbackResult(phoneNumber: string, errors: string[]): PhoneNumberValidationResult {
    const normalized = this.basicNormalization(phoneNumber);
    const e164 = this.toE164Format(normalized);
    
    // 基本的な日本の携帯電話パターンチェック
    const isJapanesePattern = /^\+81[789]0\d{8}$/.test(e164);
    
    return {
      isValid: isJapanesePattern,
      normalizedE164: e164,
      isJapanese: e164.startsWith('+81'),
      canReceiveSMS: isJapanesePattern,
      riskScore: isJapanesePattern ? 30 : 100, // フォールバック時は中程度のリスク
      errors,
      warnings: ['Using fallback validation - carrier information unavailable']
    };
  }

  /**
   * キャッシュクリア（テスト用）
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 統計情報の取得
   */
  public getStats(): {
    cacheSize: number;
    requestsInLastMinute: number;
  } {
    const now = Date.now();
    const recentRequests = this.requestTimes.filter(
      time => time > now - PhoneNumberValidationService.RATE_LIMIT_WINDOW
    );
    
    return {
      cacheSize: this.cache.size,
      requestsInLastMinute: recentRequests.length
    };
  }
}

// シングルトンインスタンスのエクスポート
export const phoneNumberValidator = PhoneNumberValidationService.getInstance();
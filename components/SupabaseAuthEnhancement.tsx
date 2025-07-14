import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { AuthError, AuthResponse, User } from '@supabase/supabase-js';

// 認証設定強化のインターface
interface AuthConfig {
  sessionTimeout: number; // セッション有効期限（分）
  maxLoginAttempts: number; // 最大ログイン試行回数
  lockoutDuration: number; // ロックアウト期間（分）
  passwordMinLength: number; // パスワード最小長
  requireEmailConfirmation: boolean; // メール確認必須
  enableMFA: boolean; // 多要素認証有効
}

// デフォルト認証設定
const defaultAuthConfig: AuthConfig = {
  sessionTimeout: 480, // 8時間
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  passwordMinLength: 8,
  requireEmailConfirmation: true,
  enableMFA: true
};

// 強化された認証管理クラス
export class EnhancedSupabaseAuth {
  private static config: AuthConfig = defaultAuthConfig;

  // 認証設定の更新
  static updateConfig(newConfig: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // セキュアなサインアップ（参考記事準拠）
  static async secureSignUp(
    email: string, 
    password: string, 
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    requiresConfirmation?: boolean;
  }> {
    try {

      // パスワード強度チェック
      const passwordValidation = this.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: `パスワードが要件を満たしていません: ${passwordValidation.errors.join(', ')}`
        };
      }

      // Supabaseサインアップ実行
      const { data, error }: AuthResponse = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            signup_source: 'aiconectx_admin',
            registration_timestamp: new Date().toISOString(),
            password_strength_score: passwordValidation.score
          },
          emailRedirectTo: `${window.location.origin}/admin/email-confirmed`
        }
      });

      if (error) {
        console.error('❌ サインアップエラー:', error);
        return {
          success: false,
          error: this.translateAuthError(error)
        };
      }

      // メール確認が必要かチェック
      const requiresConfirmation = !data.user?.email_confirmed_at;

      if (requiresConfirmation) {
        return {
          success: true,
          user: data.user || undefined || undefined,
          requiresConfirmation: true
        };
      }

      return {
        success: true,
        user: data.user || undefined
      };

    } catch (error) {
      console.error('💥 サインアップエラー:', error);
      return {
        success: false,
        error: 'サインアップ中に予期しないエラーが発生しました。'
      };
    }
  }

  // セキュアなログイン（失敗回数制限付き）
  static async secureSignIn(
    email: string, 
    password: string
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    isLocked?: boolean;
    remainingAttempts?: number;
  }> {
    try {

      // ログイン試行履歴をチェック
      const attemptCheck = await this.checkLoginAttempts(email);
      if (attemptCheck.isLocked) {
        return {
          success: false,
          error: `アカウントが一時的にロックされています。${attemptCheck.lockoutMinutes}分後に再試行してください。`,
          isLocked: true
        };
      }

      // Supabaseログイン実行
      const { data, error }: AuthResponse = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ ログインエラー:', error);
        
        // 失敗回数を記録
        await this.recordFailedLoginAttempt(email, error.message);
        
        const updatedAttemptCheck = await this.checkLoginAttempts(email);
        
        return {
          success: false,
          error: this.translateAuthError(error),
          remainingAttempts: Math.max(0, this.config.maxLoginAttempts - updatedAttemptCheck.attempts)
        };
      }

      // ログイン成功時の処理
      await this.recordSuccessfulLogin(email);
      await this.updateUserLastActivity(data.user!.id);

      return {
        success: true,
        user: data.user || undefined
      };

    } catch (error) {
      console.error('💥 ログインエラー:', error);
      return {
        success: false,
        error: 'ログイン中に予期しないエラーが発生しました。'
      };
    }
  }

  // パスワードリセット（参考記事準拠）
  static async initiatePasswordReset(email: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`
      });

      if (error) {
        console.error('❌ パスワードリセットエラー:', error);
        return {
          success: false,
          error: this.translateAuthError(error)
        };
      }

      return { success: true };

    } catch (error) {
      console.error('💥 パスワードリセットエラー:', error);
      return {
        success: false,
        error: 'パスワードリセット中にエラーが発生しました。'
      };
    }
  }

  // パスワード更新
  static async updatePassword(newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {

      // パスワード強度チェック
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: `新しいパスワードが要件を満たしていません: ${passwordValidation.errors.join(', ')}`
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ パスワード更新エラー:', error);
        return {
          success: false,
          error: this.translateAuthError(error)
        };
      }

      // パスワード変更ログを記録
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.recordPasswordChange(user.id);
      }

      return { success: true };

    } catch (error) {
      console.error('💥 パスワード更新エラー:', error);
      return {
        success: false,
        error: 'パスワード更新中にエラーが発生しました。'
      };
    }
  }

  // パスワード強度検証
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let score = 0;

    // 最小長チェック
    if (password.length < this.config.passwordMinLength) {
      errors.push(`${this.config.passwordMinLength}文字以上で入力してください`);
    } else {
      score += 1;
    }

    // 大文字チェック
    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を含めてください');
    } else {
      score += 1;
    }

    // 小文字チェック
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を含めてください');
    } else {
      score += 1;
    }

    // 数字チェック
    if (!/\d/.test(password)) {
      errors.push('数字を含めてください');
    } else {
      score += 1;
    }

    // 特殊文字チェック
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('特殊文字(@$!%*?&)を含めてください');
    } else {
      score += 1;
    }

    return {
      isValid: errors.length === 0,
      score,
      errors
    };
  }

  // ログイン試行回数チェック
  private static async checkLoginAttempts(email: string): Promise<{
    attempts: number;
    isLocked: boolean;
    lockoutMinutes?: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('auth_login_attempts')
        .select('*')
        .eq('email', email)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 過去1時間
        .eq('success', false);

      if (error) {
        console.error('ログイン試行履歴取得エラー:', error);
        return { attempts: 0, isLocked: false };
      }

      const attempts = data?.length || 0;
      const isLocked = attempts >= this.config.maxLoginAttempts;

      return {
        attempts,
        isLocked,
        lockoutMinutes: isLocked ? this.config.lockoutDuration : undefined
      };
    } catch (error) {
      console.error('ログイン試行チェックエラー:', error);
      return { attempts: 0, isLocked: false };
    }
  }

  // 失敗ログイン試行の記録
  private static async recordFailedLoginAttempt(email: string, reason: string): Promise<void> {
    try {
      await supabase
        .from('auth_login_attempts')
        .insert({
          email,
          success: false,
          failure_reason: reason,
          ip_address: await this.getUserIP(),
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('ログイン失敗記録エラー:', error);
    }
  }

  // 成功ログインの記録
  private static async recordSuccessfulLogin(email: string): Promise<void> {
    try {
      // 成功ログインを記録
      await supabase
        .from('auth_login_attempts')
        .insert({
          email,
          success: true,
          ip_address: await this.getUserIP(),
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
        });

      // 失敗試行履歴をクリア
      await supabase
        .from('auth_login_attempts')
        .delete()
        .eq('email', email)
        .eq('success', false);
    } catch (error) {
      console.error('ログイン成功記録エラー:', error);
    }
  }

  // ユーザーの最終活動時間更新
  private static async updateUserLastActivity(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_activities')
        .upsert({
          user_id: userId,
          last_activity: new Date().toISOString(),
          ip_address: await this.getUserIP(),
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('最終活動時間更新エラー:', error);
    }
  }

  // パスワード変更の記録
  private static async recordPasswordChange(userId: string): Promise<void> {
    try {
      await supabase
        .from('password_change_history')
        .insert({
          user_id: userId,
          changed_at: new Date().toISOString(),
          ip_address: await this.getUserIP(),
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('パスワード変更記録エラー:', error);
    }
  }

  // ユーザーのIPアドレス取得（簡易版）
  private static async getUserIP(): Promise<string> {
    try {
      // 本番環境では適切なIP取得サービスを使用
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // エラーメッセージの翻訳
  private static translateAuthError(error: AuthError): string {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません。',
      'Email not confirmed': 'メールアドレスの確認が完了していません。受信トレイを確認してください。',
      'User already registered': 'このメールアドレスは既に登録されています。',
      'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください。',
      'Signup requires a valid password': '有効なパスワードを入力してください。',
      'Unable to validate email address: invalid format': 'メールアドレスの形式が正しくありません。',
      'Database error saving new user': 'ユーザー保存中にデータベースエラーが発生しました。',
      'Email rate limit exceeded': 'メール送信の制限に達しました。しばらく待ってから再試行してください。'
    };

    return errorMessages[error.message] || `認証エラー: ${error.message}`;
  }

  // セッション監視の開始
  static startSessionMonitoring(): void {
    
    // セッション期限の監視
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const now = Date.now() / 1000;
        const expiresAt = session.expires_at || 0;
        
        // セッション期限まで5分を切った場合は警告
        if (expiresAt - now < 300) {
          console.warn('⚠️ セッション期限が近づいています');
          // 必要に応じてユーザーに通知
        }
      }
    };

    // 5分ごとにセッションをチェック
    setInterval(checkSession, 5 * 60 * 1000);
  }
}

// コンポーネント本体（設定管理用）
interface SupabaseAuthEnhancementProps {
  onConfigUpdate?: (config: AuthConfig) => void;
}

const SupabaseAuthEnhancement: React.FC<SupabaseAuthEnhancementProps> = ({ 
  onConfigUpdate 
}) => {
  const [config, setConfig] = useState<AuthConfig>(defaultAuthConfig);
  const [isVisible, setIsVisible] = useState(false);

  // 認証設定の更新
  const handleConfigUpdate = (key: keyof AuthConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    EnhancedSupabaseAuth.updateConfig(newConfig);
    onConfigUpdate?.(newConfig);
  };

  // セッション監視の開始
  useEffect(() => {
    EnhancedSupabaseAuth.startSessionMonitoring();
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="認証設定"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">認証設定</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              セッション有効期限（分）
            </label>
            <input
              type="number"
              value={config.sessionTimeout}
              onChange={(e) => handleConfigUpdate('sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              min="60"
              max="1440"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最大ログイン試行回数
            </label>
            <input
              type="number"
              value={config.maxLoginAttempts}
              onChange={(e) => handleConfigUpdate('maxLoginAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              min="3"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ロックアウト期間（分）
            </label>
            <input
              type="number"
              value={config.lockoutDuration}
              onChange={(e) => handleConfigUpdate('lockoutDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              min="15"
              max="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード最小長
            </label>
            <input
              type="number"
              value={config.passwordMinLength}
              onChange={(e) => handleConfigUpdate('passwordMinLength', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              min="6"
              max="20"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireEmailConfirmation"
              checked={config.requireEmailConfirmation}
              onChange={(e) => handleConfigUpdate('requireEmailConfirmation', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="requireEmailConfirmation" className="text-sm text-gray-700">
              メール確認を必須にする
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableMFA"
              checked={config.enableMFA}
              onChange={(e) => handleConfigUpdate('enableMFA', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="enableMFA" className="text-sm text-gray-700">
              多要素認証を有効にする
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsVisible(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupabaseAuthEnhancement; 
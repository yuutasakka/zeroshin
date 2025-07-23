// デモ環境設定
export const demoConfig = {
  // デモモードの有効/無効を環境変数で制御
  isDemoMode: import.meta.env.VITE_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development',
  
  // デモ用管理者アカウント（本番環境では使用しないこと）
  demoAdmin: {
    username: 'admin',
    password: 'Admin123!',
    // bcryptハッシュ（Admin123!）
    passwordHash: '$2a$10$X5WZQwZRYXjKqJ0LQ8vJFuMWC2mchUZGgCi2RTiozKVfByx6kPvZG'
  },
  
  // デモモードの警告メッセージ
  getDemoWarning(): string {
    return this.isDemoMode 
      ? ' デモモードが有効です。本番環境では必ず無効化してください。' 
      : '';
  },
  
  // デモ認証が許可されているかチェック
  isDemoAuthAllowed(): boolean {
    // 本番環境では絶対に許可しない
    if (import.meta.env.VITE_ENV === 'production' && !import.meta.env.VITE_DEMO_MODE) {
      return false;
    }
    return this.isDemoMode;
  }
};
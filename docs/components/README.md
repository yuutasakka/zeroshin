# MoneyTicket コンポーネントカタログ

このドキュメントは、MoneyTicketアプリケーションで使用されているReactコンポーネントの包括的なカタログです。

## 📋 目次

1. [コアコンポーネント](#コアコンポーネント)
2. [認証コンポーネント](#認証コンポーネント)
3. [診断コンポーネント](#診断コンポーネント)
4. [管理画面コンポーネント](#管理画面コンポーネント)
5. [UIコンポーネント](#uiコンポーネント)
6. [ユーティリティコンポーネント](#ユーティリティコンポーネント)

---

## コアコンポーネント

### App
**場所**: `/App.tsx`

メインアプリケーションコンポーネント。全体のルーティングと状態管理を担当。

**Props**: なし

**主な機能**:
- ページナビゲーション管理
- グローバル状態管理
- 認証状態の管理
- テーマプロバイダーのラップ

**使用例**:
```tsx
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

---

### Header
**場所**: `/src/components/Header.tsx`

アプリケーションのヘッダーコンポーネント。

**Props**:
```typescript
interface HeaderProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
  userName?: string;
}
```

**アクセシビリティ**:
- ナビゲーションランドマーク（`role="navigation"`）
- キーボードナビゲーション対応
- スクリーンリーダー用のARIAラベル

---

### Footer
**場所**: `/src/components/Footer.tsx`

フッターコンポーネント。リンクと著作権情報を表示。

**Props**:
```typescript
interface FooterProps {
  onNavigateToAdminLogin: () => void;
}
```

**特徴**:
- レスポンシブデザイン
- セマンティックHTML構造
- アクセシブルなリンク

---

## 認証コンポーネント

### PhoneVerificationPage
**場所**: `/src/components/PhoneVerificationPage.tsx`

SMS認証を処理するコンポーネント。

**Props**:
```typescript
interface PhoneVerificationPageProps {
  initialData: {
    phoneNumber: string;
    diagnosisAnswers: any;
  };
  onVerificationSuccess: (phoneNumber: string) => void;
  onBack: () => void;
}
```

**主な機能**:
- SMS送信とコード検証
- 再送信タイマー
- 電話番号変更機能
- 失敗回数制限（5回）

**セキュリティ**:
- レート制限
- 入力検証
- セッション管理

---

### SupabaseAuthLogin
**場所**: `/src/components/SupabaseAuthLogin.tsx`

Supabase認証を使用したログインコンポーネント。

**Props**:
```typescript
interface SupabaseAuthLoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegistration?: () => void;
  userType: 'customer' | 'admin';
}
```

**認証方法**:
- メール/パスワード
- ソーシャルログイン（Google、GitHub）
- パスワードリセット機能

---

## 診断コンポーネント

### OptimizedDiagnosisFlow
**場所**: `/src/components/OptimizedDiagnosisFlow.tsx`

最適化された診断フローコンポーネント。

**Props**:
```typescript
interface OptimizedDiagnosisFlowProps {
  onComplete: (answers: OptimizedDiagnosisAnswers) => void;
  onCancel: () => void;
}
```

**特徴**:
- 2ステップの簡潔な質問
- プログレスバー表示
- アニメーション効果
- モバイル最適化

**アクセシビリティ**:
- ARIAライブリージョン
- キーボード操作対応
- 適切なラベリング

---

### DiagnosisResultsPage
**場所**: `/src/components/DiagnosisResultsPage.tsx`

診断結果を表示するコンポーネント。

**Props**:
```typescript
interface DiagnosisResultsPageProps {
  diagnosisData: DiagnosisFormState | null;
  onReturnToStart: () => void;
}
```

**表示内容**:
- おすすめ商品リスト
- 予想資産額
- リスクレベル
- 次のステップへの案内

---

## 管理画面コンポーネント

### AdminDashboardPage
**場所**: `/src/components/AdminDashboardPage.tsx`

管理者ダッシュボードのメインコンポーネント。

**Props**:
```typescript
interface AdminDashboardPageProps {
  onLogout: () => void;
}
```

**機能**:
- ユーザーデータ一覧
- 統計情報表示
- CSV エクスポート
- フィルタリング・検索
- リアルタイム更新

**パネル構成**:
1. UserManagementPanel - ユーザー管理
2. ContentManagementPanel - コンテンツ管理
3. ProductSettingsPanel - 商品設定
4. AnalyticsPanel - 分析ダッシュボード

---

## UIコンポーネント

### AccessibleButton
**場所**: `/src/components/AccessibleButton.tsx`

アクセシブルなボタンコンポーネント。

**Props**:
```typescript
interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}
```

**アクセシビリティ機能**:
- フォーカス管理
- キーボード操作
- スクリーンリーダー対応
- ローディング状態の通知

---

### AccessibleModal
**場所**: `/src/components/AccessibleModal.tsx`

アクセシブルなモーダルダイアログ。

**Props**:
```typescript
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

**特徴**:
- フォーカストラップ
- ESCキーでの閉じる
- アニメーション
- スクロールロック

---

### LoadingSpinner
**場所**: `/src/components/LoadingSpinner.tsx`

ローディングインジケーター。

**Props**:
```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
}
```

---

## ユーティリティコンポーネント

### ErrorBoundary
**場所**: `/src/components/ErrorBoundary.tsx`

エラーバウンダリーコンポーネント。

**Props**:
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}
```

**機能**:
- エラーキャッチ
- フォールバックUI表示
- エラーログ送信

---

### SEOHead
**場所**: `/src/components/SEOHead.tsx`

SEO用のメタタグを管理するコンポーネント。

**Props**:
```typescript
interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}
```

**機能**:
- Open Graphタグ
- Twitter Card
- 構造化データ（JSON-LD）
- 動的メタタグ更新

---

### PWAInstallPrompt
**場所**: `/src/components/PWAInstallPrompt.tsx`

PWAインストールプロンプト。

**Props**: なし

**機能**:
- インストール可能時に表示
- ネイティブプロンプトの制御
- インストール後の処理

---

### OfflineIndicator
**場所**: `/src/components/OfflineIndicator.tsx`

オフライン状態を表示するインジケーター。

**Props**:
```typescript
interface OfflineIndicatorProps {
  className?: string;
}
```

---

## ベストプラクティス

### 1. アクセシビリティ
- すべてのインタラクティブ要素に適切なARIA属性を設定
- キーボードナビゲーションのサポート
- スクリーンリーダーでのテスト

### 2. パフォーマンス
- 必要に応じてReact.memoを使用
- 大きなコンポーネントは動的インポート
- 画像の遅延読み込み

### 3. エラーハンドリング
- try-catchブロックの適切な使用
- ユーザーフレンドリーなエラーメッセージ
- エラーバウンダリーの活用

### 4. テスト
- 各コンポーネントのユニットテスト
- 統合テストでの動作確認
- アクセシビリティテスト

---

## 貢献ガイドライン

新しいコンポーネントを追加する際は：

1. TypeScriptで型定義を明確に
2. Props のドキュメントを記載
3. アクセシビリティを考慮
4. テストを作成
5. このカタログに追加

詳細は[CONTRIBUTING.md](../CONTRIBUTING.md)を参照してください。
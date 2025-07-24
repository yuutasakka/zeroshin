# 国際化(i18n)実装ガイド

## 概要

このプロジェクトでは、React i18nextを使用して日本語と英語の多言語対応を実装しています。

## 主要コンポーネント

### 1. 設定ファイル
- `/src/i18n/config.ts` - i18next基本設定
- `/src/i18n/locales/ja/translation.json` - 日本語翻訳ファイル
- `/src/i18n/locales/en/translation.json` - 英語翻訳ファイル

### 2. フック
- `useTranslation` - 翻訳テキストの取得
- `useLanguageSwitcher` - 言語切り替え機能
- `useNumberFormat` - 数値フォーマット（通貨、パーセント）
- `useDateFormat` - 日付フォーマット

### 3. コンポーネント
- `I18nProvider` - アプリケーション全体をラップ
- `LanguageSwitcher` - 言語切り替えUI（3つのバリエーション）
- `TranslatedText` - 翻訳テキスト表示用コンポーネント

## 使用方法

### 基本的な翻訳

```tsx
import { useTranslation } from '../i18n/hooks';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
};
```

### パラメータ付き翻訳

```tsx
// 翻訳ファイル
{
  "diagnosis": {
    "progress": "ステップ {{current}} / {{total}}"
  }
}

// コンポーネント
<p>{t('diagnosis.progress', { current: 2, total: 5 })}</p>
// 出力: ステップ 2 / 5
```

### 数値フォーマット

```tsx
const { formatCurrency, formatPercent } = useNumberFormat();

<p>{formatCurrency(10000)}</p> // ¥10,000 (日本語) / ¥10,000 (英語)
<p>{formatPercent(85)}</p>     // 85%
```

### 日付フォーマット

```tsx
const { formatDate, formatRelativeTime } = useDateFormat();

<p>{formatDate(new Date())}</p>           // 2024/1/15 (日本語) / 1/15/2024 (英語)
<p>{formatRelativeTime(new Date())}</p>   // たった今 / just now
```

## 言語切り替えUI

### ドロップダウン型
```tsx
<LanguageSwitcher variant="dropdown" />
```

### ボタン型
```tsx
<LanguageSwitcher variant="buttons" />
```

### ミニマル型
```tsx
<LanguageSwitcher variant="minimal" />
```

## 言語の永続化

言語設定は以下の方法で永続化されます：

1. **LocalStorage** - `preferredLanguage`キーで保存
2. **URLパラメータ** - `?lang=en`で言語指定可能
3. **ブラウザ設定** - 初回訪問時のデフォルト言語検出

## 新しい翻訳の追加

1. 翻訳ファイルに新しいキーを追加：

```json
// ja/translation.json
{
  "myFeature": {
    "title": "新機能",
    "description": "これは新しい機能です"
  }
}

// en/translation.json
{
  "myFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

2. コンポーネントで使用：

```tsx
const { t } = useTranslation();
<h2>{t('myFeature.title')}</h2>
```

## 翻訳済みコンポーネント

以下のコンポーネントは翻訳対応済みです：

- `EnhancedHeroTranslated` - ヒーローセクション
- `DiagnosisFlowTranslated` - 診断フロー
- `AdminLoginPageTranslated` - 管理者ログインページ
- `Header` - ヘッダーナビゲーション

## テスト

i18nのテストは以下のファイルで実装されています：

- `/src/i18n/i18n.test.tsx` - 単体テスト
- `/src/test/i18n.integration.test.tsx` - 統合テスト

テストの実行：
```bash
npm run test -- src/i18n/i18n.test.tsx
```

## ベストプラクティス

1. **キーの命名規則**
   - ネストした構造を使用: `section.subsection.key`
   - 意味のある名前を使用: `hero.title` ✓ `text1` ✗

2. **翻訳の管理**
   - 全ての言語で同じキー構造を維持
   - デフォルト言語（日本語）を基準に他言語を追加

3. **パフォーマンス**
   - 必要な名前空間のみロード
   - Suspenseを使用して非同期ロード

4. **アクセシビリティ**
   - 言語切り替え時に音声読み上げで通知
   - `lang`属性を適切に設定

## トラブルシューティング

### 翻訳が表示されない
- 翻訳キーが正しいか確認
- 翻訳ファイルが正しくインポートされているか確認
- ブラウザのコンソールでエラーを確認

### 言語が切り替わらない
- LocalStorageがブロックされていないか確認
- i18n設定の`detection`オプションを確認

### 数値・日付フォーマットが正しくない
- ブラウザのロケール設定を確認
- Intl APIのサポートを確認
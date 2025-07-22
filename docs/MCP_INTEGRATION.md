# AI ConectX MCP (Model Context Protocol) 統合ガイド

## 🤖 概要

AI ConectXアプリケーションは、最新のMCP (Model Context Protocol) 技術を統合し、高度な財務分析とAIアドバイス機能を提供します。

## 🌟 機能概要

### 実装済みMCPツール

1. **財務健康診断 (financial_health_diagnosis)**
   - 収入、支出、貯蓄、負債の総合分析
   - 100点満点の財務健康度スコア算出
   - 個別化された改善提案

2. **投資シミュレーション (investment_calculator)**
   - 複利効果を考慮した将来資産予測
   - 年別資産推移の詳細表示
   - リターン・リスク分析

3. **ポートフォリオ分析 (portfolio_risk_assessment)**
   - 資産配分の最適化提案
   - リスク・リターン指標の計算
   - 投資期間に応じた戦略提案

4. **緊急資金計算 (emergency_fund_calculator)**
   - 適切な緊急資金額の算出
   - 雇用安定性・扶養家族を考慮
   - 段階的貯蓄計画の提案

## 📋 技術仕様

### アーキテクチャ

```
Frontend (React/TypeScript)
    ↓
MCPFinancialAssistant Component
    ↓
Chat API (/src/app/api/mcp/chat)
    ↓
AI SDK (Google Gemini)
    ↓
MCP Server (/src/app/api/mcp)
    ↓
Financial Analysis Tools
```

### 依存関係

```json
{
  "@modelcontextprotocol/sdk": "^0.x.x",
  "@vercel/mcp-adapter": "^0.x.x",
  "ai": "^3.x.x",
  "@ai-sdk/google": "^0.x.x",
  "zod": "^3.x.x"
}
```

## 🚀 セットアップ

### 1. 環境変数設定

```bash
# .env.local または Vercel環境変数
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_API_KEY=your_google_gemini_api_key  # 予備
```

### 2. MCP サーバーエンドポイント

- **MCP Server**: `/src/app/api/mcp`
- **Chat API**: `/src/app/api/mcp/chat`

### 3. デプロイ設定

Vercelでの自動デプロイ時に、以下が自動実行されます：

1. MCP サーバーの初期化
2. AI SDK とGoogle Geminiの連携
3. セキュアなHTTPS通信の確立

## 💡 使用方法

### ユーザー向け

1. 診断結果ページで「AI財務アドバイザー」セクションを確認
2. 定型質問から選択するか、自由に質問を入力
3. MCPツールを活用した詳細な分析結果を受信

### 開発者向け

```typescript
// MCPツールの呼び出し例
const response = await fetch('/src/app/api/mcp/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "財務診断をお願いします。年収600万円、支出30万円/月...",
    history: [...previousMessages]
  })
});
```

## 🔧 カスタマイズ

### 新しいMCPツールの追加

1. `/src/app/api/mcp/route.ts` でツールを定義
2. Zodスキーマでパラメータを検証
3. ビジネスロジックを実装

```typescript
server.tool(
  'new_financial_tool',
  'ツールの説明',
  {
    param1: z.string(),
    param2: z.number()
  },
  async (params) => {
    // ツールのロジック実装
    return { content: [{ type: 'text', text: '結果' }] };
  }
);
```

## 🛡️ セキュリティ

### データ保護

- API通信は全てHTTPS
- 機密情報のサニタイゼーション
- セッション管理の実装

### エラーハンドリング

- MCP接続失敗時のフォールバック
- APIキー未設定時の適切なエラー表示
- タイムアウト・レート制限の管理

## 📊 パフォーマンス

### 最適化機能

- Vercel Fluid Computeとの統合
- 動的スケーリング対応
- キャッシュ戦略の実装

### モニタリング

- API応答時間の監視
- エラーレートの追跡
- ユーザー利用パターン分析

## 🔗 外部連携

### CursorなどのMCPクライアントとの連携

```json
{
  "mcpServers": {
    "moneyticket-financial": {
      "url": "https://your-app.vercel.app/src/app/api/mcp"
    }
  }
}
```

## 📝 ロードマップ

### 近日実装予定

- [ ] 不動産投資シミュレーション
- [ ] 税務最適化ツール
- [ ] 家計簿連携機能
- [ ] 保険プラン分析
- [ ] ライフプランシミュレーション

### 将来的な機能

- [ ] 音声インターフェース
- [ ] 多言語対応
- [ ] 機械学習による個人化
- [ ] ブロックチェーン連携

## ❓ トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - 環境変数が正しく設定されているか確認
   - Google AI Studioでキーが有効か確認

2. **MCP接続エラー**
   - Vercelデプロイメントが成功しているか確認
   - ネットワーク設定を確認

3. **応答が遅い**
   - Fluid Computeが有効か確認
   - API制限に達していないか確認

## 📞 サポート

技術的な問題やご質問は、GitHubのIssueまたは開発チームまでお問い合わせください。

---

**AI ConectX MCP Integration - Empowering Financial Intelligence with AI** 🚀 
import { experimental_createMCPClient as createMcpClient } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

// Gemini AIプロバイダーの設定
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
});

const model = google('gemini-2.0-flash');

// MCPクライアントの初期化
async function initializeMCPClient() {
  try {
    // 本番環境ではHTTP transportを使用（より安定）
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const mcpClient = await createMcpClient({
      name: 'moneyticket-financial-advisor',
      transport: {
        type: 'sse',
        url: `${baseUrl}/src/app/api/mcp`
      }
    });
    
    return mcpClient;
  } catch (error) {
    console.error('MCP Client initialization failed:', error);
    // フォールバック: MCPなしでも動作させる
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
          return new Response(
      JSON.stringify({ error: 'メッセージが無効です' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    }

    // MCPクライアントの初期化を試行
    const mcpClient = await initializeMCPClient();
    
    // メッセージ履歴を構築
    const messages = [
      {
        role: 'system' as const,
        content: `あなたはMoneyTicketの専属財務アドバイザーです。以下の役割を担ってください：

1. 財務診断: ユーザーの収入、支出、貯蓄、負債を分析し健康度スコアを算出
2. 投資アドバイス: リスク許容度に応じた投資戦略を提案
3. 資産運用シミュレーション: 複利効果を考慮した将来予測を実行
4. ポートフォリオ最適化: リスク・リターンの分析と改善提案
5. 緊急資金計画: 適切な緊急資金額と貯蓄戦略を提案

必ず日本語で回答し、具体的な数値と根拠を示してください。
ユーザーが具体的なデータを提供した場合は、利用可能なMCPツールを使って詳細な分析を行ってください。`
      },
      ...(history || []).slice(-10).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // AI生成の実行
    const result = await generateText({
      model,
      messages,
      // tools: mcpClient ? await mcpClient.listTools() : {},
      maxSteps: 5,
      temperature: 0.7,
    });

    // MCPクライアントのクリーンアップ
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (error) {
        console.warn('MCP Client close failed:', error);
      }
    }

    return new Response(
      JSON.stringify({
        response: result.text,
        toolCalls: result.steps?.length || 0
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // エラーハンドリング - フォールバック応答
    let fallbackResponse = '';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        fallbackResponse = '申し訳ありません。AIサービスの設定に問題があります。管理者にお問い合わせください。';
      } else if (error.message.includes('rate limit')) {
        fallbackResponse = 'リクエストが多すぎます。しばらくお待ちいただいてから再度お試しください。';
      } else {
        fallbackResponse = '申し訳ありません。一時的なエラーが発生しました。もう一度お試しください。';
      }
    } else {
      fallbackResponse = 'システムエラーが発生しました。しばらく時間をおいて再度お試しください。';
    }

    return new Response(
      JSON.stringify({ 
        response: fallbackResponse,
        error: 'Internal server error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// GET リクエストでのヘルスチェック
export async function GET() {
  try {
    const hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    
    return new Response(
      JSON.stringify({
        status: 'ok',
        service: 'MoneyTicket MCP Chat API',
        apiKeyConfigured: hasApiKey,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: 'Service unavailable'
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 
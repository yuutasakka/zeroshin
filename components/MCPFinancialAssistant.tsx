import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MCPFinancialAssistantProps {
  className?: string;
}

export const MCPFinancialAssistant: React.FC<MCPFinancialAssistantProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `# 🤖 MoneyTicket AI財務アドバイザー

こんにちは！私はあなたの財務状況を分析し、最適なアドバイスを提供するAIアシスタントです。

## 📋 利用可能な機能
- **財務健康診断**: 収入、支出、貯蓄状況の総合分析
- **投資シミュレーション**: 複利効果を考慮した将来資産の計算
- **ポートフォリオ分析**: リスクとリターンの最適化提案
- **緊急資金計算**: 適切な緊急資金額と貯蓄計画

どのような財務相談をお手伝いしましょうか？`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const predefinedQuestions = [
    {
      text: "財務健康診断をお願いします",
      prompt: "私の財務状況を診断してください。年齢: 35歳、年収: 600万円、月間支出: 30万円、貯蓄: 200万円、借金: 100万円、投資目標: 老後資金、リスク許容度: medium"
    },
    {
      text: "投資シミュレーションを実行",
      prompt: "投資シミュレーションをお願いします。元本: 100万円、月次積立: 5万円、想定年利: 5%、投資期間: 20年"
    },
    {
      text: "ポートフォリオを分析",
      prompt: "ポートフォリオ分析をお願いします。資産配分: 国内株式50%、外国株式30%、債券20%、投資期間: 15年、リスク許容度: moderate"
    },
    {
      text: "緊急資金を計算",
      prompt: "緊急資金計算をお願いします。月間生活費: 25万円、現在の貯蓄: 150万円、雇用安定性: stable、扶養家族: 2人"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/src/app/api/mcp/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '申し訳ありません。エラーが発生しました。もう一度お試しください。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredefinedQuestion = (prompt: string) => {
    setInput(prompt);
  };

  const formatContent = (content: string) => {
    // マークダウン風のテキストをHTMLに変換（簡易版）
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-navy-800 mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-navy-700 mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium text-navy-600 mb-2 mt-4">$1</h3>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-navy-800">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-navy-600 to-navy-700 text-white p-4 rounded-t-xl">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🤖 AI財務アドバイザー
          <span className="text-sm bg-gold-500 text-navy-800 px-2 py-1 rounded-full">
            MCP対応
          </span>
        </h2>
        <p className="text-navy-100 text-sm mt-1">
          MoneyTicket専属のAIが、あなたの財務状況を詳しく分析します
        </p>
      </div>

      {/* メッセージエリア */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-navy-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {message.role === 'user' ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(message.content)
                  }}
                />
              )}
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-navy-200' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString('ja-JP')}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy-600"></div>
                <span>分析中...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 定型質問 */}
      <div className="border-t border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">よくある質問</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {predefinedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handlePredefinedQuestion(question.prompt)}
              className="text-left text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors"
              disabled={isLoading}
            >
              {question.text}
            </button>
          ))}
        </div>
      </div>

      {/* 入力フォーム */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="財務に関する質問をお聞かせください..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-navy-600 text-white px-4 py-2 rounded-lg hover:bg-navy-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </form>
      </div>
    </div>
  );
}; 
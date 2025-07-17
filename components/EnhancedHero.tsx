import React, { useState, useEffect } from 'react';

interface EnhancedHeroProps {
  onStartDiagnosis: () => void;
}

const EnhancedHero: React.FC<EnhancedHeroProps> = ({ onStartDiagnosis }) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    setIsAnimated(true);
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { icon: '👥', number: '50,000+', label: 'ユーザー数' },
    { icon: '💰', number: '¥2.5億', label: '運用資産総額' },
    { icon: '⭐', number: '4.8/5.0', label: '満足度' }
  ];

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 背景パターン */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233B82F6' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* アニメーション円 */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-gradient-to-br from-green-400 to-blue-400 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* バッジ */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium mb-6 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          <span className="animate-pulse">🎯</span>
          <span>期間限定！今なら診断無料</span>
        </div>

        {/* メインタイトル */}
        <h1 className={`text-4xl md:text-6xl font-bold text-gray-800 mb-6 transform transition-all duration-1000 delay-200 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          あなたの資産を
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            最大化する投資プラン
          </span>
        </h1>

        {/* サブタイトル */}
        <p className={`text-xl text-gray-600 mb-8 max-w-2xl mx-auto transform transition-all duration-1000 delay-300 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          たった30秒の診断で、あなたに最適な投資戦略をAIが提案。
          <br />
          プロの投資アドバイザーへの相談も無料でサポート
        </p>

        {/* CTA ボタン */}
        <div className={`mb-12 transform transition-all duration-1000 delay-400 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <button
            onClick={onStartDiagnosis}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <span className="relative z-10">無料診断を開始する</span>
            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            
            {/* ボタンの光るエフェクト */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </button>
          
          <p className="text-sm text-gray-500 mt-3">
            🔒 SMS認証で安心・クレジットカード不要
          </p>
        </div>

        {/* 統計情報 */}
        <div className={`grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto transform transition-all duration-1000 delay-500 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center p-4 rounded-2xl transition-all duration-500 ${
                currentStat === index 
                  ? 'bg-white shadow-lg scale-105' 
                  : 'bg-white/50'
              }`}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold transition-colors duration-500 ${
                currentStat === index 
                  ? 'text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text' 
                  : 'text-gray-700'
              }`}>
                {stat.number}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 信頼性バッジ */}
        <div className={`flex flex-wrap justify-center gap-4 mt-12 transform transition-all duration-1000 delay-600 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
            <span>🏆</span>
            <span className="text-sm font-medium text-gray-700">金融庁認可</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
            <span>🛡️</span>
            <span className="text-sm font-medium text-gray-700">SSL暗号化</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
            <span>📱</span>
            <span className="text-sm font-medium text-gray-700">スマホ完結</span>
          </div>
        </div>
      </div>

      {/* フローティングアイコン */}
      <div className="absolute top-1/4 left-10 animate-float opacity-20">
        <div className="text-6xl">💰</div>
      </div>
      <div className="absolute bottom-1/4 right-10 animate-float opacity-20" style={{ animationDelay: '2s' }}>
        <div className="text-6xl">📈</div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default EnhancedHero;
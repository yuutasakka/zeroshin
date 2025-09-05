import React, { useEffect, useState } from 'react';
import { getPdfGuideUrl, getAffiliateLinksByCategory } from '../config/links';

interface CombatPowerResultsProps {
  diagnosisAnswers: Record<number, string>;
  onDownloadGuide: () => void;
}

interface SubScores {
  marketUnderstanding: number;
  riskManagement: number;
  executionAbility: number;
}

const CombatPowerResults: React.FC<CombatPowerResultsProps> = ({ diagnosisAnswers, onDownloadGuide }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const pdfGuideUrl = getPdfGuideUrl();
  const exchangeLinks = getAffiliateLinksByCategory('exchange');
  const walletLinks = getAffiliateLinksByCategory('wallet');
  
  // スコア計算ロジック
  const calculateScores = (): { total: number; rank: string; subScores: SubScores; comment: string } => {
    let marketUnderstanding = 0;
    let riskManagement = 0;
    let executionAbility = 0;
    
    // 経験による市場理解度計算
    switch (diagnosisAnswers[1]) {
      case '～300万円': marketUnderstanding += 15; break;
      case '300～500万円': marketUnderstanding += 25; break;
      case '500～800万円': marketUnderstanding += 35; break;
      case '800万円～': marketUnderstanding += 40; break;
    }
    
    // 投資金額によるリスク管理能力計算
    switch (diagnosisAnswers[2]) {
      case '～10万円': riskManagement += 10; break;
      case '10～50万円': riskManagement += 20; break;
      case '50～100万円': riskManagement += 30; break;
      case '100万円～': riskManagement += 40; break;
    }
    
    // 経験件数による減点
    switch (diagnosisAnswers[3]) {
      case '0件': riskManagement += 20; marketUnderstanding += 10; break;
      case '1～2件': riskManagement += 10; break;
      case '3件以上': riskManagement -= 10; marketUnderstanding -= 5; break;
    }
    
    // リスク許容度による調整
    switch (diagnosisAnswers[4]) {
      case '収入に対して返済が10%未満': riskManagement += 20; break;
      case '10～30%': riskManagement += 10; break;
      case '30%以上': riskManagement -= 10; break;
    }
    
    // 投資開始時期による実行力
    switch (diagnosisAnswers[5]) {
      case '今すぐ': executionAbility = 30; break;
      case '1週間以内': executionAbility = 20; break;
      case '1ヶ月以内': executionAbility = 10; break;
    }
    
    // スコアの正規化（各項目を0-100の範囲に）
    marketUnderstanding = Math.max(0, Math.min(100, marketUnderstanding * 2));
    riskManagement = Math.max(0, Math.min(100, riskManagement * 1.5));
    executionAbility = Math.max(0, Math.min(100, executionAbility * 3.33));
    
    const total = Math.round((marketUnderstanding + riskManagement + executionAbility) / 3);
    
    // ランク判定
    let rank = 'C';
    if (total >= 80) rank = 'S';
    else if (total >= 60) rank = 'A';
    else if (total >= 40) rank = 'B';
    
    // パーソナライズドコメント
    let comment = '';
    if (rank === 'S') {
      comment = `適性スコア${total}点！最高ランクです。暗号資産投資に最適な状態です。`;
    } else if (rank === 'A') {
      comment = `適性スコア${total}点！良好な状態です。${marketUnderstanding > riskManagement ? '特に市場理解が高く' : '特にリスク管理ができ'}、安心して投資を進められます。`;
    } else if (rank === 'B') {
      comment = `適性スコア${total}点！標準的な状態です。${riskManagement < 30 ? 'リスク管理戦略を見直すことで' : '市場理解を深めることで'}、より良い結果が期待できます。`;
    } else {
      comment = `適性スコア${total}点！まずは基本を学びましょう。専門書やセミナーの受講を検討してください。`;
    }
    
    return {
      total,
      rank,
      subScores: { marketUnderstanding, riskManagement, executionAbility },
      comment
    };
  };
  
  const { total, rank, subScores, comment } = calculateScores();
  
  useEffect(() => {
    setIsAnimating(true);
    // スコアのカウントアップアニメーション
    const interval = setInterval(() => {
      setCurrentScore(prev => {
        if (prev >= total) {
          clearInterval(interval);
          return total;
        }
        return Math.min(prev + 2, total);
      });
    }, 30);
    
    return () => clearInterval(interval);
  }, [total]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'S': return '#F5A623'; // ゴールド
      case 'A': return 'var(--color-primary)'; // ブルー
      case 'B': return '#10B981'; // グリーン
      case 'C': return '#6B7280'; // グレー
      default: return '#6B7280';
    }
  };

  // レーダーチャート描画用の座標計算
  const calculateRadarPoints = (scores: SubScores): string => {
    const centerX = 150;
    const centerY = 150;
    const radius = 100;
    const angles = [-90, 30, 150]; // 上、右下、左下
    
    const points = [
      scores.marketUnderstanding,
      scores.riskManagement,
      scores.executionAbility
    ].map((score, index) => {
      const angle = (angles[index] ?? 0) * Math.PI / 180;
      const r = (score / 100) * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return `${x},${y}`;
    });
    
    return points.join(' ');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F7F9FC',
      padding: 'clamp(60px, 8vw, 80px) clamp(16px, 4vw, 20px) 40px',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* タイトル */}
        <div style={{
          textAlign: 'center',
          marginBottom: 'clamp(32px, 6vw, 48px)',
          animation: 'fadeIn 0.8s ease-out'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '8px'
          }}>
            診断結果
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 3vw, 18px)',
            color: 'var(--color-text-secondary)'
          }}>
            あなたの暗号資産投資適性
          </p>
        </div>
        
        {/* メインスコアカード */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'clamp(16px, 3vw, 24px)',
          padding: 'clamp(24px, 6vw, 48px)',
          marginBottom: 'clamp(20px, 4vw, 32px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
          animation: 'slideUp 0.8s ease-out 0.2s both'
        }}>
          {/* 総合スコア */}
          <div style={{
            fontSize: 'clamp(2.5rem, 12vw, 5rem)',
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: '16px',
            color: getRankColor(rank)
          }}>
            {currentScore}
            <span style={{ fontSize: '0.5em', fontWeight: 500 }}>点</span>
          </div>
          
          {/* ランク表示 */}
          <div style={{
            display: 'inline-block',
            padding: '8px 24px',
            backgroundColor: getRankColor(rank),
            color: 'white',
            borderRadius: '50px',
            fontWeight: 700,
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
          }}>
            ランク {rank}
          </div>
          
          {/* コメント */}
          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 18px)',
            lineHeight: 1.6,
            color: 'var(--color-text-primary)',
            marginBottom: '32px'
          }}>
            {comment}
          </p>
          
          {/* アクションボタン */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center'
          }}>
            <a
              href={pdfGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg no-underline inline-flex"
              aria-label="暗号資産投資完全ガイドをダウンロード"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📚</span>
                仮想通貨の始め方 完全ガイド（PDF）
              </div>
            </a>
            
            <button
              onClick={onDownloadGuide}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
              aria-label="診断結果をシェア"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📤</span>
                結果をシェア
              </div>
            </button>
          </div>
        </div>
        
        {/* サブスコアセクション */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'clamp(16px, 3vw, 24px)',
          padding: 'clamp(24px, 6vw, 32px)',
          marginBottom: 'clamp(20px, 4vw, 32px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          animation: 'slideUp 0.8s ease-out 0.4s both'
        }}>
          <h2 style={{
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            詳細スコア
          </h2>
          
          {/* レーダーチャート */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '32px'
          }}>
            <div style={{ position: 'relative' }}>
              <svg width="300" height="300" viewBox="0 0 300 300">
                {/* グリッド */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, idx) => (
                  <circle
                    key={idx}
                    cx="150"
                    cy="150"
                    r={100 * scale}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                ))}
                
                {/* 軸線 */}
                <line x1="150" y1="150" x2="150" y2="50" stroke="#E5E7EB" strokeWidth="1" />
                <line x1="150" y1="150" x2="236.6" y2="200" stroke="#E5E7EB" strokeWidth="1" />
                <line x1="150" y1="150" x2="63.4" y2="200" stroke="#E5E7EB" strokeWidth="1" />
                
                {/* データポリゴン */}
                <polygon
                  points={calculateRadarPoints(subScores)}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                />
                
                {/* データポイント */}
                {[
                  { value: subScores.marketUnderstanding, angle: -90, label: '市場理解' },
                  { value: subScores.riskManagement, angle: 30, label: 'リスク管理' },
                  { value: subScores.executionAbility, angle: 150, label: '実行力' }
                ].map((item, idx) => {
                  const angle = item.angle * Math.PI / 180;
                  const r = (item.value / 100) * 100;
                  const x = 150 + r * Math.cos(angle);
                  const y = 150 + r * Math.sin(angle);
                  
                  return (
                    <g key={idx}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="var(--color-primary)"
                      />
                      <text
                        x={150 + 110 * Math.cos(angle)}
                        y={150 + 110 * Math.sin(angle)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill="var(--color-text-primary)"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          
          {/* スコア詳細 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {[
              { label: '市場理解', value: subScores.marketUnderstanding, color: '#3B82F6' },
              { label: 'リスク管理', value: subScores.riskManagement, color: '#10B981' },
              { label: '実行力', value: subScores.executionAbility, color: '#8B5CF6' }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '20px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: item.color,
                  marginBottom: '8px'
                }}>
                  {item.value}
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)'
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* アドバイスセクション */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'clamp(16px, 3vw, 24px)',
          padding: 'clamp(24px, 6vw, 32px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          animation: 'slideUp 0.8s ease-out 0.6s both'
        }}>
          <h2 style={{
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            あなたの適性に合ったアドバイス
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {rank === 'S' && (
              <>
                <div style={{
                  padding: '24px',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '16px',
                  border: '1px solid #DBEAFE'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#3B82F6',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🚀</span>
                    あなたにおすすめの戦略
                  </h3>
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6
                  }}>
                    あなたの高い適性を活かして、積極的なポートフォolio構築をおすすめします。NFTやDeFiなど新しい分野にも挑戦してみましょう。
                  </p>
                </div>
                
                <div style={{
                  padding: '24px',
                  backgroundColor: '#ECFDF5',
                  borderRadius: '16px',
                  border: '1px solid #D1FAE5'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#10B981',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🛡️</span>
                    リスク管理のコツ
                  </h3>
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6
                  }}>
                    高い適性を持つからこそ、他人の失敗事例から学ぶことが重要です。コミュニティや専門書を通じて常に学び続けてください。
                  </p>
                </div>
              </>
            )}
            
            {rank === 'A' && (
              <>
                <div style={{
                  padding: '24px',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '16px',
                  border: '1px solid #DBEAFE'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#3B82F6',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📈</span>
                    あなたの強みを活かす方法
                  </h3>
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6
                  }}>
                    あなたはバランスの取れた投資適性を持っています。{subScores.marketUnderstanding > subScores.riskManagement ? '市場の動きを読み取る能力' : '慎重なリスク管理'}をさらに磨くことで、より良い結果が期待できます。
                  </p>
                </div>
                
                <div style={{
                  padding: '24px',
                  backgroundColor: '#F0F9FF',
                  borderRadius: '16px',
                  border: '1px solid #E0F2FE'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#0EA5E9',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🎯</span>
                    改善ポイント
                  </h3>
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6
                  }}>
                    {subScores.riskManagement < 30 ? 'リスク管理戦略を見直し、' : '市場理解を深め、'}損失を最小限に抑えながらリターンを最大化する戦略を構築しましょう。
                  </p>
                </div>
              </>
            )}
            
            {(rank === 'B' || rank === 'C') && (
              <>
                <div style={{
                  padding: '24px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '16px',
                  border: '1px solid #FDE68A'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#D97706',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📚</span>
                    基礎知識の習得
                  </h3>
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6
                  }}>
                    まずは基本的な暗号資産の仕組みやリスクについて学びましょう。無料のオンラインコースや書籍から始めるのがおすすめです。
                  </p>
                </div>
                
                <div style={{
                  padding: '24px',
                  backgroundColor: '#F0F9FF',
                  borderRadius: '16px',
                  border: '1px solid #E0F2FE'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#0EA5E9',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>💡</span>
                    実践的なアプローチ
                  </h3>
                  <p style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6
                  }}>
                    小額から始めて実践経験を積みましょう。デモ取引や小額投資を通じて、自分の適性を見つけていってください。
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* おすすめの取引所・ウォレット */}
      <div style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#2d3748',
          marginBottom: '1rem'
        }}>
          📈 おすすめの取引所
        </h3>
        <p style={{
          color: '#718096',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}>
          あなたに最適な暗号資産取引所で今すぐ始めましょう
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1000px',
          margin: '0 auto 3rem auto'
        }}>
          {exchangeLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s ease',
                border: '1px solid #e2e8f0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '0.5rem'
              }}>
                {link.name}
              </div>
              <div style={{
                color: '#718096',
                fontSize: '1rem'
              }}>
                {link.description}
              </div>
            </a>
          ))}
        </div>

        <h3 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#2d3748',
          marginBottom: '1rem'
        }}>
          👛 おすすめのウォレット
        </h3>
        <p style={{
          color: '#718096',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}>
          安全に暗号資産を保管するためのウォレット
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {walletLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s ease',
                border: '1px solid #e2e8f0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '0.5rem'
              }}>
                {link.name}
              </div>
              <div style={{
                color: '#718096',
                fontSize: '1rem'
              }}>
                {link.description}
              </div>
            </a>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CombatPowerResults;
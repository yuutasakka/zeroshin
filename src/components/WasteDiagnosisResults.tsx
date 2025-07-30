import React, { useState, useEffect } from 'react';
import { calculateWasteScore, getWasteDiagnosisResult } from '../../data/wasteDiagnosisResults';

interface WasteDiagnosisResultsProps {
  answers: Record<string, string>;
  userInfo?: {
    id: string;
    displayName: string;
    pictureUrl?: string;
  };
  onSaveComplete?: () => void;
  onReturnHome?: () => void;
}

const WasteDiagnosisResults: React.FC<WasteDiagnosisResultsProps> = ({
  answers,
  userInfo,
  onSaveComplete,
  onReturnHome
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savingPlan, setSavingPlan] = useState<'monthly' | 'yearly'>('monthly');

  const score = calculateWasteScore(answers);
  const result = getWasteDiagnosisResult(score);

  // アニメーション用の状態
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    // 段階的にアニメーションを実行
    const timer1 = setTimeout(() => setAnimationStep(1), 500);
    const timer2 = setTimeout(() => setAnimationStep(2), 1000);
    const timer3 = setTimeout(() => setAnimationStep(3), 1500);
    const timer4 = setTimeout(() => {
      setAnimationStep(4);
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: `Zero神診断結果: ${result.title}`,
      text: `私のムダ遣い診断結果は「${result.title}」でした！あなたも診断してみませんか？`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const saveResults = async () => {
    // 診断結果をデータベースに保存
    try {
      const response = await fetch('/api/save-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userInfo?.id,
          answers,
          score,
          result: result.level,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        onSaveComplete?.();
      }
    } catch (error) {
      console.error('診断結果の保存に失敗しました:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'pulse 1.5s infinite'
          }}>
            🔮
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '16px'
          }}>
            診断結果を分析中...
          </h2>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            marginBottom: '20px'
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#8b5cf6',
                  animation: `bounce 1.4s infinite ${i * 0.2}s`
                }}
              />
            ))}
          </div>
          <p style={{ color: '#718096', fontSize: '16px' }}>
            {animationStep >= 1 && '💸 無駄遣いパターンを分析...'}
            {animationStep >= 2 && <><br />📊 節約ポテンシャルを計算...</>}
            {animationStep >= 3 && <><br />🎯 おすすめ改善策を選定...</>}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* メイン結果カード */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '28px',
          padding: '50px 40px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.8s ease-out'
        }}>
          {/* ユーザー情報 */}
          {userInfo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '30px',
              padding: '16px',
              background: '#f7fafc',
              borderRadius: '16px'
            }}>
              {userInfo.pictureUrl && (
                <img 
                  src={userInfo.pictureUrl} 
                  alt="プロフィール"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '3px solid #8b5cf6'
                  }}
                />
              )}
              <div>
                <p style={{ 
                  fontWeight: 'bold', 
                  color: '#2d3748', 
                  margin: 0,
                  fontSize: '18px'
                }}>
                  {userInfo.displayName}さんの診断結果
                </p>
              </div>
            </div>
          )}

          {/* 結果表示 */}
          <div style={{
            fontSize: '80px',
            marginBottom: '20px',
            animation: 'bounceIn 1s ease-out'
          }}>
            {result.emoji}
          </div>
          
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {result.title}
          </h1>
          
          <p style={{
            fontSize: '20px',
            color: '#8b5cf6',
            fontWeight: '600',
            marginBottom: '24px'
          }}>
            {result.subtitle}
          </p>

          <p style={{
            fontSize: '16px',
            color: '#4a5568',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 30px'
          }}>
            {result.description}
          </p>

          {/* 節約ポテンシャル */}
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '20px',
            padding: '30px',
            color: 'white',
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              💰 節約ポテンシャル
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {result.potentialSavings.monthly}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>月間節約可能額</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {result.potentialSavings.yearly}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>年間節約可能額</div>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleShare}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              📤 結果をシェア
            </button>

            <button
              onClick={onReturnHome}
              style={{
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '16px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#667eea';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#667eea';
              }}
            >
              🏠 ホームに戻る
            </button>
          </div>
        </div>

        {/* 改善提案カード */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            💡 {result.recommendations.title}
          </h3>
          
          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {result.recommendations.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#f7fafc',
                  borderRadius: '12px',
                  border: '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.background = '#faf5ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = '#f7fafc';
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#8b5cf6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </div>
                <span style={{
                  color: '#4a5568',
                  fontSize: '16px'
                }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 実践のヒント */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🎯 実践のヒント
          </h3>
          
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {result.tips.map((tip, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                  borderRadius: '16px',
                  borderLeft: '4px solid #8b5cf6'
                }}
              >
                <p style={{
                  color: '#4c1d95',
                  fontSize: '16px',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* モチベーションメッセージ */}
        <div style={{
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔥</div>
          <p style={{
            fontSize: '18px',
            color: '#92400e',
            fontWeight: '600',
            lineHeight: '1.6',
            margin: 0
          }}>
            {result.motivation}
          </p>
        </div>
      </div>

      {/* アニメーション用CSS */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default WasteDiagnosisResults;
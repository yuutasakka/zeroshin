import React, { useState, useEffect } from 'react';
import { wasteQuestions, WasteQuestion } from '../../data/wasteQuestions';
import { ErrorMessage } from './ui/ErrorMessage';

interface WasteDiagnosisFormProps {
  onComplete: (answers: Record<string, string>) => void;
}

const WasteDiagnosisForm: React.FC<WasteDiagnosisFormProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  const currentQuestion = wasteQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / wasteQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === wasteQuestions.length - 1;

  // 質問IDと回答の対応付け
  const questionKeys = ['age', 'wasteLevel', 'category', 'monthlyWaste', 'awareness'];

  const handleAnswerSelect = (optionId: string) => {
    setError('');
    const questionKey = questionKeys[currentQuestionIndex];
    const newAnswers = { ...answers, [questionKey]: optionId };
    setAnswers(newAnswers);

    setIsAnimating(true);
    
    setTimeout(() => {
      if (isLastQuestion) {
        // 診断完了
        onComplete(newAnswers);
      } else {
        // 次の質問へ
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  return (
    <div className="waste-diagnosis-container" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease',
        transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
        opacity: isAnimating ? 0.8 : 1
      }}>
        {/* プログレスバー */}
        <div style={{
          background: '#f0f0f0',
          borderRadius: '12px',
          height: '8px',
          marginBottom: '30px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            height: '100%',
            width: `${progress}%`,
            borderRadius: '12px',
            transition: 'width 0.5s ease'
          }} />
        </div>

        {/* 質問番号とタイトル */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <div style={{
            fontSize: '14px',
            color: '#8b5cf6',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            質問 {currentQuestionIndex + 1} / {wasteQuestions.length}
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '8px',
            lineHeight: '1.3'
          }}>
            {currentQuestion.title}
          </h2>
          {currentQuestion.subtitle && (
            <p style={{
              fontSize: '16px',
              color: '#718096',
              margin: 0
            }}>
              {currentQuestion.subtitle}
            </p>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <ErrorMessage 
            message={error}
            onDismiss={() => setError('')}
          />
        )}

        {/* 選択肢 */}
        <div style={{
          display: 'grid',
          gap: '16px',
          marginBottom: '30px'
        }}>
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswerSelect(option.id)}
              style={{
                background: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.background = '#f7fafc';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
              }}
            >
              <div style={{
                fontSize: '24px',
                minWidth: '32px'
              }}>
                {option.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '4px'
                }}>
                  {option.text}
                </div>
                {option.description && (
                  <div style={{
                    fontSize: '14px',
                    color: '#718096'
                  }}>
                    {option.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* ナビゲーションボタン */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handleBack}
            disabled={currentQuestionIndex === 0}
            style={{
              background: 'transparent',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              color: currentQuestionIndex === 0 ? '#a0aec0' : '#4a5568',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQuestionIndex === 0 ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (currentQuestionIndex > 0) {
                e.currentTarget.style.borderColor = '#cbd5e0';
              }
            }}
            onMouseOut={(e) => {
              if (currentQuestionIndex > 0) {
                e.currentTarget.style.borderColor = '#e2e8f0';
              }
            }}
          >
            ← 前の質問
          </button>

          <div style={{
            fontSize: '14px',
            color: '#718096',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🔮</span>
            <span>選択肢をタップして進む</span>
          </div>
        </div>

        {/* 診断についての説明 */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f7fafc',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#4a5568',
            lineHeight: '1.5'
          }}>
            <span style={{ fontSize: '16px', marginRight: '8px' }}>ℹ️</span>
            この診断は約2分で完了します。正直にお答えいただくことで、
            より正確な診断結果とおすすめの節約方法をご提案できます。
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteDiagnosisForm;
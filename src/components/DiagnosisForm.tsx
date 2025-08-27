import React, { useState } from 'react';
import { wasteQuestions } from '../../data/wasteQuestions';

interface Question {
  id: number;
  question: string;
  subtitle?: string;
  options: {
    id: string;
    text: string;
    emoji: string;
    description?: string;
  }[];
  helpText?: string;
}

interface DiagnosisFormProps {
  onComplete: (answers: Record<number, string>) => void;
}

// Convert wasteQuestions to the format expected by the form
const questions: Question[] = wasteQuestions.map(wq => ({
  id: wq.id,
  question: wq.title,
  subtitle: wq.subtitle,
  options: wq.options,
  helpText: wq.subtitle
}));

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHelpText, setShowHelpText] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  const handleAnswer = (optionId: string) => {
    if (!currentQ) return;
    
    setSelectedOption(optionId);
    setIsAnimating(true);
    
    setTimeout(() => {
      const newAnswers = { ...answers, [currentQ.id]: optionId };
      setAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setIsAnimating(false);
        setShowHelpText(false);
      } else {
        onComplete(newAnswers);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(null);
      setShowHelpText(false);
    }
  };

  if (!currentQ) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* プログレスステップバー */}
      <div style={{
        marginBottom: '40px'
      }}>
        {/* ステップインジケーター */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px',
          position: 'relative'
        }}>
          {/* 背景ライン */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '24px',
            right: '24px',
            height: '2px',
            backgroundColor: 'var(--color-bg-tertiary)',
            zIndex: 0
          }} />
          {/* アクティブライン */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '24px',
            height: '2px',
            backgroundColor: 'var(--color-primary)',
            width: `calc(${(currentQuestion / (questions.length - 1)) * 100}% - 48px)`,
            transition: 'width 0.5s ease',
            zIndex: 0
          }} />
          
          {/* ステップドット */}
          {[...Array(questions.length)].map((_, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: index <= currentQuestion ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                border: index <= currentQuestion ? 'none' : '2px solid var(--color-bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: index === currentQuestion ? '0 0 0 4px rgba(var(--color-primary-rgb), 0.2)' : 'none'
              }}>
                {index < currentQuestion && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L4.5 8.5L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {index === currentQuestion && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-text-inverse)'
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '12px',
                color: index <= currentQuestion ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                marginTop: '4px',
                fontWeight: index === currentQuestion ? 600 : 400
              }}>
                {index + 1}
              </span>
            </div>
          ))}
        </div>

        {/* 進捗率表示 */}
        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          marginTop: '8px'
        }}>
          進捗: {Math.round(progress)}%
        </div>
      </div>

      {/* 質問カード */}
      <div 
        key={currentQuestion}
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: 'var(--radius-2xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '24px',
          animation: 'slideIn 0.4s ease-out'
        }}
      >
        {/* 質問文 */}
        <div style={{
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: currentQ.subtitle ? '8px' : '0'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
              flex: 1
            }}>
              {currentQ.question}
            </h2>
            {currentQ.helpText && (
              <button
                onClick={() => setShowHelpText(!showHelpText)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: showHelpText ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '16px',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                aria-label="ヘルプを表示"
              >
                <span style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: showHelpText ? 'var(--color-text-inverse)' : 'var(--color-primary)'
                }}>
                  ℹ
                </span>
              </button>
            )}
          </div>
          
          {/* サブタイトル */}
          {currentQ.subtitle && (
            <p style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              margin: 0,
              marginTop: '4px'
            }}>
              {currentQ.subtitle}
            </p>
          )}
        </div>

        {/* ヘルプテキスト */}
        {showHelpText && currentQ.helpText && (
          <div style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderLeft: '4px solid var(--color-primary)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <p style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              margin: 0
            }}>
              {currentQ.helpText}
            </p>
          </div>
        )}

        {/* 選択肢 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {currentQ.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={isAnimating}
              style={{
                width: '100%',
                padding: '20px 24px',
                borderRadius: 'var(--radius-xl)',
                border: selectedOption === option.id ? '2px solid var(--color-primary)' : '2px solid var(--color-bg-tertiary)',
                backgroundColor: selectedOption === option.id ? 'var(--color-bg-accent)' : 'var(--color-bg-primary)',
                color: selectedOption === option.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
                fontSize: '16px',
                fontWeight: selectedOption === option.id ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                position: 'relative',
                animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
              }}
              onMouseEnter={(e) => {
                if (selectedOption !== option.id) {
                  e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedOption !== option.id) {
                  e.currentTarget.style.borderColor = 'var(--color-bg-tertiary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {option.emoji}
                </span>
                <div style={{
                  flex: 1
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: selectedOption === option.id ? 600 : 500,
                    marginBottom: option.description ? '4px' : '0'
                  }}>
                    {option.text}
                  </div>
                  {option.description && (
                    <div style={{
                      fontSize: '13px',
                      color: selectedOption === option.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      opacity: 0.8
                    }}>
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
              {selectedOption === option.id && (
                <svg 
                  style={{
                    position: 'absolute',
                    right: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px'
                  }}
                  viewBox="0 0 20 20" 
                  fill="none"
                >
                  <circle cx="10" cy="10" r="10" fill="var(--color-primary)" />
                  <path d="M6 10L8.5 12.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ナビゲーション */}
      <div style={{
        display: 'flex',
        justifyContent: currentQuestion > 0 ? 'space-between' : 'flex-end',
        alignItems: 'center',
        gap: '16px'
      }}>
        {currentQuestion > 0 && (
          <button
            onClick={handleBack}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--color-bg-tertiary)',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-secondary)',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            前の質問へ
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .question-card {
            padding: 24px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DiagnosisForm;
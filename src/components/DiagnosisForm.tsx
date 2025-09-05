import React, { useState } from 'react';

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

const questions: Question[] = [
  {
    id: 1,
    question: "あなたの年齢は？",
    options: [
      { id: "20s", text: "20代", emoji: "👶" },
      { id: "30s", text: "30代", emoji: "👨" },
      { id: "40s", text: "40代", emoji: "🧔" },
      { id: "50s", text: "50代", emoji: "👨‍🦳" },
      { id: "60plus", text: "60代以上", emoji: "👴" }
    ]
  },
  {
    id: 2,
    question: "月々の投資可能額は？",
    options: [
      { id: "under_10k", text: "～1万円", emoji: "💰" },
      { id: "10k_30k", text: "1万〜3万円", emoji: "💰💰" },
      { id: "30k_50k", text: "3万〜5万円", emoji: "💰💰💰" },
      { id: "50k_100k", text: "5万〜10万円", emoji: "💰💰💰💰" },
      { id: "over_100k", text: "10万円以上", emoji: "💰💰💰💰💰" }
    ]
  },
  {
    id: 3,
    question: "投資経験はありますか？",
    options: [
      { id: "beginner", text: "初心者", emoji: "🌱" },
      { id: "intermediate", text: "中級者", emoji: "📈" },
      { id: "advanced", text: "上級者", emoji: "🚀" }
    ]
  },
  {
    id: 4,
    question: "投資の目的は？",
    options: [
      { id: "retirement", text: "老後資金", emoji: "🏖️" },
      { id: "education", text: "教育資金", emoji: "🎓" },
      { id: "house", text: "住宅資金", emoji: "🏠" },
      { id: "wealth", text: "資産形成", emoji: "💎" },
      { id: "speculation", text: "投機", emoji: "🎰" }
    ]
  },
  {
    id: 5,
    question: "いつから始めたいですか？",
    options: [
      { id: "now", text: "すぐに", emoji: "⚡" },
      { id: "within_month", text: "1ヶ月以内", emoji: "🕐" },
      { id: "within_3months", text: "3ヶ月以内", emoji: "📅" },
      { id: "within_year", text: "1年以内", emoji: "📆" },
      { id: "not_sure", text: "まだ未定", emoji: "🤔" }
    ]
  }
];

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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
      } else {
        onComplete(newAnswers);
      }
    }, 400);
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(null);
    }
  };

  if (!currentQ) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      {/* Progress Section */}
      <div style={{
        marginBottom: '50px',
        textAlign: 'center'
      }}>
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#f1f5f9',
          borderRadius: '50px',
          overflow: 'hidden',
          marginBottom: '20px',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50px',
            width: `${progress}%`,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
          }}>
            {/* Animated shine effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'progressShine 2s infinite'
            }} />
          </div>
        </div>

        {/* Progress Text */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: '#64748b'
        }}>
          <span>質問 {currentQuestion + 1} / {questions.length}</span>
          <span>{Math.round(progress)}% 完了</span>
        </div>
      </div>

      {/* Question Card */}
      <div 
        key={currentQuestion}
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5)',
          marginBottom: '30px',
          animation: 'slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Question Header */}
        <div style={{
          marginBottom: '35px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            marginBottom: '20px',
            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
          }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'white'
            }}>
              {currentQuestion + 1}
            </span>
          </div>
          
          <h2 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700,
            color: '#1e293b',
            margin: 0,
            lineHeight: 1.3
          }}>
            {currentQ.question}
          </h2>
        </div>

        {/* Options */}
        <div style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
        }}>
          {currentQ.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={isAnimating}
              style={{
                width: '100%',
                padding: '24px',
                borderRadius: '20px',
                border: selectedOption === option.id 
                  ? '3px solid #667eea' 
                  : '2px solid #e2e8f0',
                backgroundColor: selectedOption === option.id 
                  ? 'rgba(102, 126, 234, 0.05)' 
                  : '#ffffff',
                color: selectedOption === option.id ? '#667eea' : '#334155',
                fontSize: '16px',
                fontWeight: selectedOption === option.id ? 700 : 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                animation: `slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
                boxShadow: selectedOption === option.id 
                  ? '0 10px 30px rgba(102, 126, 234, 0.2)' 
                  : '0 4px 15px rgba(0, 0, 0, 0.05)',
                transform: selectedOption === option.id ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (selectedOption !== option.id && !isAnimating) {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.02)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedOption !== option.id) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  fontSize: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '50px',
                  height: '50px',
                  borderRadius: '15px',
                  backgroundColor: selectedOption === option.id 
                    ? 'rgba(102, 126, 234, 0.1)' 
                    : '#f8fafc',
                  transition: 'all 0.3s ease'
                }}>
                  {option.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: selectedOption === option.id ? 700 : 600,
                    marginBottom: option.description ? '4px' : '0'
                  }}>
                    {option.text}
                  </div>
                  {option.description && (
                    <div style={{
                      fontSize: '14px',
                      color: selectedOption === option.id ? '#667eea' : '#64748b',
                      opacity: 0.8
                    }}>
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Selection indicator */}
              {selectedOption === option.id && (
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path 
                      d="M3 7L6 10L11 4" 
                      stroke="white" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: currentQuestion > 0 ? 'space-between' : 'flex-end',
        alignItems: 'center',
        gap: '20px'
      }}>
        {currentQuestion > 0 && (
          <button
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              borderRadius: '50px',
              border: '2px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#64748b',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.color = '#667eea';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            前の質問へ
          </button>
        )}

        <div style={{
          fontSize: '14px',
          color: '#64748b',
          textAlign: 'right',
          fontWeight: 500
        }}>
          選択すると自動で次へ進みます
        </div>
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translateY(-50%) scale(0.5);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        @keyframes progressShine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @media (max-width: 768px) {
          .diagnosis-form {
            padding: 20px 16px !important;
          }
          
          .question-card {
            padding: 24px 20px !important;
          }
          
          .options-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DiagnosisForm;
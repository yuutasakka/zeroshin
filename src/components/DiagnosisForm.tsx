import React, { useState } from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
  helpText?: string;
}

interface DiagnosisFormProps {
  onComplete: (answers: Record<number, string>) => void;
}

const questions: Question[] = [
  {
    id: 1,
    question: "年間収入レンジを教えてください",
    options: ["～300万円", "300～500万円", "500～800万円", "800万円～"],
    helpText: "年収は審査の重要ポイント。安定収入があれば低金利の選択肢が広がります。"
  },
  {
    id: 2,
    question: "普段の口座残高（現金＋預金）は？",
    options: ["～10万円", "10～50万円", "50～100万円", "100万円～"],
    helpText: "預金残高は返済能力の証明に。多いほど審査通過率がアップします。"
  },
  {
    id: 3,
    question: "現在の借入件数（クレジット含む）は？",
    options: ["0件", "1～2件", "3件以上"],
    helpText: "借入件数が少ないほど有利。3件以上は「おまとめ」も検討を。"
  },
  {
    id: 4,
    question: "月々の返済負担率は？",
    options: ["収入に対して返済が10%未満", "10～30%", "30%以上"],
    helpText: "返済負担率＝（毎月の借入返済合計）÷（月収）。30%以下が理想的です。"
  },
  {
    id: 5,
    question: "資金が必要な緊急度は？",
    options: ["今すぐ", "1週間以内", "1ヶ月以内"],
    helpText: "急ぎの場合は即日融資可能な業者を、余裕があれば低金利サービスを選べます。"
  }
];

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    setSelectedOption(answer);
    setIsAnimating(true);
    
    // 選択をアニメーション付きで記録
    setTimeout(() => {
      const newAnswers = { ...answers, [questions[currentQuestion].id]: answer };
      setAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setIsAnimating(false);
      } else {
        // 診断完了
        onComplete(newAnswers);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(null);
    }
  };

  return (
    <div className="diagnosis-form-container" style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInMobile {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 107, 53, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 107, 53, 0);
          }
        }
        
        @keyframes progressGlow {
          0%, 100% {
            box-shadow: 0 2px 10px rgba(255, 107, 53, 0.3);
          }
          50% {
            box-shadow: 0 2px 20px rgba(255, 107, 53, 0.5);
          }
        }

        .question-card {
          animation: slideIn 0.4s ease-out;
        }
        
        @media (max-width: 768px) {
          .question-card {
            animation: slideInMobile 0.4s ease-out;
          }
        }

        .option-button {
          transition: all 0.3s ease;
          transform: translateY(0);
          -webkit-tap-highlight-color: transparent;
        }

        .option-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        
        @media (hover: none) {
          .option-button:hover {
            transform: none;
          }
          
          .option-button:active {
            transform: scale(0.98);
          }
        }

        .option-button.selected {
          animation: pulse 0.5s ease-out;
        }

        .progress-fill {
          transition: width 0.5s ease-out;
          animation: progressGlow 2s ease-in-out infinite;
        }
        
        @media (max-width: 768px) {
          .diagnosis-form-container {
            padding: 1rem !important;
          }
          
          .question-card {
            padding: 2rem 1.5rem !important;
            margin-bottom: 1rem !important;
          }
          
          .option-button {
            padding: 1rem !important;
            font-size: 0.875rem !important;
          }
        }
      `}</style>

      {/* タイトルとプログレスバー */}
      <div style={{
        marginBottom: '3rem'
      }}>
        {/* 所要時間表示 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#fef3c7',
            color: '#f59e0b',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            <span>▶</span> 所要時間：30秒
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#627d98', fontWeight: 500 }}>
            質問 {currentQuestion + 1} / {questions.length}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#627d98', fontWeight: 500 }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div style={{
          height: '8px',
          backgroundColor: '#e4e4e7',
          borderRadius: '9999px',
          overflow: 'hidden'
        }}>
          <div 
            className="progress-fill"
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ff6b35 0%, #f35627 100%)',
              borderRadius: '9999px'
            }}
          />
        </div>
      </div>

      {/* 質問カード */}
      <div className="question-card" key={currentQuestion} style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '3rem',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#243b53',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {questions[currentQuestion].question}
        </h2>
        
        {/* ヘルプテキスト */}
        {questions[currentQuestion].helpText && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: '#f0f4f8',
            borderRadius: '0.75rem',
            border: '1px solid #e0e7ff'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '50%',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              ℹ
            </span>
            <p style={{
              fontSize: '0.875rem',
              color: '#4b5563',
              lineHeight: 1.5,
              margin: 0
            }}>
              {questions[currentQuestion].helpText}
            </p>
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className={`option-button ${selectedOption === option ? 'selected' : ''}`}
              style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                border: selectedOption === option 
                  ? '2px solid #ff6b35' 
                  : '2px solid #e4e4e7',
                background: selectedOption === option 
                  ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
                  : 'white',
                color: selectedOption === option 
                  ? '#ff6b35' 
                  : '#486581',
                fontSize: '1rem',
                fontWeight: selectedOption === option ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
              }}
              disabled={isAnimating}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>
                {option}
              </span>
              {selectedOption === option && (
                <svg 
                  style={{
                    position: 'absolute',
                    right: '1.25rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px'
                  }}
                  viewBox="0 0 24 24" 
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" fill="#ff6b35" />
                  <path 
                    d="M8 12l3 3 5-6" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div style={{
        display: 'flex',
        justifyContent: currentQuestion > 0 ? 'space-between' : 'center',
        alignItems: 'center'
      }}>
        {currentQuestion > 0 && (
          <button
            onClick={handleBack}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              border: '2px solid #e4e4e7',
              background: 'white',
              color: '#627d98',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ff6b35';
              e.currentTarget.style.color = '#ff6b35';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e4e4e7';
              e.currentTarget.style.color = '#627d98';
            }}
          >
            前の質問へ
          </button>
        )}
      </div>
    </div>
  );
};

export default DiagnosisForm;
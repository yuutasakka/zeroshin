import React, { useState } from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
}

interface DiagnosisFormProps {
  onComplete: (answers: Record<number, string>) => void;
}

const questions: Question[] = [
  {
    id: 1,
    question: "現在の年齢を教えてください",
    options: ["30歳未満", "30～34歳", "35～39歳", "40歳以上"]
  },
  {
    id: 2,
    question: "年収を教えてください",
    options: ["500万円未満", "500～700万円", "700～1000万円", "1000万円以上"]
  },
  {
    id: 3,
    question: "投資経験はありますか？",
    options: ["全くない", "少しある（1年未満）", "ある程度ある（1～3年）", "豊富にある（3年以上）"]
  },
  {
    id: 4,
    question: "投資の目的は何ですか？",
    options: ["老後の資産形成", "子供の教育資金", "住宅購入資金", "資産運用・増やしたい"]
  },
  {
    id: 5,
    question: "リスクに対する考え方は？",
    options: ["絶対に損したくない", "少しのリスクなら許容", "ある程度のリスクは許容", "高リスク高リターンを狙いたい"]
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

        .question-card {
          animation: slideIn 0.4s ease-out;
        }

        .option-button {
          transition: all 0.3s ease;
          transform: translateY(0);
        }

        .option-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .option-button.selected {
          animation: pulse 0.5s ease-out;
        }

        .progress-fill {
          transition: width 0.5s ease-out;
        }
      `}</style>

      {/* プログレスバー */}
      <div style={{
        marginBottom: '3rem'
      }}>
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
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {questions[currentQuestion].question}
        </h2>

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
import React, { useState, useEffect } from 'react';
import { measureTransition, PERF_TARGETS } from './PerformanceMonitor';

// 要件定義書準拠の診断質問データ
const diagnosisQuestions = [
  {
    id: 1,
    questionId: 'age',
    title: '1️⃣ あなたの年代をお選びください',
    type: 'radio',
    options: [
      { value: '20s', label: '20代（キャリア形成期）' },
      { value: '30s', label: '30代（資産形成期）' },
      { value: '40s', label: '40代（資産充実期）' },
      { value: '50s', label: '50代（資産保全期）' },
      { value: '60plus', label: '60代以上（運用期）' }
    ]
  },
  {
    id: 2,
    questionId: 'experience',
    title: '2️⃣ 投資経験はどの程度ですか？',
    type: 'radio',
    options: [
      { value: 'beginner', label: '🌱 初心者（投資未経験）' },
      { value: 'basic', label: '📚 基礎知識あり（勉強中）' },
      { value: 'experienced', label: '📊 経験者（運用実績あり）' }
    ]
  },
  {
    id: 3,
    questionId: 'purpose',
    title: '3️⃣ 投資の主な目的は？',
    type: 'radio',
    options: [
      { value: 'education', label: '🎓 教育資金の準備' },
      { value: 'housing', label: '🏠 住宅購入資金' },
      { value: 'retirement', label: '🏖️ 老後資金の確保' },
      { value: 'wealth', label: '📈 資産拡大・財産形成' }
    ]
  },
  {
    id: 4,
    questionId: 'amount',
    title: '4️⃣ 月の投資予算はいくらですか？',
    type: 'radio',
    options: [
      { value: 'less_10k', label: '1万円未満' },
      { value: '10k_30k', label: '1万円〜3万円' },
      { value: '30k_50k', label: '3万円〜5万円' },
      { value: '50k_100k', label: '5万円〜10万円' },
      { value: 'more_100k', label: '10万円以上' }
    ]
  },
  {
    id: 5,
    questionId: 'timing',
    title: '5️⃣ いつから運用を始めたいですか？',
    type: 'radio',
    options: [
      { value: 'now', label: '🚀 すぐに始めたい' },
      { value: 'within_month', label: '📅 1ヶ月以内' },
      { value: 'carefully', label: '⏳ じっくり検討してから' }
    ]
  }
];

// 6問目: 電話番号入力
const PHONE_QUESTION = {
  id: 6,
  questionId: 'phone',
  title: '6️⃣ ご連絡可能な携帯電話番号を入力してください',
  type: 'phone',
  options: [],
};

export interface DiagnosisAnswers {
  age?: string;
  experience?: string;
  purpose?: string;
  amount?: string;
  timing?: string;
  phone?: string;
}

interface DiagnosisFlowProps {
  onComplete: (answers: DiagnosisAnswers) => void;
  onCancel: () => void;
}

const CARD_STYLE: React.CSSProperties = {
  maxWidth: 380, // iPhone対応: 幅を縮小
  margin: '10px auto', // iPhone対応: マージンを縮小
  padding: '20px 16px', // iPhone対応: パディングを縮小
  borderRadius: 12, // iPhone対応: 角丸を縮小
  boxShadow: '0 2px 12px rgba(59, 130, 246, 0.1)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(59, 130, 246, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: 280, // iPhone対応: 高さを縮小
  transition: 'all 0.3s ease',
};
const PROGRESS_STYLE: React.CSSProperties = {
  width: '100%',
  height: 6, // iPhone対応: 高さを縮小
  borderRadius: 3,
  background: 'linear-gradient(90deg, #ffb6b9, #fae3d9)',
  marginBottom: 16, // iPhone対応: マージンを縮小
};
const QUESTION_STYLE: React.CSSProperties = {
  fontSize: 16, // iPhone対応: フォントサイズを縮小
  fontWeight: 600,
  marginBottom: 16, // iPhone対応: マージンを縮小
  textAlign: 'center',
  lineHeight: 1.4, // iPhone対応: 行間調整
};
const CHOICES_STYLE: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 12, // iPhone対応: ギャップを縮小
  marginBottom: 20, // iPhone対応: マージンを縮小
};
const CHOICE_BTN: React.CSSProperties = {
  fontSize: 14, // iPhone対応: フォントサイズを縮小
  padding: '12px 16px', // iPhone対応: パディングを縮小
  borderRadius: 8, // iPhone対応: 角丸を縮小
  border: '1px solid rgba(59, 130, 246, 0.2)',
  background: 'rgba(255, 255, 255, 0.8)',
  color: '#374151',
  fontWeight: 500,
  boxShadow: '0 1px 6px rgba(59, 130, 246, 0.05)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(5px)',
  textAlign: 'center' as const, // iPhone対応: テキスト中央揃え
  lineHeight: 1.3, // iPhone対応: 行間調整
};
const CHOICE_BTN_SELECTED: React.CSSProperties = {
  ...CHOICE_BTN,
  background: 'rgba(59, 130, 246, 0.1)',
  border: '2px solid #3b82f6',
  color: '#1e40af',
  fontWeight: 600,
  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.15)',
  transform: 'scale(1.02)',
};
const ACTIONS_STYLE: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
};
const ACTION_BTN: React.CSSProperties = {
  flex: 1,
  fontSize: 16,
  padding: '14px 20px',
  borderRadius: 12,
  border: '1px solid rgba(107, 114, 128, 0.3)',
  background: 'rgba(255, 255, 255, 0.8)',
  color: '#374151',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 8,
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(5px)',
};
const NEXT_BTN: React.CSSProperties = {
  ...ACTION_BTN,
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  color: '#ffffff',
  border: 'none',
  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
};

const DiagnosisFlow: React.FC<DiagnosisFlowProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<DiagnosisAnswers>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const totalSteps = diagnosisQuestions.length + 1; // 6問目まで
  const isPhoneStep = currentStep === 6;
  const currentQuestion = isPhoneStep ? PHONE_QUESTION : diagnosisQuestions.find(q => q.id === currentStep);

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (isPhoneStep) {
      // 電話番号バリデーション
      const sanitized = phoneInput.replace(/\D/g, '');
      if (!/^0\d{9,10}$/.test(sanitized)) {
        setPhoneError('正しい携帯電話番号を入力してください（例: 09012345678）');
        return;
      }
      setPhoneError('');
      const newAnswers = { ...answers, phone: sanitized };
      setAnswers(newAnswers);
      onComplete(newAnswers);
      return;
    }
    if (!selectedAnswer) {
      alert('選択肢を選んでください。');
      return;
    }
    // 現在の質問の答えを保存
    const newAnswers = { 
      ...answers, 
      [currentQuestion!.questionId]: selectedAnswer 
    };
    setAnswers(newAnswers);
    setSelectedAnswer('');
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep - 1 === 6) {
        setPhoneInput(answers.phone || '');
      } else {
        const prevQuestion = diagnosisQuestions.find(q => q.id === currentStep - 1);
        if (prevQuestion) {
          setSelectedAnswer(answers[prevQuestion.questionId as keyof DiagnosisAnswers] || '');
        }
      }
    }
  };

  useEffect(() => {
    const end = measureTransition('診断画面遷移', PERF_TARGETS.diagnosis);
    return end;
  }, []);

  if (!currentQuestion) return null;

  return (
    <>
      {/* iPhone専用CSS */}
      <style>{`
        /* iPhone対応レスポンシブスタイル */
        @media (max-width: 430px) {
          .diagnosis-card {
            max-width: 95% !important;
            margin: 5px auto !important;
            padding: 16px 12px !important;
            min-height: 250px !important;
          }
          .diagnosis-question {
            font-size: 14px !important;
            margin-bottom: 12px !important;
            line-height: 1.3 !important;
          }
          .diagnosis-choice {
            font-size: 13px !important;
            padding: 10px 12px !important;
            margin-bottom: 8px !important;
          }
          .diagnosis-phone-input {
            font-size: 16px !important;
            padding: 12px !important;
          }
          .diagnosis-button {
            font-size: 14px !important;
            padding: 10px 20px !important;
          }
        }
        
        @media (max-width: 375px) {
          .diagnosis-card {
            max-width: 98% !important;
            padding: 14px 10px !important;
          }
          .diagnosis-question {
            font-size: 13px !important;
          }
          .diagnosis-choice {
            font-size: 12px !important;
            padding: 8px 10px !important;
          }
        }
      `}</style>
      
      <div style={CARD_STYLE} className="diagnosis-card">
      <div style={PROGRESS_STYLE}>
        <div style={{
          width: `${((currentStep) / totalSteps) * 100}%`,
          height: '100%',
          borderRadius: 4,
          background: 'linear-gradient(90deg, #ffb6b9, #fae3d9)',
        }} />
      </div>
      <div style={QUESTION_STYLE} className="diagnosis-question">{currentQuestion.title}</div>
      <div style={CHOICES_STYLE}>
        {isPhoneStep ? (
          <>
            <input
              type="tel"
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="09012345678"
              style={{
                width: '100%',
                fontSize: 18,
                padding: '14px',
                borderRadius: 12,
                border: '1px solid #ccc',
                marginBottom: 8,
                textAlign: 'center',
              }}
              className="diagnosis-phone-input"
              maxLength={11}
            />
            {phoneError && <div style={{ color: 'red', fontSize: 14 }}>{phoneError}</div>}
            <div style={{ 
              color: '#2563eb', 
              fontSize: 14, 
              marginTop: 10,
              fontWeight: 500,
              backgroundColor: '#eff6ff',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe'
            }}>
              💬 診断結果を送信する電話番号を認証するためのコードを送信します
            </div>
          </>
        ) : (
          currentQuestion.options.map((option) => (
            <button
              key={option.value}
              style={selectedAnswer === option.value ? CHOICE_BTN_SELECTED : CHOICE_BTN}
              className="diagnosis-choice"
              onClick={() => handleAnswerSelect(option.value)}
            >
              {option.label}
            </button>
          ))
        )}
      </div>
      <div style={ACTIONS_STYLE}>
        <button style={ACTION_BTN} className="diagnosis-button" onClick={handlePrevious}>← 戻る</button>
        <button style={NEXT_BTN} className="diagnosis-button" onClick={handleNext} disabled={isPhoneStep ? phoneInput.length < 10 : !selectedAnswer}>次へ →</button>
      </div>
    </div>
    </>
  );
};

export default DiagnosisFlow; 
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
      { value: '60s_plus', label: '60代以上（運用期）' }
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
      { value: 'under_10k', label: '1万円未満' },
      { value: '10k_30k', label: '1万円〜3万円' },
      { value: '30k_50k', label: '3万円〜5万円' },
      { value: '50k_100k', label: '5万円〜10万円' },
      { value: 'over_100k', label: '10万円以上' }
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

export interface DiagnosisAnswers {
  age?: string;
  experience?: string;
  purpose?: string;
  amount?: string;
  timing?: string;
}

interface DiagnosisFlowProps {
  onComplete: (answers: DiagnosisAnswers) => void;
  onCancel: () => void;
}

const CARD_STYLE: React.CSSProperties = {
  maxWidth: 400,
  margin: '40px auto',
  padding: '32px 24px',
  borderRadius: 24,
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  background: 'linear-gradient(135deg, #fff 60%, #ffe0e9 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: 340,
};
const PROGRESS_STYLE: React.CSSProperties = {
  width: '100%',
  height: 8,
  borderRadius: 4,
  background: 'linear-gradient(90deg, #ffb6b9, #fae3d9)',
  marginBottom: 24,
};
const QUESTION_STYLE: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 24,
  textAlign: 'center',
};
const CHOICES_STYLE: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  marginBottom: 32,
};
const CHOICE_BTN: React.CSSProperties = {
  fontSize: 18,
  padding: '18px 0',
  borderRadius: 16,
  border: 'none',
  background: 'linear-gradient(90deg, #fcb69f 0%, #ffdde1 100%)',
  color: '#333',
  fontWeight: 500,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  cursor: 'pointer',
  transition: 'all 0.2s',
};
const CHOICE_BTN_SELECTED: React.CSSProperties = {
  ...CHOICE_BTN,
  background: 'linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%)',
  color: '#222',
  fontWeight: 700,
  boxShadow: '0 4px 16px rgba(33,150,243,0.10)',
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
  padding: '14px 0',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(90deg, #fcb69f 0%, #ffdde1 100%)',
  color: '#333',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 8,
  transition: 'all 0.2s',
};
const NEXT_BTN: React.CSSProperties = {
  ...ACTION_BTN,
  background: 'linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%)',
  color: '#222',
};

const DiagnosisFlow: React.FC<DiagnosisFlowProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<DiagnosisAnswers>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const currentQuestion = diagnosisQuestions.find(q => q.id === currentStep);
  const totalSteps = diagnosisQuestions.length;

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
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

    if (currentStep < totalSteps) {
      // 次の質問へ
      setCurrentStep(currentStep + 1);
      setSelectedAnswer('');
    } else {
      // 診断完了
      onComplete(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // 前の質問の答えを復元
      const prevQuestion = diagnosisQuestions.find(q => q.id === currentStep - 1);
      if (prevQuestion) {
        setSelectedAnswer(answers[prevQuestion.questionId as keyof DiagnosisAnswers] || '');
      }
    }
  };

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const end = measureTransition('診断画面遷移', PERF_TARGETS.diagnosis);
      return end;
    }
  }, []);

  if (!currentQuestion) {
    return null;
  }

  return (
    <div style={CARD_STYLE}>
      <div style={PROGRESS_STYLE}>
        <div style={{
          width: `${((currentStep) / totalSteps) * 100}%`,
          height: '100%',
          borderRadius: 4,
          background: 'linear-gradient(90deg, #ffb6b9, #fae3d9)',
        }} />
      </div>
      <div style={QUESTION_STYLE}>{currentQuestion.title}</div>
      <div style={CHOICES_STYLE}>
        {currentQuestion.options.map((option) => (
          <button
            key={option.value}
            style={selectedAnswer === option.value ? CHOICE_BTN_SELECTED : CHOICE_BTN}
            onClick={() => handleAnswerSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div style={ACTIONS_STYLE}>
        <button style={ACTION_BTN} onClick={handlePrevious}>← 戻る</button>
        <button style={NEXT_BTN} onClick={handleNext} disabled={!selectedAnswer}>次へ →</button>
      </div>
    </div>
  );
};

export default DiagnosisFlow; 
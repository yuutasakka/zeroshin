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
    <section className="py-10 md:py-24">
      <div className="max-w-lg mx-auto px-4">
        <div className="rounded-2xl bg-white shadow-2xl px-6 py-10 flex flex-col items-center">
          
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-200 rounded-full mb-6">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-orange-400 transition-all duration-300"
              style={{ width: `${((currentStep) / totalSteps) * 100}%` }}
            />
          </div>
          
          {/* Question Title */}
          <h2 className="text-xl md:text-2xl font-semibold text-blue-700 text-center mb-6">
            {currentQuestion.title}
          </h2>
          
          {/* Choices or Phone Input */}
          <div className="w-full flex flex-col space-y-3 mb-6">
            {isPhoneStep ? (
              <>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={e => {
                    // 全角数字を半角数字に変換
                    const halfWidthValue = e.target.value.replace(/[０-９]/g, (match) => {
                      return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
                    });
                    // 数字のみに制限
                    setPhoneInput(halfWidthValue.replace(/[^0-9]/g, ''));
                  }}
                  placeholder="09012345678"
                  className="w-full text-lg px-4 py-4 rounded-lg border border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={11}
                />
                {phoneError && (
                  <div className="text-red-600 text-sm text-center">{phoneError}</div>
                )}
                <div className="text-blue-600 text-sm font-medium bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                  💬 診断結果を送信する電話番号を認証するためのコードを送信します
                </div>
              </>
            ) : (
              currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  className={`w-full min-h-[56px] rounded-lg border px-6 py-3 text-base md:text-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    selectedAnswer === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-200 scale-105'
                      : 'border-blue-200 bg-white text-gray-800 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  onClick={() => handleAnswerSelect(option.value)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="w-full flex flex-col md:flex-row gap-4">
            <button 
              className="flex-1 md:w-1/2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              onClick={handlePrevious}
            >
              ← 戻る
            </button>
            <button 
              className="flex-1 md:w-1/2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onClick={handleNext} 
              disabled={isPhoneStep ? phoneInput.length < 10 : !selectedAnswer}
            >
              次へ →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiagnosisFlow; 
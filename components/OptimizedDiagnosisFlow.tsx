import React, { useState, useEffect } from 'react';
import { measureTransition, PERF_TARGETS } from './PerformanceMonitor';

// 最適化された診断データ構造
export interface OptimizedDiagnosisAnswers {
  ageAndExperience?: string; // 年代と経験を統合
  purposeAndBudget?: string;  // 目的と予算を統合
  phoneNumber?: string;
  quickDiagnosis?: boolean;   // クイック診断フラグ
}

interface OptimizedDiagnosisFlowProps {
  onComplete: (answers: OptimizedDiagnosisAnswers) => void;
  onCancel: () => void;
}

// ペルソナベースのクイック診断オプション
const quickDiagnosisProfiles = [
  {
    id: 'young-beginner',
    icon: '🌱',
    title: '投資デビュー',
    subtitle: '20-30代・初心者',
    description: '少額から始めたい',
    data: {
      ageAndExperience: '20s-30s-beginner',
      purposeAndBudget: 'wealth-less_30k'
    }
  },
  {
    id: 'family-planner',
    icon: '👨‍👩‍👧',
    title: '家族の未来',
    subtitle: '30-40代・教育資金',
    description: '子供の将来に備えたい',
    data: {
      ageAndExperience: '30s-40s-basic',
      purposeAndBudget: 'education-30k_50k'
    }
  },
  {
    id: 'retirement-prep',
    icon: '🏖️',
    title: '老後の安心',
    subtitle: '40-50代・老後準備',
    description: 'セカンドライフの準備',
    data: {
      ageAndExperience: '40s-50s-experienced',
      purposeAndBudget: 'retirement-50k_100k'
    }
  },
  {
    id: 'wealth-builder',
    icon: '💎',
    title: '資産形成',
    subtitle: '全年代・資産拡大',
    description: '本格的な資産運用',
    data: {
      ageAndExperience: '30s-50s-experienced',
      purposeAndBudget: 'wealth-more_100k'
    }
  }
];

const OptimizedDiagnosisFlow: React.FC<OptimizedDiagnosisFlowProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: クイック選択, 1-3: 詳細診断
  const [answers, setAnswers] = useState<OptimizedDiagnosisAnswers>({});
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showQuickDiagnosis, setShowQuickDiagnosis] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  
  // アニメーション用
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 電話番号の自動フォーマット
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneNumberChange = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      setPhoneInput(formatPhoneNumber(numbers));
      setPhoneError('');
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return /^(090|080|070)\d{8}$/.test(numbers);
  };

  // クイック診断の選択
  const handleQuickDiagnosis = async (profile: typeof quickDiagnosisProfiles[0]) => {
    setIsTransitioning(true);
    setSelectedProfile(profile.id);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setAnswers({
      ...profile.data,
      quickDiagnosis: true
    });
    setCurrentStep(3); // 電話番号入力へ直接ジャンプ
    setShowQuickDiagnosis(false);
    setIsTransitioning(false);
  };

  // 詳細診断開始
  const startDetailedDiagnosis = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowQuickDiagnosis(false);
      setCurrentStep(1);
      setIsTransitioning(false);
    }, 300);
  };

  // 診断完了
  const handleComplete = () => {
    if (!validatePhoneNumber(phoneInput)) {
      setPhoneError('正しい電話番号を入力してください');
      return;
    }
    
    const finalAnswers = {
      ...answers,
      phoneNumber: phoneInput.replace(/\D/g, '')
    };
    
    onComplete(finalAnswers);
  };

  // ステップ1: 年代と経験
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">
        あなたについて教えてください
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">年代</label>
          <div className="space-y-3">
            {['20代', '30代', '40代', '50代', '60代以上'].map((age) => (
              <button
                key={age}
                className="w-full p-4 text-left rounded-xl border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group"
                onClick={() => setAnswers(prev => ({ ...prev, ageAndExperience: `${age}-${prev.ageAndExperience?.split('-')[1] || ''}` }))}
              >
                <span className="font-medium">{age}</span>
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {age === '20代' ? '🌱' : age === '30代' ? '🏃' : age === '40代' ? '💼' : age === '50代' ? '🎯' : '🏆'}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">投資経験</label>
          <div className="space-y-3">
            {[
              { value: 'beginner', label: '初心者', icon: '🔰', desc: 'これから始めたい' },
              { value: 'basic', label: '勉強中', icon: '📚', desc: '基礎知識あり' },
              { value: 'experienced', label: '経験者', icon: '📊', desc: '運用実績あり' }
            ].map((exp) => (
              <button
                key={exp.value}
                className="w-full p-4 text-left rounded-xl border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                onClick={() => {
                  const age = answers.ageAndExperience?.split('-')[0] || '';
                  setAnswers(prev => ({ ...prev, ageAndExperience: `${age}-${exp.value}` }));
                  setTimeout(() => setCurrentStep(2), 300);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{exp.label}</div>
                    <div className="text-sm text-gray-500">{exp.desc}</div>
                  </div>
                  <span className="text-2xl">{exp.icon}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ステップ2: 目的と予算
  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">
        投資の目的と予算を教えてください
      </h3>
      
      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">投資の目的</label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'education', label: '教育資金', icon: '🎓' },
              { value: 'housing', label: '住宅資金', icon: '🏠' },
              { value: 'retirement', label: '老後資金', icon: '🏖️' },
              { value: 'wealth', label: '資産拡大', icon: '💎' }
            ].map((purpose) => (
              <button
                key={purpose.value}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  answers.purposeAndBudget?.startsWith(purpose.value)
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const budget = answers.purposeAndBudget?.split('-')[1] || '';
                  setAnswers(prev => ({ ...prev, purposeAndBudget: `${purpose.value}-${budget}` }));
                }}
              >
                <div className="text-3xl mb-2">{purpose.icon}</div>
                <div className="font-medium">{purpose.label}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">月々の投資予算</label>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
              onChange={(e) => {
                const value = parseInt(e.target.value);
                let budget = 'less_10k';
                if (value >= 80) budget = 'more_100k';
                else if (value >= 60) budget = '50k_100k';
                else if (value >= 40) budget = '30k_50k';
                else if (value >= 20) budget = '10k_30k';
                
                const purpose = answers.purposeAndBudget?.split('-')[0] || '';
                setAnswers(prev => ({ ...prev, purposeAndBudget: `${purpose}-${budget}` }));
              }}
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>1万円未満</span>
              <span>1-3万円</span>
              <span>3-5万円</span>
              <span>5-10万円</span>
              <span>10万円以上</span>
            </div>
          </div>
          
          {answers.purposeAndBudget && (
            <button
              className="w-full mt-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => setCurrentStep(3)}
            >
              次へ進む
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ステップ3: 電話番号
  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          最後のステップ
        </h3>
        <p className="text-gray-600">
          診断結果をお届けするための電話番号を入力してください
        </p>
      </div>
      
      <div className="max-w-md mx-auto space-y-6">
        <div className="relative">
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => handlePhoneNumberChange(e.target.value)}
            placeholder="090-1234-5678"
            className={`w-full text-xl px-6 py-4 rounded-xl border-2 text-center font-mono tracking-wider transition-all duration-200 ${
              phoneError ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
            }`}
            maxLength={13}
          />
          {phoneInput.length > 0 && (
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${
              validatePhoneNumber(phoneInput) ? 'text-green-500' : 'text-gray-400'
            }`}>
              {validatePhoneNumber(phoneInput) ? '✅' : '📱'}
            </div>
          )}
        </div>
        
        {phoneError && (
          <p className="text-red-600 text-sm text-center">{phoneError}</p>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 text-center">
            <span className="font-medium">🔒 セキュアな認証</span><br />
            SMS認証で本人確認を行い、安全に結果をお届けします
          </p>
        </div>
        
        <button
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          onClick={handleComplete}
          disabled={!validatePhoneNumber(phoneInput)}
        >
          診断を完了する
        </button>
      </div>
    </div>
  );

  // クイック診断選択画面
  const renderQuickDiagnosis = () => (
    <div className={`space-y-8 ${isTransitioning ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          ⚡ 30秒で完了する資産診断
        </h2>
        <p className="text-lg text-gray-600">
          あなたに近いプロフィールを選ぶだけで、最適な投資プランをご提案
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {quickDiagnosisProfiles.map((profile) => (
          <button
            key={profile.id}
            className={`p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              selectedProfile === profile.id
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105 shadow-xl'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
            onClick={() => handleQuickDiagnosis(profile)}
          >
            <div className="text-4xl mb-3">{profile.icon}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">{profile.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{profile.subtitle}</p>
            <p className="text-xs text-gray-500">{profile.description}</p>
          </button>
        ))}
      </div>
      
      <div className="text-center">
        <button
          className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors duration-200"
          onClick={startDetailedDiagnosis}
        >
          もっと詳しく診断する →
        </button>
      </div>
    </div>
  );

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* プログレスバー */}
        {!showQuickDiagnosis && currentStep > 0 && (
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>基本情報</span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>投資プラン</span>
              <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>連絡先</span>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {showQuickDiagnosis && renderQuickDiagnosis()}
          {!showQuickDiagnosis && currentStep === 1 && renderStep1()}
          {!showQuickDiagnosis && currentStep === 2 && renderStep2()}
          {!showQuickDiagnosis && currentStep === 3 && renderStep3()}
          
          {/* 戻るボタン */}
          {!showQuickDiagnosis && currentStep > 0 && (
            <div className="mt-8 text-center">
              <button
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                onClick={() => {
                  if (currentStep === 1) {
                    setShowQuickDiagnosis(true);
                    setCurrentStep(0);
                  } else {
                    setCurrentStep(currentStep - 1);
                  }
                }}
              >
                ← 戻る
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: none;
        }
      `}</style>
    </section>
  );
};

export default OptimizedDiagnosisFlow;
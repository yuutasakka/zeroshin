
import React, { useState, useEffect } from 'react';
import { DiagnosisQuestion, DiagnosisStep, DiagnosisFormState } from '../types';

const diagnosisStepsData: DiagnosisStep[] = [
  {
    step: 1,
    question: {
      id: 'age', type: 'select', label: 'あなたの年代をお選びください', emojiPrefix: '1.',
      options: [
        { value: '20s', label: '20代（キャリア形成期）'},
        { value: '30s', label: '30代（資産形成期）'},
        { value: '40s', label: '40代（資産充実期）'},
        { value: '50s', label: '50代（資産保全期）'},
        { value: '60plus', label: '60代以上（運用期）'},
      ],
    },
  },
  {
    step: 2,
    question: {
      id: 'experience', type: 'radio', label: '投資経験はどの程度ですか？', emojiPrefix: '2.',
      radioOptions: [
        { value: 'beginner', label: '初心者（投資未経験）', emojiPrefix: 'fas fa-seedling' },
        { value: 'studied', label: '基礎知識あり（勉強中）', emojiPrefix: 'fas fa-book' },
        { value: 'experienced', label: '経験者（運用実績あり）', emojiPrefix: 'fas fa-chart-bar' },
      ],
    },
  },
  {
    step: 3,
    question: {
      id: 'purpose', type: 'radio', label: '投資の主な目的は？', emojiPrefix: '3.',
      radioOptions: [
        { value: 'education', label: '教育資金の準備', emojiPrefix: 'fas fa-graduation-cap' },
        { value: 'home', label: '住宅購入資金', emojiPrefix: 'fas fa-home' },
        { value: 'retirement', label: '老後資金の確保', emojiPrefix: 'fas fa-umbrella-beach' }, // Changed icon for better fit
        { value: 'increase_assets', label: '資産拡大・財産形成', emojiPrefix: 'fas fa-arrow-trend-up' },
      ],
    },
  },
  {
    step: 4,
    question: {
      id: 'amount', type: 'select', label: '月の投資予算はいくらですか？', emojiPrefix: '4.',
      options: [
        { value: 'less_10k', label: '1万円未満' },
        { value: '10k_30k', label: '1万円〜3万円' },
        { value: '30k_50k', label: '3万円〜5万円' },
        { value: '50k_100k', label: '5万円〜10万円' },
        { value: 'more_100k', label: '10万円以上' },
      ],
    },
  },
  {
    step: 5,
    question: {
      id: 'timing', type: 'radio', label: 'いつから運用を始めたいですか？', emojiPrefix: '5.',
      radioOptions: [
        { value: 'now', label: 'すぐに始めたい', emojiPrefix: 'fas fa-rocket' },
        { value: 'month', label: '1ヶ月以内', emojiPrefix: 'fas fa-calendar-alt' },
        { value: 'later', label: 'じっくり検討してから', emojiPrefix: 'fas fa-hourglass-half' },
      ],
    },
  },
  {
    step: 6, // AI同意後にこのステップへ
    question: {
      id: 'phoneNumber', type: 'tel', label: '認証コード送付用の電話番号をご入力ください', emojiPrefix: '📞', placeholder: '例: 09012345678'
    },
  }
];

const AI_CONSENT_STEP = 5; 

interface MainVisualAndDiagnosisProps {
  onProceedToVerification: (phoneNumber: string, formData: DiagnosisFormState) => void;
}

const MainVisualAndDiagnosis: React.FC<MainVisualAndDiagnosisProps> = ({ onProceedToVerification }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<DiagnosisFormState>({});
  const [showAIConsent, setShowAIConsent] = useState<boolean>(false);

  const totalSteps = diagnosisStepsData.length; 
  const currentQuestionData = diagnosisStepsData.find(s => s.step === currentStep)?.question;

  const handleInputChange = (questionId: string, value: string) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));
  };

  const validateCurrentStep = (): boolean => {
    if (currentQuestionData && !formData[currentQuestionData.id] && currentQuestionData.type !== 'tel') { // Tel can be empty initially for validation message
      alert('現在の質問にご回答ください。');
      return false;
    }
    if (currentQuestionData?.id === 'phoneNumber' && formData[currentQuestionData.id]) {
        const phoneNumber = formData[currentQuestionData.id].replace(/\D/g, ''); 
        if (!/^\d{10,11}$/.test(phoneNumber)) { 
             alert('有効な電話番号（10桁または11桁）を入力してください。（例: 09012345678）');
             return false;
        }
    } else if (currentQuestionData?.id === 'phoneNumber' && !formData[currentQuestionData.id]){
        alert('電話番号を入力してください。');
        return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }
    
    if (currentStep === AI_CONSENT_STEP && !showAIConsent) { 
      setShowAIConsent(true); 
    } else if (currentStep < totalSteps) { 
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleAgreeToAIConsent = () => {
    setShowAIConsent(false);
    setCurrentStep(prev => prev + 1); 
  };

  const handleReturnFromConsent = () => {
    setShowAIConsent(false); 
  };

  const handleSendVerificationCode = async () => { 
    if (!validateCurrentStep()) {
      return;
    }
    
    if (formData.phoneNumber) {
      try {
        // SMS送信APIを呼び出し
        const response = await fetch('http://localhost:8080/api/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: formData.phoneNumber
          }),
        });

        const result = await response.json();

        if (result.success) {
                  // 認証コードの表示
        if (result.demoCode) {
          alert(`認証コード: ${result.demoCode}`);
        }
          
          // 認証ページに進む
          onProceedToVerification(formData.phoneNumber, formData);
        } else {
          alert('SMS送信に失敗しました: ' + result.error);
        }
      } catch (error) {
        console.error('SMS送信エラー:', error);
        alert('サーバーとの通信に失敗しました。サーバーが起動しているか確認してください。');
      }
    }
  };
  
  let progressPercentage;
  if (showAIConsent) {
    progressPercentage = (AI_CONSENT_STEP / totalSteps) * 100;
  } else {
    progressPercentage = (currentStep / totalSteps) * 100;
  }
  
  return (
    <section id="main-visual-section" className="hero-section-premium py-20 px-4">
      <div className="hero-content max-w-7xl mx-auto text-center">
        <h2 className="heading-display text-6xl md:text-8xl mb-8 font-bold leading-tight" 
            style={{ 
              color: '#f8fafc',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(0, 0, 0, 0.8)',
              letterSpacing: '0.02em'
            }}>
            あなたの資産運用を<br />
            <span style={{ 
              color: '#fbbf24',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)',
              fontWeight: '800'
            }}>プロフェッショナル</span>が<br />
            完全サポート
        </h2>
        <p className="text-xl md:text-2xl mb-12 text-gray-200 max-w-3xl mx-auto leading-relaxed">
            経験豊富なファイナンシャルプランナーが、あなただけの投資戦略を無料でご提案。
            安心して始められる資産運用の第一歩を踏み出しませんか。
        </p>
          
        <div id="diagnosis-form-section" className="luxury-card max-w-2xl mx-auto mb-16 text-left"> {/* text-left for card content */}
            <h3 className="heading-primary text-2xl mb-2 text-center">
                <i className="fas fa-chart-line mr-3" style={{color: 'var(--accent-gold)'}}></i>
                あなた専用の投資プラン診断
            </h3>
            <p className="text-luxury mb-8 text-center">3分で完了する簡単診断</p>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold" style={{color: 'var(--neutral-600)'}}>進捗状況</span>
                    <span className="text-sm" style={{color: 'var(--neutral-600)'}}>
                        <span id="currentStepDisplay">{showAIConsent ? AI_CONSENT_STEP : currentStep}</span>/{totalSteps}
                    </span>
                </div>
                <div className="luxury-progress">
                    <div className="luxury-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>
              
              {showAIConsent ? (
                 <div className="question-step p-6 rounded-lg shadow-inner my-4 text-left" style={{background: 'var(--neutral-50)'}}>
                    <h4 className="heading-primary text-xl mb-3 flex items-center">
                        <i className="fas fa-microchip mr-2 text-xl" style={{color: 'var(--accent-gold)'}}></i>
                         AIによる結果生成について
                    </h4>
                    <p className="text-luxury mb-3 text-sm">
                        ご入力いただいた内容に基づき、AI (Gemini) を活用してあなたにパーソナライズされた診断結果を生成します。
                    </p>
                    <p className="text-luxury mb-5 text-sm">
                        結果の生成には、AIの利用にご同意いただく必要がございます。同意して進むと、認証コード送付用のお電話番号入力画面が表示されます。
                    </p>
                    <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handleAgreeToAIConsent}
                        className="premium-button gold-accent-button w-full"
                    >
                        <i className="fas fa-check mr-2"></i>
                        同意して電話番号入力へ
                    </button>
                    <button
                        type="button"
                        onClick={handleReturnFromConsent}
                        className="premium-button w-full"
                        style={{background: 'var(--neutral-200)', color: 'var(--neutral-700)'}}
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        診断に戻る
                    </button>
                    </div>
                </div>
              ) : currentQuestionData && (
                <div className="question-step" data-step={currentStep}>
                  <label htmlFor={currentQuestionData.id} className="block text-left font-semibold mb-4" style={{color: 'var(--neutral-700)'}}>
                    <span className="font-bold mr-2">{currentQuestionData.emojiPrefix}</span> {currentQuestionData.label}
                  </label>
                  {currentQuestionData.type === 'select' && currentQuestionData.options && (
                    <select
                      id={currentQuestionData.id}
                      value={formData[currentQuestionData.id] || ''}
                      onChange={(e) => handleInputChange(currentQuestionData.id, e.target.value)}
                      className="luxury-input luxury-select w-full"
                      required
                    >
                      <option value="" disabled>選択してください</option>
                      {currentQuestionData.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} {opt.emojiSuffix || ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {currentQuestionData.type === 'radio' && currentQuestionData.radioOptions && (
                    <div className="space-y-3">
                      {currentQuestionData.radioOptions.map(opt => (
                        <label key={opt.value} htmlFor={`${currentQuestionData.id}-${opt.value}`} className="radio-option">
                          <input
                            type="radio"
                            id={`${currentQuestionData.id}-${opt.value}`}
                            name={currentQuestionData.id}
                            value={opt.value}
                            checked={formData[currentQuestionData.id] === opt.value}
                            onChange={(e) => handleInputChange(currentQuestionData.id, e.target.value)}
                            required
                            className="sr-only" // sr-only to hide, custom style will show check
                          />
                          <div className="radio-option-content">
                            {opt.emojiPrefix && <i className={`${opt.emojiPrefix} mr-3`}></i>} {/* Removed inline style */}
                            <span>{opt.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  {currentQuestionData.type === 'tel' && (
                    <input
                      type="tel"
                      id={currentQuestionData.id}
                      value={formData[currentQuestionData.id] || ''}
                      onChange={(e) => handleInputChange(currentQuestionData.id, e.target.value)}
                      placeholder={currentQuestionData.placeholder || ''}
                      className="luxury-input w-full"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                    />
                  )}
                </div>
              )}
              
              {!showAIConsent && (
                <div className="pt-2">
                    {currentStep < AI_CONSENT_STEP && ( 
                    <button
                        type="button"
                        onClick={handleNextStep}
                        className="premium-button w-full text-lg"
                    >
                        <i className="fas fa-arrow-right mr-2"></i>
                        次へ進む
                    </button>
                    )}
                     {currentStep === AI_CONSENT_STEP && ( 
                    <button
                        type="button"
                        onClick={handleNextStep} 
                        className="premium-button gold-accent-button w-full text-lg"
                    >
                        <i className="fas fa-brain mr-2"></i>
                        回答完了！AI利用に同意する
                    </button>
                    )}
                    
                    {currentStep === totalSteps && ( 
                    <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        className="premium-button emerald-accent-button w-full text-lg"
                    >
                        <i className="fas fa-paper-plane mr-2"></i>
                         認証コードを送信する
                    </button>
                    )}
                </div>
              )}
            </form>
            
             <p className="text-sm mt-8 text-center" style={{color: 'var(--neutral-500)'}}>
                <i className="fas fa-shield-alt mr-2" style={{color: 'var(--accent-emerald)'}}></i>
                お客様の情報は厳重に保護され、営業電話は一切ございません。
            </p>
             <p className="text-xs text-center mt-2" style={{color: 'var(--neutral-600)'}}>
                ※ご入力いただいた情報は、診断結果の送付および関連サービスのご案内にのみ利用いたします。利用規約・プライバシーポリシーにご同意の上、ご利用ください。
            </p>
          </div>
        </div>
    </section>
  );
};

export default MainVisualAndDiagnosis;
import React, { useState, useEffect } from 'react';
import { DiagnosisQuestion, DiagnosisStep, DiagnosisFormState } from '../types';
import { MainVisualData, defaultMainVisualData } from '../data/homepageContentData';
import { secureLog } from '../security.config';
import { createSupabaseClient } from './adminUtils';
import { diagnosisManager } from './supabaseClient';

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
  const [mainVisualData, setMainVisualData] = useState<MainVisualData>(defaultMainVisualData);

  useEffect(() => {
    loadMainVisualFromSupabase();
  }, []);

  const loadMainVisualFromSupabase = async () => {
    try {
      // まずローカルストレージを確認
      const localMainVisualData = localStorage.getItem('customMainVisualData');
      if (localMainVisualData) {
        try {
          const parsedLocal = JSON.parse(localMainVisualData);
          setMainVisualData(parsedLocal);
          secureLog('ローカルストレージからメインビジュアルデータを読み込み');
          return;
        } catch (parseError) {
          secureLog('ローカルストレージのメインビジュアルデータ解析エラー:', parseError);
        }
      }

      const supabaseConfig = createSupabaseClient();
      
      // 本番環境でSupabase設定がない場合はデフォルトデータを使用
      if (!supabaseConfig.url || !supabaseConfig.key) {
        secureLog('⚠️ MainVisual: Supabase設定なし：デフォルトデータを使用');
        return;
      }

      // Supabaseから取得を試行
      const response = await fetch(`${supabaseConfig.url}/rest/v1/homepage_content_settings?setting_key.eq=main_visual_data&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0].setting_data) {
          const mainVisualDataFromSupabase = data[0].setting_data;
          setMainVisualData(mainVisualDataFromSupabase);
          // Supabaseデータをローカルストレージにバックアップ
          localStorage.setItem('customMainVisualData', JSON.stringify(mainVisualDataFromSupabase));
          secureLog('✅ メインビジュアルデータをSupabaseから読み込み、ローカルにバックアップ:', mainVisualDataFromSupabase);
          return;
        }
      } else {
        secureLog(`メインビジュアルデータの読み込みに失敗 ${response.status}、デフォルトデータを使用`);
      }

      // サンプルデータフォールバック
      const sampleMainVisualData = localStorage.getItem('main_visual_data');
      if (sampleMainVisualData) {
        try {
          const parsedSample = JSON.parse(sampleMainVisualData);
          setMainVisualData(parsedSample);
          secureLog('サンプルメインビジュアルデータを使用');
          return;
        } catch (parseError) {
          secureLog('サンプルメインビジュアルデータ解析エラー:', parseError);
        }
      }

      secureLog('デフォルトメインビジュアルデータを使用');
    } catch (error) {
      secureLog('メインビジュアルデータ読み込みエラー、フォールバック処理中:', error);
      
      // エラー時でもローカルストレージを確認
      try {
        const fallbackMainVisualData = localStorage.getItem('customMainVisualData');
        if (fallbackMainVisualData) {
          const parsedFallback = JSON.parse(fallbackMainVisualData);
          setMainVisualData(parsedFallback);
          secureLog('エラー時フォールバック: ローカルストレージからメインビジュアルデータを読み込み');
          return;
        }
      } catch (fallbackError) {
        secureLog('フォールバックメインビジュアルデータエラー:', fallbackError);
      }

      // 最終的にはデフォルトデータを使用（エラーを表示しない）
      secureLog('最終フォールバック: デフォルトメインビジュアルデータを使用');
    }
  };

  const totalSteps = diagnosisStepsData.length; 
  const currentQuestionData = diagnosisStepsData.find(s => s.step === currentStep)?.question;

  const handleInputChange = (questionId: string, value: string) => {
    // 電話番号の場合は数字のみに制限
    if (questionId === 'phoneNumber') {
      const numbersOnly = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [questionId]: numbersOnly }));
    } else {
      setFormData(prev => ({ ...prev, [questionId]: value }));
    }
  };

  // 電話番号の重複チェック（Supabaseベース）
  const checkPhoneNumberUsage = async (phone: string): Promise<boolean> => {
    try {
      return await diagnosisManager.checkPhoneNumberUsage(phone);
    } catch (error) {
      return false;
    }
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    if (currentQuestionData && !formData[currentQuestionData.id] && currentQuestionData.type !== 'tel') { // Tel can be empty initially for validation message
      return false;
    }
    if (currentQuestionData?.id === 'phoneNumber' && formData[currentQuestionData.id]) {
        const phoneNumber = formData[currentQuestionData.id].replace(/\D/g, ''); 
        if (!/^\d{10,11}$/.test(phoneNumber)) { 
             return false;
        }
        
        // 電話番号の重複チェック
        const isUsed = await checkPhoneNumberUsage(phoneNumber);
        if (isUsed) {
          return false;
        }
    } else if (currentQuestionData?.id === 'phoneNumber' && !formData[currentQuestionData.id]){
        return false;
    }
    return true;
  };

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
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
    const isValid = await validateCurrentStep();
    if (!isValid) {
      return;
    }
    
    if (formData.phoneNumber) {
      // 本番環境でのみ動作 - 直接SMS認証ページに進む
      onProceedToVerification(formData.phoneNumber, formData);
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
        <h2 className="heading-display text-4xl md:text-6xl lg:text-7xl mb-8 font-bold leading-tight" 
            style={{ 
              color: '#ffffff',
              textShadow: '0 4px 15px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.7)',
              letterSpacing: '0.01em',
              fontWeight: '800'
            }}>
            {mainVisualData.title.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line.includes(mainVisualData.highlightWord) ? (
                  line.split(mainVisualData.highlightWord).map((part, partIndex) => (
                    <React.Fragment key={partIndex}>
                      {part}
                      {partIndex < line.split(mainVisualData.highlightWord).length - 1 && (
                        <span style={{ 
                          color: '#fbbf24',
                          textShadow: '0 6px 20px rgba(0, 0, 0, 0.98), 0 3px 10px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.9)',
                          fontWeight: '900',
                          filter: 'brightness(1.2)'
                        }}>
                          {mainVisualData.highlightWord}
                        </span>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  line
                )}
                {index < mainVisualData.title.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
        </h2>
        <p className="text-lg md:text-xl lg:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed" 
           style={{
             color: '#ffffff',
             textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.7)',
             fontWeight: '400'
           }}>
            {mainVisualData.subtitle}
        </p>
          
        <div id="diagnosis-form-section" className="max-w-2xl mx-auto mb-16 text-left" 
             style={{
               background: 'rgba(255, 255, 255, 0.98)',
               backdropFilter: 'blur(20px)',
               border: '2px solid rgba(212, 175, 55, 0.3)',
               borderRadius: '24px',
               padding: '2.5rem',
               boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
               transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
             }}> {/* text-left for card content */}
            <h3 className="heading-primary text-3xl mb-3 text-center" style={{color: 'var(--primary-navy)', fontWeight: '700'}}>
                <i className="fas fa-chart-line mr-3" style={{color: 'var(--accent-gold)', fontSize: '1.2em'}}></i>
                あなた専用の投資プラン診断
            </h3>
            <p className="text-xl mb-8 text-center" style={{color: 'var(--neutral-600)', fontWeight: '500'}}>3分で完了する簡単診断</p>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold" style={{color: 'var(--primary-navy)'}}>進捗状況</span>
                    <span className="text-base font-semibold" style={{color: 'var(--primary-navy)'}}>
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
                  <label htmlFor={currentQuestionData.id} className="block text-left text-lg font-bold mb-4" style={{color: 'var(--primary-navy)'}}>
                    <span className="font-bold mr-2 text-xl">{currentQuestionData.emojiPrefix}</span> {currentQuestionData.label}
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
                      inputMode="numeric"
                      pattern="[0-9]*"
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
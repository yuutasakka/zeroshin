import React, { useState, useEffect, useRef } from 'react';
import { DiagnosisFormState, FinancialProduct, Company, RecommendedProductWithReason } from '../types';
import { assetProjectionData, AgeGroup, InvestmentAmountKey } from '../data/assetProjectionData';
import { createSupabaseClient } from './adminUtils';
import { DiagnosisSessionManager } from './supabaseClient';
import { secureLog } from '../security.config';
import { allFinancialProducts as defaultFinancialProducts } from '../data/financialProductsData';
import { MCPFinancialAssistant } from './MCPFinancialAssistant';
import { measureTransition, PERF_TARGETS } from './PerformanceMonitor';

// セキュリティ関数: URLの安全性を確認
const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return '#';
  
  // 危険なプロトコルを除去
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  const urlLower = url.toLowerCase().trim();
  
  for (const protocol of dangerousProtocols) {
    if (urlLower.startsWith(protocol)) {
      return '#';
    }
  }
  
  // HTTPまたはHTTPSで始まるか、相対URLであることを確認
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('#')) {
    return url;
  }
  
  return '#';
};

// セキュリティ関数: テキストのサニタイゼーション
const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  
  // HTMLエンティティをエスケープ
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}; 

// ファイナンシャルプランナーの型定義
interface FinancialPlanner {
  id: number;
  name: string;
  title: string;
  experience_years: number;
  specialties: string[];
  profile_image_url: string;
  bio: string;
  phone_number: string;
  email?: string;
  certifications: string[];
  is_active: boolean;
  display_order: number;
}

interface DiagnosisResultsPageProps {
  diagnosisData: DiagnosisFormState | null;
  onReturnToStart: () => void;
}

const DiagnosisResultsPage: React.FC<DiagnosisResultsPageProps> = ({ diagnosisData, onReturnToStart }) => {
  const [displayedAmount, setDisplayedAmount] = useState<string>("0");
  const diagnosisManager = new DiagnosisSessionManager();
  const [financialAdvice, setFinancialAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [currentFinancialProducts, setCurrentFinancialProducts] = useState<FinancialProduct[]>(defaultFinancialProducts);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProductWithReason[]>([]);
  const [financialPlanners, setFinancialPlanners] = useState<FinancialPlanner[]>([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // SMS認証チェック（Supabaseベース）
  useEffect(() => {
    const checkSMSVerification = async () => {
      try {
        const currentSession = localStorage.getItem('currentUserSession');
        
        if (!currentSession) {
          setAuthError('認証情報が見つかりません。診断を最初からやり直してください。');
          return;
        }

        const sessionData = JSON.parse(currentSession);
        
        // SMS認証済みかチェック
        if (!sessionData.smsVerified || !sessionData.sessionId) {
          setAuthError('SMS認証が完了していません。診断を最初からやり直してください。');
          return;
        }

        // Supabaseでセッションの有効性を確認
        try {
          const dbSession = await diagnosisManager.getDiagnosisSession(sessionData.sessionId);
          
          if (!dbSession || !dbSession.sms_verified) {
            setAuthError('認証情報が無効です。診断を最初からやり直してください。');
            return;
          }

          // 認証から一定時間以内かチェック（24時間）
          if (dbSession.verification_timestamp) {
            const verificationTime = new Date(dbSession.verification_timestamp);
            const now = new Date();
            const hoursSinceVerification = (now.getTime() - verificationTime.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceVerification > 24) {
              setAuthError('認証の有効期限が切れています。診断を最初からやり直してください。');
              return;
            }
          }

          setIsAuthorized(true);
        } catch (dbError) {
          setAuthError('認証情報の確認中にエラーが発生しました。');
        }
      } catch (error) {
        setAuthError('認証情報の確認中にエラーが発生しました。');
      }
    };

    checkSMSVerification();
  }, []);

  // 認証されていない場合の表示
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shield-alt text-red-600 text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">アクセス制限</h1>
          <p className="text-gray-600 mb-6">
            {authError || '診断結果を表示するにはSMS認証が必要です。'}
          </p>
          <button
            onClick={onReturnToStart}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            診断を最初から始める
          </button>
        </div>
      </div>
    );
  }
  
  const getProjectedAmount = (): number => {
    if (!diagnosisData || !diagnosisData.age || !diagnosisData.amount) {
      return 0;
    }
    const ageKey = diagnosisData.age as AgeGroup;
    const amountKey = diagnosisData.amount as InvestmentAmountKey;

    if (assetProjectionData[ageKey] && assetProjectionData[ageKey][amountKey] !== undefined) {
      return assetProjectionData[ageKey][amountKey];
    }
    return 0; 
  };

  const targetAmount = getProjectedAmount();
  const userAge = diagnosisData?.age ? parseInt(diagnosisData.age.substring(0,2)) : 18; // Assuming age format like "20s", "30s"
  const futureAge = userAge + 10;

  useEffect(() => {
    document.body.classList.add('verification-page-active'); // Uses the dark luxury gradient
    return () => {
        document.body.classList.remove('verification-page-active');
    };
  }, []);

  useEffect(() => {
    const customProductsString = localStorage.getItem('customFinancialProducts');
    if (customProductsString) {
      try {
        const customProducts = JSON.parse(customProductsString);
        if (Array.isArray(customProducts) && customProducts.length > 0 && customProducts.every(p => typeof p.id === 'string' && typeof p.name === 'string')) {
            setCurrentFinancialProducts(customProducts);
        } else { setCurrentFinancialProducts(defaultFinancialProducts); }
      } catch (e) { setCurrentFinancialProducts(defaultFinancialProducts); }
    } else { setCurrentFinancialProducts(defaultFinancialProducts); }
  }, []);

  useEffect(() => {
    const loadFinancialPlanners = async () => {
      try {
        const supabaseConfig = createSupabaseClient();
        
        // Supabase設定が無効な場合はデフォルト値を使用
        if (!supabaseConfig.url || !supabaseConfig.key || supabaseConfig.url.includes('your-project')) {
          setFinancialPlanners([]);
          return;
        }

        const response = await fetch(`${supabaseConfig.url}/rest/v1/financial_planners?is_active.eq=true&order=display_order.asc&limit=4`, {
          headers: {
            'Authorization': `Bearer ${supabaseConfig.key}`,
            'apikey': supabaseConfig.key,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFinancialPlanners(data);
          secureLog('Supabaseからファイナンシャルプランナーを読み込み:', data.length);
        } else {
          secureLog('ファイナンシャルプランナーの読み込みに失敗');
          setFinancialPlanners([]);
        }
      } catch (error) {
        secureLog('ファイナンシャルプランナーの読み込みエラー:', error);
        setFinancialPlanners([]);
      }
    };

    loadFinancialPlanners();
  }, []);

  useEffect(() => {
    let currentAmount = 0;
    const steps = 75; 
    const increment = targetAmount / steps; 
    
    const interval = setInterval(() => {
      currentAmount += increment;
      if (currentAmount >= targetAmount) {
        currentAmount = targetAmount;
        clearInterval(interval);
      }
      setDisplayedAmount(currentAmount % 1 === 0 ? Math.floor(currentAmount).toString() : currentAmount.toFixed(1));
    }, 20); 

    return () => clearInterval(interval);
  }, [targetAmount]);

  useEffect(() => {
    if (diagnosisData) {
      const fetchAdvice = async () => {
        setIsLoadingAdvice(true);
        setAdviceError(null);
        setFinancialAdvice(null);
        try {
          // Simulate API call for AI advice (replace with actual API call in production)
          // For now, using a placeholder logic.
          await new Promise(resolve => setTimeout(resolve, 1500)); 

          let personalizedMessage = `診断結果を拝見しました。\n`;
          if (diagnosisData.age) {
            const ageLabel = {'20s': '20代', '30s': '30代', '40s': '40代', '50s': '50代', '60plus': '60代以上'}[diagnosisData.age as AgeGroup] || diagnosisData.age;
            personalizedMessage += `${ageLabel}のお客様ですね！`;
          }
          if (diagnosisData.purpose) {
            const purposeLabel = {'education': 'お子様の教育費', 'home': 'マイホーム購入', 'retirement': '老後の生活', 'increase_assets': '資産増加'}[diagnosisData.purpose] || diagnosisData.purpose;
            personalizedMessage += `${purposeLabel}を目的とされているのですね。\n`;
          }
          personalizedMessage += `AIが分析した結果、お客様の状況に合わせた積立NISAやiDeCoの活用、そしてリスク許容度に合わせたポートフォリオの構築がおすすめです。\n特に${futureAge}歳での目標資産額 ${targetAmount.toLocaleString()}万円は素晴らしい目標です。\n焦らず、コツコツと資産形成を続けていきましょう！\n詳しいプランについては、ぜひ専門家にご相談ください。`;
          
          setFinancialAdvice(personalizedMessage);

        } catch (error) {
          secureLog("Failed to fetch financial advice:", error);
          setAdviceError("AIアドバイスの取得中にエラーが発生しました。");
        } finally {
          setIsLoadingAdvice(false);
        }
      };

      fetchAdvice();

      // Filter and recommend products
      const filteredProducts: FinancialProduct[] = [];
      const productIds = new Set<string>(); // To avoid duplicates

      currentFinancialProducts.forEach(p => { 
        if (p.alwaysRecommend && !productIds.has(p.id)) { 
            filteredProducts.push(p); 
            productIds.add(p.id); 
        }
      });

      const { age, experience, purpose, amount } = diagnosisData;

      if (experience === 'beginner') currentFinancialProducts.filter(p => p.tags.includes('beginner-friendly') && !productIds.has(p.id)).forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      else if (experience === 'studied') currentFinancialProducts.filter(p => (p.tags.includes('beginner-friendly') || p.tags.includes('diversified')) && !productIds.has(p.id)).forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      else if (experience === 'experienced') currentFinancialProducts.filter(p => p.tags.includes('experienced-friendly') && !productIds.has(p.id)).forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      
      if (age === '20s' || age === '30s') currentFinancialProducts.filter(p => (p.tags.includes('growth') || p.id === 'ideco_nisa' || p.id === 'investment_trusts_etf' || p.id === 'robo_advisor') && !productIds.has(p.id)).forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      else if (age === '40s' || age === '50s') currentFinancialProducts.filter(p => (p.tags.includes('long-term') || p.id === 'bonds' || p.id === 'insurance_products') && !productIds.has(p.id)).forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      else if (age === '60plus') currentFinancialProducts.filter(p => (p.tags.includes('stable') || p.tags.includes('capital-preservation') || p.id === 'deposits' || p.id === 'insurance_products') && !productIds.has(p.id)).forEach(p => { filteredProducts.push(p); productIds.add(p.id); });

      const productsWithReasons: RecommendedProductWithReason[] = filteredProducts.map(product => {
        const reasons = new Set<string>();
        if (product.alwaysRecommend) reasons.add("多くの方にご好評の、人気の定番商品です！");
        if (experience === 'beginner' && product.tags.includes('beginner-friendly')) reasons.add("投資が初めての方でも安心してスタートできます。");
        if ((experience === 'studied' || experience === 'experienced') && product.tags.includes('diversified') && (product.id === 'investment_trusts_etf' || product.id === 'reit')) {
            reasons.add("分散投資でリスクを抑えたい方におすすめです。");
        }
        if (age && (age === '20s' || age === '30s') && product.tags.includes('growth')) {
            reasons.add("若い世代の積極的な資産形成に向いています。");
        }
        if (age && (age === '50s' || age === '60plus') && product.tags.includes('stable')) {
            reasons.add("安定性を重視する世代に適した選択肢です。");
        }
        if (purpose === 'retirement' && product.tags.includes('tax-efficient')) {
            reasons.add("老後資金準備のための税制優遇が期待できます。");
        }


        if (reasons.size === 0) {
          reasons.add("あなたにぴったりの商品です！");
        }
        return { ...product, recommendationReasons: Array.from(reasons) };
      });
      setRecommendedProducts(productsWithReasons);
    }
  }, [diagnosisData, currentFinancialProducts, futureAge, targetAmount]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const end = measureTransition('結果画面表示', PERF_TARGETS.result);
      return end;
    }
  }, []);

  const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(window.location.href);

  return (
    <div className="min-h-screen pt-12 pb-20" style={{ fontFamily: 'var(--font-primary)' }}>
      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        <div className="luxury-card p-6 md:p-10 text-center shadow-2xl">
          <div className="mb-8">
            <div 
              className="inline-block p-5 rounded-full mb-5 shadow-lg"
              style={{ background: 'var(--gradient-gold)' }}
            >
              <i className="fas fa-award text-4xl text-white"></i>
            </div>
            <h1 className="heading-primary text-4xl md:text-5xl mb-3" style={{ color: 'var(--primary-navy)' }}>
              診断完了！あなたの未来プラン
            </h1>
            <p className="text-luxury text-lg">
              <i className="fas fa-lightbulb mr-2" style={{color: 'var(--accent-gold)'}}></i>
              AIがあなたのためだけの特別なアドバイスをお届けします。
              <i className="fas fa-lightbulb ml-2" style={{color: 'var(--accent-gold)'}}></i>
            </p>
          </div>

          {/* Asset Projection */}
          <div className="mb-12 p-8 rounded-2xl shadow-2xl border-2" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            borderColor: 'var(--accent-gold)',
            boxShadow: '0 20px 40px rgba(212, 175, 55, 0.2), 0 0 0 1px rgba(212, 175, 55, 0.1)'
          }}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center justify-center" style={{ color: 'var(--primary-navy)' }}>
              <i className="fas fa-chart-line mr-3" style={{color: 'var(--accent-gold)'}}></i>
              10年後 ({futureAge}歳) のあなたは...
            </h2>
            <p className="text-xl mb-6 font-medium" style={{color: 'var(--primary-navy)'}}>予想資産額は...</p>
            <div className="relative">
              <p className="number-display text-7xl md:text-8xl font-bold my-4 relative z-10" style={{
                lineHeight: '1.1',
                color: 'var(--primary-navy)',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
                background: 'var(--gradient-gold)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {displayedAmount}<span className="text-4xl md:text-5xl ml-2" style={{
                  color: 'var(--accent-gold)',
                  WebkitTextFillColor: 'var(--accent-gold)'
                }}>万円</span>
              </p>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-20 blur-xl"></div>
            </div>
            <p className="text-sm mt-6 px-4 py-3 rounded-lg" style={{
              color: 'var(--neutral-600)',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)'
            }}>
                <i className="fas fa-info-circle mr-2" style={{color: 'var(--accent-gold)'}}></i>
                ※これはAIによるシミュレーション結果です。あなたの選択と行動で未来はもっと輝きます！ 
                <i className="fas fa-star ml-2" style={{color: 'var(--accent-gold)'}}></i>
            </p>
          </div>
          
          {/* AI Financial Advice */}
          <div className="mb-12">
            <h3 className="heading-primary text-2xl mb-6 flex items-center justify-center">
              <i className="fas fa-robot mr-3" style={{ color: 'var(--accent-gold)' }}></i>
              AIからのスペシャルアドバイス
            </h3>
            <div 
                className="p-6 rounded-xl shadow-inner text-left text-luxury leading-relaxed whitespace-pre-line" 
                style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)'}}
                role="log" aria-live="polite"
            >
              {isLoadingAdvice && (
                <div className="flex items-center justify-center py-4">
                  <i className="fas fa-spinner fa-spin text-2xl mr-3" style={{color: 'var(--accent-gold)'}}></i>
                  <span>AIがアドバイスを生成中です...</span>
                </div>
              )}
              {adviceError && <p className="text-red-600"><i className="fas fa-exclamation-triangle mr-2"></i>{adviceError}</p>}
              {financialAdvice && <p>{financialAdvice}</p>}
            </div>
          </div>

          {/* Financial Planners */}
          {financialPlanners.length > 0 && (
            <div className="mb-12">
              <h3 className="heading-primary text-2xl mb-8 flex items-center justify-center">
                <i className="fas fa-user-tie mr-3" style={{ color: 'var(--accent-blue)' }}></i>
                あなたにおすすめの認定ファイナンシャルプランナー
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {financialPlanners.map((planner) => (
                  <div key={planner.id} className="luxury-card p-6 text-left transform hover:scale-105 transition-transform duration-300">
                    <div className="flex items-start mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden mr-4 flex-shrink-0 border-4 border-white shadow-lg">
                        <img 
                          src={sanitizeUrl(planner.profile_image_url)} 
                          alt={`${sanitizeText(planner.name)}の写真`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="heading-primary text-xl mb-1">{sanitizeText(planner.name)}</h4>
                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--accent-blue)' }}>
                          {sanitizeText(planner.title)}
                        </p>
                        <p className="text-xs text-luxury mb-2">
                          <i className="fas fa-clock mr-1"></i>
                          経験年数: {planner.experience_years}年
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {planner.specialties.slice(0, 3).map((specialty, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs px-2 py-1 rounded-full border"
                              style={{ 
                                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                                borderColor: 'var(--accent-blue)',
                                color: 'var(--accent-blue)'
                              }}
                            >
                              {sanitizeText(specialty)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-luxury mb-4 text-sm leading-relaxed line-clamp-3">
                      {sanitizeText(planner.bio)}
                    </p>
                    
                    <div className="mb-4 p-3 rounded-lg" style={{
                      background: 'rgba(59, 130, 246, 0.05)', 
                      borderLeft: '3px solid var(--accent-blue)'
                    }}>
                      <h5 className="font-semibold text-sm mb-2 flex items-center" style={{color: 'var(--accent-blue)'}}>
                        <i className="fas fa-certificate mr-2"></i>保有資格
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {planner.certifications.map((cert, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs px-2 py-1 rounded border"
                            style={{ 
                              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                              borderColor: 'var(--accent-blue)',
                              color: 'var(--accent-blue)'
                            }}
                          >
                            {sanitizeText(cert)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <button
                        onClick={() => window.open(`tel:${planner.phone_number}`, '_self')}
                        className="w-full premium-button text-sm leading-relaxed flex items-center justify-center"
                        style={{ 
                          background: 'var(--accent-blue)', 
                          color: 'white',
                          border: 'none'
                        }}
                        onMouseOver={e => { 
                          (e.currentTarget as HTMLElement).style.background = 'var(--primary-navy)'; 
                        }}
                        onMouseOut={e => { 
                          (e.currentTarget as HTMLElement).style.background = 'var(--accent-blue)'; 
                        }}
                      >
                        <i className="fas fa-phone mr-2"></i>
                        電話で相談する ({planner.phone_number})
                      </button>
                      {planner.email && (
                        <button
                          onClick={() => window.open(`mailto:${planner.email}`, '_self')}
                          className="w-full mt-2 premium-button text-sm leading-relaxed flex items-center justify-center"
                          style={{ 
                            background: 'var(--neutral-100)', 
                            color: 'var(--primary-navy)', 
                            border: '1px solid var(--neutral-300)'
                          }}
                          onMouseOver={e => { 
                            (e.currentTarget as HTMLElement).style.background = 'var(--neutral-200)'; 
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-blue)'; 
                          }}
                          onMouseOut={e => { 
                            (e.currentTarget as HTMLElement).style.background = 'var(--neutral-100)'; 
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--neutral-300)'; 
                          }}
                        >
                          <i className="fas fa-envelope mr-2"></i>
                          メールで相談する
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <div className="mb-12">
              <h3 className="heading-primary text-2xl mb-8 flex items-center justify-center">
                <i className="fas fa-gifts mr-3" style={{ color: 'var(--accent-emerald)' }}></i>
                あなたへのおすすめ金融商品
              </h3>
              <div className="space-y-8">
                {recommendedProducts.map((product) => (
                  <div key={product.id} className="luxury-card p-6 text-left transform hover:scale-105 transition-transform duration-300">
                    <div className="flex items-start mb-4">
                      <div className="p-3 rounded-lg mr-4" style={{ background: 'var(--gradient-emerald)' }}>
                        <i className={`${product.iconClass} text-2xl text-white`}></i>
                      </div>
                      <div>
                        <h4 className="heading-primary text-xl mb-1">{product.name}</h4>
                        <p className="text-sm text-luxury">{product.shortDescription}</p>
                      </div>
                    </div>
                    <p className="text-luxury mb-4 text-sm leading-relaxed">{product.longDescription}</p>
                    
                    <div className="mb-4 p-4 rounded-lg" style={{background: 'rgba(5, 150, 105, 0.05)', borderLeft: '3px solid var(--accent-emerald)'}}>
                      <h5 className="font-semibold text-sm mb-2 flex items-center" style={{color: 'var(--accent-emerald)'}}>
                        <i className="fas fa-lightbulb mr-2"></i>AIからのおすすめポイント
                      </h5>
                      <ul className="list-disc list-inside text-sm text-luxury space-y-1 pl-1">
                        {product.recommendationReasons.map((reason, idx) => <li key={idx}>{reason}</li>)}
                      </ul>
                    </div>

                    {product.representativeCompanies && product.representativeCompanies.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-sm mb-2" style={{color: 'var(--primary-navy)'}}>取扱金融機関・サービス例:</h5>
                        <div className="space-y-2">
                          {product.representativeCompanies.map(company => (
                            <a 
                              key={company.id} 
                              href={sanitizeUrl(company.websiteUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block premium-button w-full text-sm leading-relaxed"
                              style={{ background: 'var(--neutral-100)', color: 'var(--primary-navy)', border: '1px solid var(--neutral-300)'}}
                              onMouseOver={e => { e.currentTarget.style.background = 'var(--neutral-200)'; e.currentTarget.style.borderColor = 'var(--accent-gold)'; }}
                              onMouseOut={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.borderColor = 'var(--neutral-300)'; }}
                            >
                              {company.logoUrl && <img src={sanitizeUrl(company.logoUrl)} alt={`${sanitizeText(company.name)} logo`} className="inline h-5 mr-2 align-middle"/>}
                              <span className="align-middle">{sanitizeText(company.name)} - {sanitizeText(company.actionText)}</span>
                              <i className="fas fa-external-link-alt ml-2 text-xs opacity-70 align-middle"></i>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MCP AI Financial Assistant */}
          <div className="mb-16">
            <h3 className="heading-primary text-3xl mb-8 flex items-center justify-center">
              <i className="fas fa-robot mr-3" style={{ color: 'var(--accent-gold)' }}></i>
              AI財務アドバイザー
              <span className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full ml-3">
                MCP対応
              </span>
            </h3>
            <div className="p-4 mb-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <p className="text-luxury text-center">
                <i className="fas fa-star mr-2" style={{ color: 'var(--accent-gold)' }}></i>
                最新のMCP（Model Context Protocol）技術を使った高度な財務分析機能を搭載！
                より詳細な診断と個別化されたアドバイスをご利用いただけます。
                <i className="fas fa-star ml-2" style={{ color: 'var(--accent-gold)' }}></i>
              </p>
            </div>
            <MCPFinancialAssistant className="w-full" />
          </div>

          {/* QR Code and Return Button */}
          <div className="mt-16 pt-8 border-t border-gray-300">
             <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-left">
                    <h4 className="heading-primary text-xl mb-3">この結果を保存・共有</h4>
                    <p className="text-luxury mb-4 text-sm">
                        スマートフォンで下のQRコードを読み取ると、この診断結果ページにいつでもアクセスできます。
                        大切な人への共有や、後で見返す際にご利用ください。
                    </p>
                    <img 
                        src={qrCodeUrl} 
                        alt="診断結果QRコード" 
                        className="w-40 h-40 mx-auto md:mx-0 rounded-lg shadow-md border-4 border-white"
                    />
                </div>
                <div className="text-center md:text-right">
                    <h4 className="heading-primary text-xl mb-3">もう一度診断しますか？</h4>
                    <p className="text-luxury mb-4 text-sm">
                        条件を変えて再度診断したり、ご家族やお友達と一緒に楽しむこともできます。
                        新しい発見があるかもしれません。
                    </p>
                    <button 
                        onClick={onReturnToStart}
                        className="premium-button gold-accent-button text-lg px-8 py-3 w-full md:w-auto"
                        aria-label="最初の診断ページに戻る"
                    >
                        <i className="fas fa-undo-alt mr-2"></i>
                        最初に戻る
                    </button>
                </div>
            </div>
          </div>
          
           <div className="mt-12 text-center">
             <p className="text-xs text-luxury">
                <i className="fas fa-info-circle mr-1"></i>
                本診断結果はあくまでシミュレーションであり、将来の成果を保証するものではありません。投資は自己責任でお願いいたします。
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DiagnosisResultsPage;
import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react';
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
  image_url: string;
  title: string;
  description: string;
  rating: number;
  languages: string[];
  is_active: boolean;
  contact_info: object;
  display_order: number;
}

// State管理のためのreducer
interface AppState {
  displayAmount: number;
  financialAdvice: string | null;
  isLoadingAdvice: boolean;
  adviceError: string | null;
  currentFinancialProducts: FinancialProduct[];
  recommendedProducts: RecommendedProductWithReason[];
  financialPlanners: FinancialPlanner[];
  isAuthorized: boolean;
  authError: string | null;
  debugInfo: string;
}

type AppAction =
  | { type: 'SET_DISPLAY_AMOUNT'; payload: number }
  | { type: 'SET_FINANCIAL_ADVICE'; payload: string | null }
  | { type: 'SET_LOADING_ADVICE'; payload: boolean }
  | { type: 'SET_ADVICE_ERROR'; payload: string | null }
  | { type: 'SET_FINANCIAL_PRODUCTS'; payload: FinancialProduct[] }
  | { type: 'SET_RECOMMENDED_PRODUCTS'; payload: RecommendedProductWithReason[] }
  | { type: 'SET_FINANCIAL_PLANNERS'; payload: FinancialPlanner[] }
  | { type: 'SET_AUTHORIZED'; payload: boolean }
  | { type: 'SET_AUTH_ERROR'; payload: string | null }
  | { type: 'SET_DEBUG_INFO'; payload: string };

const initialState: AppState = {
  displayAmount: 0,
  financialAdvice: null,
  isLoadingAdvice: false,
  adviceError: null,
  currentFinancialProducts: defaultFinancialProducts,
  recommendedProducts: [],
  financialPlanners: [],
  isAuthorized: false,
  authError: null,
  debugInfo: ''
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  
  switch (action.type) {
    case 'SET_DISPLAY_AMOUNT':
      return { ...state, displayAmount: action.payload };
    case 'SET_FINANCIAL_ADVICE':
      return { ...state, financialAdvice: action.payload };
    case 'SET_LOADING_ADVICE':
      return { ...state, isLoadingAdvice: action.payload };
    case 'SET_ADVICE_ERROR':
      return { ...state, adviceError: action.payload };
    case 'SET_FINANCIAL_PRODUCTS':
      return { ...state, currentFinancialProducts: action.payload };
    case 'SET_RECOMMENDED_PRODUCTS':
      return { ...state, recommendedProducts: action.payload };
    case 'SET_FINANCIAL_PLANNERS':
      return { ...state, financialPlanners: action.payload };
    case 'SET_AUTHORIZED':
      const newState = { ...state, isAuthorized: action.payload };
      return newState;
    case 'SET_AUTH_ERROR':
      return { ...state, authError: action.payload };
    case 'SET_DEBUG_INFO':
      return { ...state, debugInfo: action.payload };
    default:
      return state;
  }
};

interface DiagnosisResultsPageProps {
  diagnosisData: DiagnosisFormState | null;
  onReturnToStart: () => void;
}

const DiagnosisResultsPage: React.FC<DiagnosisResultsPageProps> = ({ diagnosisData, onReturnToStart }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const diagnosisManager = useMemo(() => new DiagnosisSessionManager(), []);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const authCheckCountRef = useRef(0);
  const authSuccessRef = useRef(false); // 認証成功フラグ


  // localStorageの内容も確認

  // 診断データの復元機能
  const restoredDiagnosisData = useMemo(() => {
    
    // propsで渡されたデータがある場合はそれを優先
    if (diagnosisData && diagnosisData.age && diagnosisData.monthlyInvestment) {
      return diagnosisData;
    }


    // propsのデータが不完全な場合、localStorageから復元を試行
    try {
      const currentSession = localStorage.getItem('currentUserSession');
      
      if (currentSession) {
        const sessionData = JSON.parse(currentSession);
        
        if (sessionData.diagnosisAnswers && Object.keys(sessionData.diagnosisAnswers).length > 0) {
          return sessionData.diagnosisAnswers;
        } else {
        }
      } else {
      }

      // 他のlocalStorageキーも確認
      const diagnosisDataDirect = localStorage.getItem('diagnosisData');
      if (diagnosisDataDirect) {
        const parsedDirect = JSON.parse(diagnosisDataDirect);
        return parsedDirect;
      }
    } catch (error) {
      console.error('🔍 診断データ復元エラー:', error);
    }

    // フォールバック: デフォルトデータ
    const defaultData = {
      age: '30s',
      amount: '1million',
      purpose: 'retirement',
      experience: 'beginner'
    };
    return defaultData;
  }, [diagnosisData]);

  // 計算値をメモ化（復元されたデータを使用）
  const targetAmount = useMemo(() => {
    const age = restoredDiagnosisData?.age;
    const amount = restoredDiagnosisData?.monthlyInvestment || restoredDiagnosisData?.amount;
    
    if (!age || !amount) {
      return 0;
    }
    
    const ageKey = age as AgeGroup;
    const amountKey = amount as InvestmentAmountKey;
    
    const result = assetProjectionData[ageKey]?.[amountKey] || 0;
    
    return result;
  }, [restoredDiagnosisData]);

  const userAge = useMemo(() => {
    const age = restoredDiagnosisData?.age ? parseInt(restoredDiagnosisData.age.substring(0, 2)) : 18;
    return age;
  }, [restoredDiagnosisData]);

  const futureAge = useMemo(() => userAge + 10, [userAge]);

  // コンポーネントマウント状態の管理
  useEffect(() => {
    isMountedRef.current = true; // 明示的にマウント状態を設定
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 1. 基本設定
  useEffect(() => {
    document.body.classList.add('verification-page-active');
    return () => {
      document.body.classList.remove('verification-page-active');
    };
  }, []);

  // 2. 金融商品の読み込み
  useEffect(() => {
    const customProductsString = localStorage.getItem('customFinancialProducts');
    if (customProductsString) {
      try {
        const customProducts = JSON.parse(customProductsString);
        if (Array.isArray(customProducts) && customProducts.length > 0) {
          dispatch({ type: 'SET_FINANCIAL_PRODUCTS', payload: customProducts });
        }
      } catch (e) {
        secureLog('金融商品データの読み込みに失敗:', e);
      }
    }
  }, []);

  // 3. SMS認証チェック
  useEffect(() => {
    const checkSMSVerification = async () => {
      if (!isMountedRef.current) return;
      
      // 既に認証が成功している場合はスキップ
      if (authSuccessRef.current) {
        return;
      }
      
      authCheckCountRef.current += 1;
      const checkCount = authCheckCountRef.current;
      
      try {
        
        const currentSession = localStorage.getItem('currentUserSession');
        
        if (!currentSession) {
          const errorMsg = '認証情報が見つかりません。診断を最初からやり直してください。';
          dispatch({ type: 'SET_AUTH_ERROR', payload: errorMsg });
          dispatch({ type: 'SET_DEBUG_INFO', payload: 'localStorage に currentUserSession が存在しません' });
          return;
        }

        let sessionData;
        try {
          sessionData = JSON.parse(currentSession);
        } catch (parseError) {
          const errorMsg = 'セッションデータの解析に失敗しました。';
          dispatch({ type: 'SET_AUTH_ERROR', payload: errorMsg });
          dispatch({ type: 'SET_DEBUG_INFO', payload: `JSON解析エラー: ${parseError instanceof Error ? parseError.message : String(parseError)}` });
          return;
        }
        
        // セッションデータの詳細検証
        const smsVerified = sessionData.smsVerified;
        const sessionId = sessionData.sessionId;
        const verificationTimestamp = sessionData.verificationTimestamp;
        const verifiedPhoneNumber = sessionData.verifiedPhoneNumber;
        
        if (!smsVerified || !sessionId) {
          const errorMsg = 'SMS認証が完了していません。診断を最初からやり直してください。';
          dispatch({ type: 'SET_AUTH_ERROR', payload: errorMsg });
          dispatch({ type: 'SET_DEBUG_INFO', payload: `セッションデータ: smsVerified=${smsVerified}, sessionId=${sessionId}, timestamp=${verificationTimestamp}` });
          return;
        }

        const dbSession = await diagnosisManager.getDiagnosisSession(sessionId);
        
        if (!dbSession) {
          const errorMsg = '認証情報が無効です。診断を最初からやり直してください。';
          dispatch({ type: 'SET_AUTH_ERROR', payload: errorMsg });
          dispatch({ type: 'SET_DEBUG_INFO', payload: `DB セッション: 存在しません (sessionId: ${sessionId})` });
          return;
        }

        // データベースから診断回答を復元
        if (dbSession.diagnosis_answers && Object.keys(dbSession.diagnosis_answers).length > 0) {
          
          // 診断回答をコンポーネントの状態に反映
          const dbAnswers = dbSession.diagnosis_answers;
          
          // diagnosisDataが空の場合、データベースから復元
          if (!diagnosisData || (!diagnosisData.age && !diagnosisData.monthlyInvestment)) {
            const restoredDiagnosisData = {
              age: dbAnswers.age || '',
              investmentExperience: dbAnswers.investmentExperience || dbAnswers.experience || '',
              investmentGoal: dbAnswers.investmentGoal || dbAnswers.purpose || '',
              monthlyInvestment: dbAnswers.monthlyInvestment || dbAnswers.amount || '',
              investmentHorizon: dbAnswers.investmentHorizon || dbAnswers.timing || '',
              annualIncome: dbAnswers.annualIncome || '',
              riskTolerance: dbAnswers.riskTolerance || '',
              investmentPreference: dbAnswers.investmentPreference || '',
              financialKnowledge: dbAnswers.financialKnowledge || ''
            };
            
            
            // 復元したデータをローカルストレージに保存
            localStorage.setItem('diagnosisData', JSON.stringify(restoredDiagnosisData));
            
            // セッションデータも更新
            const updatedSessionData = {
              ...sessionData,
              diagnosisAnswers: dbAnswers
            };
            localStorage.setItem('currentUserSession', JSON.stringify(updatedSessionData));
            
          }
        }
        
        if (!dbSession.sms_verified) {
          const errorMsg = 'データベースでSMS認証が確認できません。診断を最初からやり直してください。';
          dispatch({ type: 'SET_AUTH_ERROR', payload: errorMsg });
          dispatch({ type: 'SET_DEBUG_INFO', payload: `DB セッション: exists=true, sms_verified=${dbSession.sms_verified}, phone=${dbSession.phone_number}` });
          return;
        }

        if (dbSession.verification_timestamp) {
          const verificationTime = new Date(dbSession.verification_timestamp);
          const now = new Date();
          const hoursSinceVerification = (now.getTime() - verificationTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceVerification > 24) {
            const errorMsg = '認証の有効期限が切れています。診断を最初からやり直してください。';
            dispatch({ type: 'SET_AUTH_ERROR', payload: errorMsg });
            dispatch({ type: 'SET_DEBUG_INFO', payload: `認証期限切れ: ${hoursSinceVerification.toFixed(1)}時間経過` });
            return;
          }
        }

        
        // 認証成功フラグを設定
        authSuccessRef.current = true;
        
        // isMountedRef.currentがfalseの場合でも、認証成功時は強制的に状態を更新
        // これは認証チェックが非同期で実行されるため、コンポーネントの状態に関わらず結果を反映させる必要があるため
        if (isMountedRef.current || true) { // 認証成功時は常に状態を更新
          dispatch({ type: 'SET_AUTHORIZED', payload: true });
          
          dispatch({ type: 'SET_DEBUG_INFO', payload: `認証成功: sessionId=${sessionId}, sms_verified=true, phone=${dbSession.phone_number}` });
          
          
          // 状態更新後の確認（少し遅延させて）
          setTimeout(() => {
          }, 100);
        } else {
        }
      } catch (error) {
        if (isMountedRef.current) {
          dispatch({ type: 'SET_AUTH_ERROR', payload: '認証情報の確認中にエラーが発生しました。' });
          dispatch({ type: 'SET_DEBUG_INFO', payload: `認証エラー: ${error instanceof Error ? error.message : String(error)}` });
        }
      }
    };

    checkSMSVerification();
  }, []); // 依存関係を空にして、マウント時に一回だけ実行

  // デバッグ用: 認証状態の変化を監視
  useEffect(() => {
  }, [state.isAuthorized, state.authError, state.debugInfo]);

  // 4. ファイナンシャルプランナーの読み込み（オプション）
  useEffect(() => {
    const loadFinancialPlanners = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const supabaseConfig = createSupabaseClient();
        
        if (!supabaseConfig.url || !supabaseConfig.key) {
          return;
        }

        // サンプル専門家データを設定（テーブルが存在しない場合のフォールバック）
        const samplePlanners = [
          {
            id: 1,
            name: '田中 太郎',
            image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            title: 'CFP®認定者・ファイナンシャルプランナー',
            description: '投資信託・NISA・iDeCo専門。初心者から上級者まで幅広くサポートします。',
            rating: 4.8,
            languages: ['日本語', '英語'],
            is_active: true,
            contact_info: { phone: '03-1234-5678', email: 'tanaka@moneyticket.com' },
            display_order: 1
          },
          {
            id: 2,
            name: '佐藤 花子',
            image_url: 'https://images.unsplash.com/photo-1494790108755-2616c8e3deb9?w=150&h=150&fit=crop&crop=face',
            title: '資産運用アドバイザー・税理士',
            description: '節税対策と資産運用を組み合わせた総合的なアドバイスが得意です。',
            rating: 4.9,
            languages: ['日本語'],
            is_active: true,
            contact_info: { phone: '03-2345-6789', email: 'sato@moneyticket.com' },
            display_order: 2
          },
          {
            id: 3,
            name: '山田 次郎',
            image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            title: '不動産投資・REIT専門アドバイザー',
            description: '不動産投資からREITまで、不動産関連投資のエキスパートです。',
            rating: 4.7,
            languages: ['日本語', '中国語'],
            is_active: true,
            contact_info: { phone: '03-3456-7890', email: 'yamada@moneyticket.com' },
            display_order: 3
          }
        ];
        
        dispatch({ type: 'SET_FINANCIAL_PLANNERS', payload: samplePlanners });
      } catch (error) {
        secureLog('ファイナンシャルプランナーの読み込みエラー:', error);
        dispatch({ type: 'SET_FINANCIAL_PLANNERS', payload: [] });
      }
    };

    loadFinancialPlanners();
  }, []);

  // 5. 表示金額のアニメーション
  useEffect(() => {
    if (!targetAmount) return;

    let currentAmount = 0;
    const steps = 75;
    const increment = targetAmount / steps;
    
    const interval = setInterval(() => {
      currentAmount += increment;
      if (currentAmount >= targetAmount) {
        if (isMountedRef.current) {
          dispatch({ type: 'SET_DISPLAY_AMOUNT', payload: targetAmount });
        }
        clearInterval(interval);
      } else if (isMountedRef.current) {
        dispatch({ type: 'SET_DISPLAY_AMOUNT', payload: Math.floor(currentAmount) });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [targetAmount]);

  // 6. 診断結果の処理
  useEffect(() => {
    if (!restoredDiagnosisData || !state.isAuthorized) return;

    const fetchAdvice = async () => {
      if (!isMountedRef.current) return;
      
      dispatch({ type: 'SET_LOADING_ADVICE', payload: true });
      dispatch({ type: 'SET_ADVICE_ERROR', payload: null });
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        let personalizedMessage = `診断結果を拝見しました。\n`;
        if (restoredDiagnosisData.age) {
          const ageLabel = {'20s': '20代', '30s': '30代', '40s': '40代', '50s': '50代', '60plus': '60代以上'}[restoredDiagnosisData.age as AgeGroup] || restoredDiagnosisData.age;
          personalizedMessage += `${ageLabel}のお客様ですね！`;
        }
        if (restoredDiagnosisData.purpose) {
          const purposeLabel = {'education': 'お子様の教育費', 'home': 'マイホーム購入', 'retirement': '老後の生活', 'increase_assets': '資産増加'}[restoredDiagnosisData.purpose] || restoredDiagnosisData.purpose;
          personalizedMessage += `${purposeLabel}を目的とされているのですね。\n`;
        }
        personalizedMessage += `AIが分析した結果、お客様の状況に合わせた積立NISAやiDeCoの活用、そしてリスク許容度に合わせたポートフォリオの構築がおすすめです。\n特に${futureAge}歳での目標資産額 ${targetAmount.toLocaleString()}万円は素晴らしい目標です。\n焦らず、コツコツと資産形成を続けていきましょう！\n詳しいプランについては、ぜひ専門家にご相談ください。`;
        
        if (isMountedRef.current) {
          dispatch({ type: 'SET_FINANCIAL_ADVICE', payload: personalizedMessage });
        }
      } catch (error) {
        if (isMountedRef.current) {
          dispatch({ type: 'SET_ADVICE_ERROR', payload: 'AIアドバイスの取得中にエラーが発生しました。' });
        }
      } finally {
        if (isMountedRef.current) {
          dispatch({ type: 'SET_LOADING_ADVICE', payload: false });
        }
      }
    };

    // 商品推薦の処理
    const processRecommendations = () => {
      const filteredProducts: FinancialProduct[] = [];
      const productIds = new Set<string>();

      state.currentFinancialProducts.forEach(p => {
        if (p.alwaysRecommend && !productIds.has(p.id)) {
          filteredProducts.push(p);
          productIds.add(p.id);
        }
      });

      const { age, experience, purpose } = restoredDiagnosisData;

      if (experience === 'beginner') {
        state.currentFinancialProducts
          .filter(p => p.tags.includes('beginner-friendly') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      } else if (experience === 'studied') {
        state.currentFinancialProducts
          .filter(p => (p.tags.includes('beginner-friendly') || p.tags.includes('diversified')) && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      } else if (experience === 'experienced') {
        state.currentFinancialProducts
          .filter(p => p.tags.includes('experienced-friendly') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      }

      if (age === '20s' || age === '30s') {
        state.currentFinancialProducts
          .filter(p => (p.tags.includes('growth') || p.id === 'ideco_nisa' || p.id === 'investment_trusts_etf' || p.id === 'robo_advisor') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      } else if (age === '40s' || age === '50s') {
        state.currentFinancialProducts
          .filter(p => (p.tags.includes('long-term') || p.id === 'bonds' || p.id === 'insurance_products') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      } else if (age === '60plus') {
        state.currentFinancialProducts
          .filter(p => (p.tags.includes('stable') || p.tags.includes('capital-preservation') || p.id === 'deposits' || p.id === 'insurance_products') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      }

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

      if (isMountedRef.current) {
        dispatch({ type: 'SET_RECOMMENDED_PRODUCTS', payload: productsWithReasons });
      }
    };

    fetchAdvice();
    processRecommendations();
  }, [restoredDiagnosisData, state.currentFinancialProducts, state.isAuthorized, futureAge, targetAmount]);

  // 7. パフォーマンス計測
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const end = measureTransition('結果画面表示', PERF_TARGETS.result);
      return end;
    }
  }, []);

  // 認証されていない場合の表示
  
  if (!state.isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shield-alt text-red-600 text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">アクセス制限</h1>
          <p className="text-gray-600 mb-6">
            {state.authError || '診断結果を表示するにはSMS認証が必要です。'}
          </p>
          {state.debugInfo && (
            <div className="bg-gray-100 p-3 rounded text-xs text-gray-700 mb-4">
              <strong>デバッグ情報:</strong> {state.debugInfo}
            </div>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <i className="fas fa-home mr-2"></i>
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen pt-12 pb-20" style={{ fontFamily: 'var(--font-primary)' }}>
      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        <div className="luxury-card p-6 md:p-10 text-center shadow-2xl">
          <div className="mb-8">
            <div 
              className="inline-block p-5 rounded-full mb-5 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <i className="fas fa-chart-line text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              診断結果
            </h1>
            <p className="text-gray-600 text-lg">
              あなたの資産運用プランをご提案します
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8">
            <div className="text-center">
              <p className="text-gray-700 text-lg mb-4">
                <strong>{futureAge}歳時点での予想資産額</strong>
              </p>
              <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-2">
                {state.displayAmount.toLocaleString()}
                <span className="text-2xl text-gray-600">万円</span>
              </div>
              <p className="text-gray-600">
                現在{userAge}歳から10年間の資産運用で目指せる金額です
              </p>
            </div>
          </div>

          {/* AI アドバイス セクション */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <i className="fas fa-robot text-blue-600 mr-2"></i>
              AIによる個別アドバイス
            </h2>
            
            {state.isLoadingAdvice ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-600">AIが分析しています...</span>
              </div>
            ) : state.adviceError ? (
              <div className="text-red-600 py-4">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {state.adviceError}
              </div>
            ) : state.financialAdvice ? (
              <div className="text-left bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {state.financialAdvice}
                </p>
              </div>
            ) : (
              <div className="text-gray-600 py-4">
                <i className="fas fa-info-circle mr-2"></i>
                アドバイスを準備中です...
              </div>
            )}
          </div>

          {/* おすすめ商品セクション */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center">
              <i className="fas fa-star text-yellow-500 mr-2"></i>
              あなたにおすすめの金融商品
            </h2>
            
            <div className="grid gap-4">
              {state.recommendedProducts.map((product, index) => (
                <div key={product.id} className="bg-gray-50 p-4 rounded-lg text-left">
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 font-medium mb-1">おすすめの理由:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {product.recommendationReasons.map((reason, reasonIndex) => (
                        <li key={reasonIndex} className="flex items-start">
                          <i className="fas fa-check text-green-500 text-xs mt-1 mr-2"></i>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => (
                      <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 専門家相談セクション */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <i className="fas fa-user-tie text-green-600 mr-2"></i>
              専門家によるサポート
            </h2>
            <p className="text-gray-600 mb-6">
              より詳しい資産運用プランについて、経験豊富なファイナンシャルプランナーがご相談をお受けします。
            </p>
            
            {state.financialPlanners.length > 0 && (
              <div className="grid gap-4 mb-6">
                {state.financialPlanners.map((planner) => (
                  <div key={planner.id} className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <img 
                      src={sanitizeUrl(planner.image_url)} 
                      alt={sanitizeText(planner.name)}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-800">{sanitizeText(planner.name)}</h3>
                      <p className="text-sm text-gray-600">{sanitizeText(planner.title)}</p>
                      <div className="flex items-center mt-1">
                        <div className="text-yellow-400 text-sm mr-2">
                          {'★'.repeat(Math.floor(planner.rating))}
                        </div>
                        <span className="text-sm text-gray-500">({planner.rating})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <MCPFinancialAssistant />
          </div>


          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                  alert('診断結果のURLをコピーしました！\nSNSやメールで簡単にシェアできます。');
                }).catch(() => {
                  // フォールバック: モーダルでURLを表示
                  const modal = document.createElement('div');
                  modal.innerHTML = `
                    <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;">
                      <div style="background:white;padding:20px;border-radius:10px;max-width:400px;margin:20px;">
                        <h3 style="margin:0 0 15px 0;">診断結果を共有</h3>
                        <p style="margin:0 0 15px 0;">以下のURLをコピーして共有してください：</p>
                        <input type="text" value="${url}" readonly style="width:100%;padding:10px;border:1px solid #ccc;border-radius:5px;margin:0 0 15px 0;" onclick="this.select()">
                        <button onclick="this.parentElement.parentElement.remove()" style="background:#007bff;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;">閉じる</button>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(modal);
                });
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <i className="fas fa-share mr-2"></i>
              この結果をシェア
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <i className="fas fa-print mr-2"></i>
              結果を印刷
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <i className="fas fa-home mr-2"></i>
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisResultsPage;
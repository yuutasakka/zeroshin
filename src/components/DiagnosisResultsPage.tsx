import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react';
import { DiagnosisFormState, FinancialProduct, Company, RecommendedProductWithReason } from '../../types';
import { assetProjectionData, AgeGroup, InvestmentAmountKey } from '../../data/assetProjectionData';
import { createSupabaseClient } from './adminUtils';
import { DiagnosisSessionManager } from './supabaseClient';
import { secureLog } from '../../security.config';
import { allFinancialProducts as defaultFinancialProducts } from '../../data/financialProductsData';
import { MCPFinancialAssistant } from './MCPFinancialAssistant';
import { measureTransition, PERF_TARGETS } from './PerformanceMonitor';

import { InputValidator } from '../utils/inputValidation';

// セキュリティ関数をInputValidatorから使用
const sanitizeUrl = InputValidator.sanitizeURL;
const sanitizeText = InputValidator.sanitizeHTML; 

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
  contact_info: {
    phone_number?: string;
    line_url?: string;
    consultation_hours?: string;
  };
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
  showExpertModal: boolean;
  selectedExpert: FinancialPlanner | null;
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
  | { type: 'SET_DEBUG_INFO'; payload: string }
  | { type: 'SET_EXPERT_MODAL'; payload: boolean }
  | { type: 'SET_SELECTED_EXPERT'; payload: FinancialPlanner | null };

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
  debugInfo: '',
  showExpertModal: false,
  selectedExpert: null
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
    case 'SET_EXPERT_MODAL':
      return { ...state, showExpertModal: action.payload };
    case 'SET_SELECTED_EXPERT':
      return { ...state, selectedExpert: action.payload };
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
      console.error(' 診断データ復元エラー:', error);
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

  // 2. 金融商品の読み込み (Supabaseから)
  useEffect(() => {
    const loadFinancialProductsFromSupabase = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const supabaseConfig = createSupabaseClient();
        
        // Supabase設定を確認
        if (!supabaseConfig.url || !supabaseConfig.key || 
            supabaseConfig.url.includes('your-project') || 
            supabaseConfig.key.includes('your-anon-key')) {
          secureLog('Supabase設定が無効、デフォルト金融商品を使用');
          dispatch({ type: 'SET_FINANCIAL_PRODUCTS', payload: defaultFinancialProducts });
          return;
        }

        // Supabaseから金融商品データを取得
        const response = await fetch(`${supabaseConfig.url}/rest/v1/financial_products?select=*&is_active.eq=true&order=display_order`, {
          headers: {
            'Authorization': `Bearer ${supabaseConfig.key}`,
            'apikey': supabaseConfig.key,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const products = await response.json();
          if (products && products.length > 0) {
            secureLog(`Supabaseから${products.length}件の金融商品を読み込み`);
            dispatch({ type: 'SET_FINANCIAL_PRODUCTS', payload: products });
            return;
          }
        } else if (response.status === 400) {
          secureLog('Supabase金融商品テーブルが存在しません (400エラー) - デフォルト商品を使用');
        } else {
          secureLog(`Supabase金融商品取得エラー: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        secureLog('Supabase金融商品フェッチエラー:', error);
      }
      
      // エラー時またはデータが空の場合はデフォルト商品を使用
      if (isMountedRef.current) {
        dispatch({ type: 'SET_FINANCIAL_PRODUCTS', payload: defaultFinancialProducts });
      }
    };

    loadFinancialProductsFromSupabase();
  }, []);

  // ファイナンシャルプランナーをSupabaseから読み込み
  useEffect(() => {
    const loadFinancialPlanners = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const supabaseConfig = createSupabaseClient();
        
        // Supabase設定を確認
        if (!supabaseConfig.url || !supabaseConfig.key || 
            supabaseConfig.url.includes('your-project') || 
            supabaseConfig.key.includes('your-anon-key')) {
          secureLog('Supabase設定が無効、expert_contact_settingsを使用');
          
          // expert_contact_settingsからデータを読み込み
          const expertResponse = await fetch(`${supabaseConfig.url}/rest/v1/expert_contact_settings?setting_key.eq=primary_financial_advisor&is_active.eq=true&select=*`, {
            headers: {
              'Authorization': `Bearer ${supabaseConfig.key}`,
              'apikey': supabaseConfig.key,
              'Content-Type': 'application/json'
            }
          });
          
          if (expertResponse.ok) {
            const expertData = await expertResponse.json();
            if (expertData && expertData.length > 0) {
              const expert = expertData[0];
              const mockPlanner: FinancialPlanner = {
                id: 1,
                name: expert.expert_name || 'AI ConectX専門アドバイザー',
                image_url: 'https://via.placeholder.com/150x150?text=Expert',
                title: 'AI ConectX認定ファイナンシャルプランナー',
                description: expert.description || '',
                rating: 4.8,
                languages: ['日本語'],
                is_active: true,
                contact_info: {
                  phone_number: expert.phone_number || '',
                  line_url: expert.line_url || '',
                  consultation_hours: expert.business_hours || ''
                },
                display_order: 1
              };
              dispatch({ type: 'SET_FINANCIAL_PLANNERS', payload: [mockPlanner] });
              return;
            }
          }
          return;
        }

        // ファイナンシャルプランナーテーブルから取得を試行
        const response = await fetch(`${supabaseConfig.url}/rest/v1/financial_planners?is_active.eq=true&order=display_order`, {
          headers: {
            'Authorization': `Bearer ${supabaseConfig.key}`,
            'apikey': supabaseConfig.key,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const planners = await response.json();
          if (planners && planners.length > 0) {
            dispatch({ type: 'SET_FINANCIAL_PLANNERS', payload: planners });
            secureLog(`${planners.length}件のファイナンシャルプランナーを読み込み`);
            return;
          }
        }
        
        // フォールバック: expert_contact_settingsを使用
        const expertResponse = await fetch(`${supabaseConfig.url}/rest/v1/expert_contact_settings?setting_key.eq=primary_financial_advisor&is_active.eq=true&select=*`, {
          headers: {
            'Authorization': `Bearer ${supabaseConfig.key}`,
            'apikey': supabaseConfig.key,
            'Content-Type': 'application/json'
          }
        });
        
        if (expertResponse.ok) {
          const expertData = await expertResponse.json();
          if (expertData && expertData.length > 0) {
            const expert = expertData[0];
            const mockPlanner: FinancialPlanner = {
              id: 1,
              name: expert.expert_name || 'AI ConectX専門アドバイザー',
              image_url: 'https://via.placeholder.com/150x150?text=Expert',
              title: 'AI ConectX認定ファイナンシャルプランナー',
              description: expert.description || '',
              rating: 4.8,
              languages: ['日本語'],
              is_active: true,
              contact_info: {
                phone_number: expert.phone_number || '',
                line_url: expert.line_url || '',
                consultation_hours: expert.business_hours || ''
              },
              display_order: 1
            };
            dispatch({ type: 'SET_FINANCIAL_PLANNERS', payload: [mockPlanner] });
          }
        }
      } catch (error) {
        secureLog('ファイナンシャルプランナー読み込みエラー:', error);
      }
    };

    const loadFinancialProducts = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const supabaseConfig = createSupabaseClient();
        
        if (!supabaseConfig.url || !supabaseConfig.key) {
          secureLog(' Supabase設定なし：デフォルト金融商品データを使用');
          return;
        }

        // Supabaseから金融商品データを取得
        const response = await fetch(`${supabaseConfig.url}/rest/v1/financial_products?select=*&is_active.eq.true&order=display_order`, {
          headers: {
            'Authorization': `Bearer ${supabaseConfig.key}`,
            'apikey': supabaseConfig.key,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const products = await response.json();
          if (products && products.length > 0) {
            // Supabaseから取得したデータを適切な形式に変換
            const formattedProducts = products.map((product: any) => ({
              id: product.id,
              name: product.name || product.product_name,
              description: product.description,
              company: product.company || 'AI ConectX',
              type: product.type || product.product_type || 'investment',
              riskLevel: product.risk_level || 'medium',
              expectedReturn: product.expected_return || '3-5%',
              minimumInvestment: product.minimum_investment || 10000,
              tags: product.tags || [],
              url: product.url || product.detail_url,
              application_url: product.application_url || product.apply_url,
              recommendationReasons: product.recommendation_reasons || []
            }));

            dispatch({ type: 'SET_FINANCIAL_PRODUCTS', payload: formattedProducts });
            secureLog(` Supabaseから${formattedProducts.length}件の金融商品データを読み込み`);
            return;
          }
        } else if (response.status === 400) {
          secureLog('Supabase金融商品テーブルが存在しません (400エラー) - デフォルトデータを使用');
        } else {
          secureLog(`Supabase金融商品取得エラー: ${response.status} ${response.statusText}`);
        }
        
        // エラーまたはデータなしの場合はデフォルトデータを使用
        secureLog('デフォルト金融商品データを使用');
      } catch (error) {
        secureLog('金融商品データフェッチエラー:', error);
        // エラー時もデフォルトデータを使用（既に初期値として設定済み）
      }
    };

    loadFinancialPlanners();
    loadFinancialProducts();
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
            contact_info: { 
              phone: '03-1234-5678', 
              phone_number: '03-1234-5678',
              email: 'tanaka@aiconectx.co.jp',
              line_url: 'https://line.me/R/ti/p/@aiconectx-tanaka',
              consultation_hours: '平日 9:00-18:00 / 土日 10:00-16:00'
            },
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
            contact_info: { 
              phone: '03-2345-6789', 
              phone_number: '03-2345-6789',
              email: 'sato@aiconectx.co.jp',
              line_url: 'https://line.me/R/ti/p/@aiconectx-sato',
              consultation_hours: '平日 10:00-19:00 / 土日祭日 休み'
            },
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
            contact_info: { 
              phone: '03-3456-7890', 
              phone_number: '03-3456-7890',
              email: 'yamada@aiconectx.co.jp',
              line_url: 'https://line.me/R/ti/p/@aiconectx-yamada',
              consultation_hours: '平日 13:00-20:00 / 土日 10:00-17:00'
            },
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
          const purposeLabels = {'education': 'お子様の教育費', 'home': 'マイホーム購入', 'retirement': '老後の生活', 'increase_assets': '資産増加'} as const;
          const purposeLabel = purposeLabels[restoredDiagnosisData.purpose as keyof typeof purposeLabels] || restoredDiagnosisData.purpose;
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
          .filter(p => p.tags?.includes('beginner-friendly') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      } else if (experience === 'studied') {
        state.currentFinancialProducts
          .filter(p => (p.tags?.includes('beginner-friendly') || p.tags?.includes('diversified')) && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      } else if (experience === 'experienced') {
        state.currentFinancialProducts
          .filter(p => p.tags?.includes('experienced-friendly') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      }

      if (age === '20s' || age === '30s') {
        state.currentFinancialProducts
          .filter(p => (p.tags?.includes('growth') || p.id === 'ideco_nisa' || p.id === 'investment_trusts_etf' || p.id === 'robo_advisor') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      } else if (age === '40s' || age === '50s') {
        state.currentFinancialProducts
          .filter(p => (p.tags?.includes('long-term') || p.id === 'bonds' || p.id === 'insurance_products') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      } else if (age === '60plus') {
        state.currentFinancialProducts
          .filter(p => (p.tags?.includes('stable') || p.tags?.includes('capital-preservation') || p.id === 'deposits' || p.id === 'insurance_products') && !productIds.has(p.id))
          .forEach(p => { filteredProducts.push(p); productIds.add(p.id); });
      }

      const productsWithReasons: RecommendedProductWithReason[] = filteredProducts.map(product => {
        const reasons = new Set<string>();
        if (product.alwaysRecommend) reasons.add("多くの方にご好評の、人気の定番商品です！");
        if (experience === 'beginner' && product.tags?.includes('beginner-friendly')) reasons.add("投資が初めての方でも安心してスタートできます。");
        if ((experience === 'studied' || experience === 'experienced') && product.tags?.includes('diversified') && (product.id === 'investment_trusts_etf' || product.id === 'reit')) {
          reasons.add("分散投資でリスクを抑えたい方におすすめです。");
        }
        if (age && (age === '20s' || age === '30s') && product.tags?.includes('growth')) {
          reasons.add("若い世代の積極的な資産形成に向いています。");
        }
        if (age && (age === '50s' || age === '60plus') && product.tags?.includes('stable')) {
          reasons.add("安定性を重視する世代に適した選択肢です。");
        }
        if (purpose === 'retirement' && product.tags?.includes('tax-efficient')) {
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
    return undefined;
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
    <>
      {/* 専門家相談ポップアップ */}
      {state.showExpertModal && state.selectedExpert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full mx-auto shadow-2xl">
            <div className="text-center mb-6">
              <img 
                src={sanitizeUrl(state.selectedExpert.image_url)} 
                alt={sanitizeText(state.selectedExpert.name)}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
              />
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">
                {sanitizeText(state.selectedExpert.name)}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">{sanitizeText(state.selectedExpert.title)}</p>
              <div className="flex items-center justify-center mt-2">
                <div className="text-yellow-400 text-sm mr-2">
                  {'★'.repeat(Math.floor(state.selectedExpert.rating))}
                </div>
                <span className="text-sm text-gray-500">({state.selectedExpert.rating})</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-center text-gray-700 mb-6">
                <p className="text-sm">どの方法で相談しますか？</p>
              </div>
              
              {/* 電話相談ボタン */}
              {state.selectedExpert.contact_info.phone_number && (
                <button
                  onClick={() => {
                    window.location.href = `tel:${state.selectedExpert?.contact_info.phone_number}`;
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer flex items-center justify-center text-sm sm:text-base"
                >
                  <i className="fas fa-phone mr-3 text-lg"></i>
                  <div className="text-left">
                    <div className="text-base sm:text-lg">電話で相談</div>
                    <div className="text-xs sm:text-sm opacity-90">{state.selectedExpert.contact_info.phone_number}</div>
                  </div>
                </button>
              )}
              
              {/* LINE相談ボタン */}
              {state.selectedExpert.contact_info.line_url && (
                <button
                  onClick={() => {
                    window.open(sanitizeUrl(state.selectedExpert?.contact_info.line_url || ''), '_blank');
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer flex items-center justify-center text-sm sm:text-base"
                >
                  <i className="fab fa-line mr-3 text-lg"></i>
                  <div className="text-left">
                    <div className="text-base sm:text-lg">LINEで相談</div>
                    <div className="text-xs sm:text-sm opacity-90">チャットでお気軽に相談</div>
                  </div>
                </button>
              )}
              
              {/* メール相談ボタン */}
              {(state.selectedExpert.contact_info as any).email && (
                <button
                  onClick={() => {
                    const email = (state.selectedExpert?.contact_info as any)?.email;
                    if (email) {
                      window.location.href = `mailto:${email}?subject=資産運用相談の件&body=お名前:%0D%0A電話番号:%0D%0A相談内容:%0D%0A`;
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer flex items-center justify-center text-sm sm:text-base"
                  aria-label={`${state.selectedExpert?.name}にメールで相談する`}
                  role="button"
                >
                  <i className="fas fa-envelope mr-3 text-lg"></i>
                  <div className="text-left">
                    <div className="text-base sm:text-lg">メールで相談</div>
                    <div className="text-xs sm:text-sm opacity-90">詳細なご相談も可能</div>
                  </div>
                </button>
              )}
              
              {/* 相談時間の表示 */}
              {state.selectedExpert.contact_info.consultation_hours && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-800 font-medium mb-1">
                    <i className="fas fa-clock mr-2"></i>相談可能時間
                  </div>
                  <div className="text-sm text-blue-700">
                    {state.selectedExpert.contact_info.consultation_hours}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                dispatch({ type: 'SET_EXPERT_MODAL', payload: false });
                dispatch({ type: 'SET_SELECTED_EXPERT', payload: null });
              }}
              className="w-full mt-4 sm:mt-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer text-sm sm:text-base"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-12 pb-20" style={{ fontFamily: 'var(--font-primary)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        <div className="luxury-card p-4 sm:p-6 md:p-8 lg:p-10 text-center shadow-2xl">
          <div className="mb-8">
            <div 
              className="inline-block p-5 rounded-full mb-5 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <i className="fas fa-chart-line text-white text-3xl"></i>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-2 leading-tight">
              診断結果
            </h1>
            <p className="text-gray-600 text-lg">
              あなたの資産運用プランをご提案します
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 md:p-8 rounded-xl mb-6 md:mb-8 shadow-sm">
            <div className="text-center">
              <p className="text-gray-700 text-lg mb-4">
                <strong>{futureAge}歳時点での予想資産額</strong>
              </p>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-blue-600 mb-2">
                {state.displayAmount.toLocaleString()}
                <span className="text-2xl text-gray-600">万円</span>
              </div>
              <p className="text-gray-600">
                現在{userAge}歳から10年間の資産運用で目指せる金額です
              </p>
            </div>
          </div>

          {/* AI アドバイス セクション */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
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
          {state.recommendedProducts.length > 0 && (
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center justify-center">
                <i className="fas fa-star text-yellow-500 mr-2"></i>
                あなたにおすすめの金融商品
              </h2>
              
              <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2">
                {state.recommendedProducts.map((product, index) => (
                <div key={product.id} className="bg-gray-50 p-3 sm:p-4 md:p-5 rounded-lg text-left hover:shadow-md transition-shadow duration-200">
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
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.tags?.map(tag => (
                      <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
{/* 商品リンクボタンセクションを非表示
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                    {(product as any).url && (
                      <a 
                        href={sanitizeUrl((product as any).url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer text-center"
                      >
                        <i className="fas fa-info-circle mr-2"></i>
                        詳細を見る
                      </a>
                    )}
                    {(product as any).application_url && (
                      <a 
                        href={sanitizeUrl((product as any).application_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer text-center"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        お申し込み
                      </a>
                    )}
                    {!(product as any).url && !(product as any).application_url && (
                      <div className="text-center text-gray-500 text-sm py-2">
                        <i className="fas fa-info-circle mr-2"></i>
                        詳細情報は準備中です
                      </div>
                    )}
                  </div>
                  */}
                </div>
              ))}
              </div>
            </div>
          )}

          {/* 専門家相談セクション */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <i className="fas fa-user-tie text-green-600 mr-2"></i>
              専門家によるサポート
            </h2>
            <p className="text-gray-600 mb-6">
              より詳しい資産運用プランについて、経験豊富なファイナンシャルプランナーがご相談をお受けします。
            </p>
            
            {state.financialPlanners.length > 0 && (
              <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2 mb-4 md:mb-6">
                {state.financialPlanners.map((planner) => (
                  <div key={planner.id} className="bg-gray-50 p-3 sm:p-4 md:p-5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow duration-200">
                    <img 
                      src={sanitizeUrl(planner.image_url)} 
                      alt={sanitizeText(planner.name)}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover flex-shrink-0"
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
                    <button
                      onClick={() => {
                        dispatch({ type: 'SET_SELECTED_EXPERT', payload: planner });
                        dispatch({ type: 'SET_EXPERT_MODAL', payload: true });
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer text-sm sm:text-base w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto"
                    >
                      <i className="fas fa-comments mr-2"></i>
                      相談する
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <MCPFinancialAssistant />
          </div>


          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                  alert('診断結果のURLをコピーしました！\nSNSやメールで簡単にシェアできます。');
                }).catch(() => {
                  // フォールバック: モーダルでURLを表示（XSS対策済み）
                  const modal = document.createElement('div');
                  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
                  
                  const modalContent = document.createElement('div');
                  modalContent.style.cssText = 'background:white;padding:20px;border-radius:10px;max-width:400px;margin:20px;';
                  
                  const title = document.createElement('h3');
                  title.style.cssText = 'margin:0 0 15px 0;';
                  title.textContent = '診断結果を共有';
                  
                  const description = document.createElement('p');
                  description.style.cssText = 'margin:0 0 15px 0;';
                  description.textContent = '以下のURLをコピーして共有してください：';
                  
                  const input = document.createElement('input');
                  input.type = 'text';
                  input.value = url;
                  input.readOnly = true;
                  input.style.cssText = 'width:100%;padding:10px;border:1px solid #ccc;border-radius:5px;margin:0 0 15px 0;';
                  input.onclick = function() { this.select(); };
                  
                  const closeButton = document.createElement('button');
                  closeButton.textContent = '閉じる';
                  closeButton.style.cssText = 'background:#007bff;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;';
                  closeButton.onclick = function() { modal.remove(); };
                  
                  modalContent.appendChild(title);
                  modalContent.appendChild(description);
                  modalContent.appendChild(input);
                  modalContent.appendChild(closeButton);
                  modal.appendChild(modalContent);
                  document.body.appendChild(modal);
                });
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer text-sm sm:text-base"
              aria-label="診断結果のURLをクリップボードにコピーしてシェアする"
            >
              <i className="fas fa-share mr-2"></i>
              この結果をシェア
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer text-sm sm:text-base"
              aria-label="診断結果をプリンターで印刷する"
            >
              <i className="fas fa-print mr-2"></i>
              結果を印刷
            </button>
            <button
              onClick={onReturnToStart}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer text-sm sm:text-base"
              aria-label="ホームページに戻って新しい診断を始める"
            >
              <i className="fas fa-home mr-2"></i>
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default DiagnosisResultsPage;
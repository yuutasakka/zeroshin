import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import CryptoJS from 'crypto-js';
import { UserSessionData, FinancialProduct, Company, Testimonial, NotificationSettings, EmailNotificationConfig, SlackNotificationConfig, LineNotificationConfig, ChatWorkNotificationConfig, LegalLink } from '../types';
import { diagnosisFormMapping } from '../data/diagnosisFormMapping';
import { allFinancialProducts as defaultFinancialProducts } from '../data/financialProductsData';
import { defaultTestimonialsData } from '../data/testimonialsData';
import { 
  ReasonsToChooseData, 
  FirstConsultationOffer, 
  defaultReasonsToChooseData, 
  defaultFirstConsultationOffer,
  HeaderData,
  MainVisualData,
  FooterData,
  defaultHeaderData,
  defaultMainVisualData,
  defaultFooterData
} from '../data/homepageContentData';
import { SECURITY_CONFIG, SUPABASE_CONFIG, secureLog } from '../security.config';
import { SupabaseAdminAPI, SecureStorage, createSupabaseClient } from './adminUtils';
import { useColorTheme } from './ColorThemeContext';

const supabaseConfig = createSupabaseClient();


interface AdminDashboardPageProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

type AdminViewMode = 'userHistory' | 'productSettings' | 'testimonialSettings' | 'analyticsSettings' | 'notificationSettings' | 'legalLinksSettings' | 'adminSettings' | 'homepageContentSettings' | 'headerAndVisualSettings' | 'colorThemeSettings';

interface DashboardStats {
    totalDiagnoses: number;
    diagnosesLast7Days: number;
    averageInvestmentAmount: number;
    mostCommonPurpose: string;
    ageDistribution: Record<string, string>; // Store as percentage string
}

const initialNotificationSettings: NotificationSettings = {
    email: { enabled: false, recipientEmails: '' },
    slack: { enabled: false, webhookUrl: '', channel: '' },
    line: { enabled: false, accessToken: '' },
    chatwork: { enabled: false, apiToken: '', roomId: '' },
};


const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onLogout, onNavigateHome }) => {
  const { currentTheme, setCurrentTheme, themes } = useColorTheme();
  const [userSessions, setUserSessions] = useState<UserSessionData[]>([]);
  const [viewMode, setViewMode] = useState<AdminViewMode>('userHistory');
  const [sessionValid, setSessionValid] = useState<boolean>(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(0);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalDiagnoses: 0,
    diagnosesLast7Days: 0,
    averageInvestmentAmount: 0,
    mostCommonPurpose: 'N/A',
    ageDistribution: {},
  });
  
  // Product Settings State
  const [productsForEditing, setProductsForEditing] = useState<FinancialProduct[]>([]);
  const [productSettingsStatus, setProductSettingsStatus] = useState<string>('');

  // Testimonial Settings State
  const [testimonialsForEditing, setTestimonialsForEditing] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null); // For add/edit form
  const [testimonialStatus, setTestimonialStatus] = useState<string>('');
  const [showTestimonialModal, setShowTestimonialModal] = useState<boolean>(false);

  // Analytics Settings State
  const [trackingScripts, setTrackingScripts] = useState<{ head: string, bodyEnd: string }>({ head: '', bodyEnd: '' });
  const [analyticsSettingsStatus, setAnalyticsSettingsStatus] = useState<string>('');

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialNotificationSettings);
  const [notificationSettingsStatus, setNotificationSettingsStatus] = useState<string>('');

  // Legal Links Settings State
  const [legalLinks, setLegalLinks] = useState<LegalLink[]>([]);
  const [editingLegalLink, setEditingLegalLink] = useState<Partial<LegalLink> | null>(null);
  const [legalLinksStatus, setLegalLinksStatus] = useState<string>('');

  // Admin Settings State
  const [adminPhoneNumber, setAdminPhoneNumber] = useState<string>('');
  const [adminBackupCode, setAdminBackupCode] = useState<string>('');
  const [adminSettingsStatus, setAdminSettingsStatus] = useState<string>('');

  // Homepage Content Settings State
  const [reasonsToChoose, setReasonsToChoose] = useState<ReasonsToChooseData>(defaultReasonsToChooseData);
  const [firstConsultationOffer, setFirstConsultationOffer] = useState<FirstConsultationOffer>(defaultFirstConsultationOffer);
  const [homepageContentStatus, setHomepageContentStatus] = useState<string>('');
  
  // ヘッダー・メインビジュアル・フッター設定のstate
  const [headerData, setHeaderData] = useState<HeaderData>(defaultHeaderData);
  const [mainVisualData, setMainVisualData] = useState<MainVisualData>(defaultMainVisualData);
  const [footerData, setFooterData] = useState<FooterData>(defaultFooterData);
  const [headerVisualStatus, setHeaderVisualStatus] = useState<string>('');


  // セッション有効性チェック
  const checkSessionValidity = () => {
    try {
      const session = SecureStorage.getSecureItem('admin_session');
      if (!session) {
        setSessionValid(false);
        return false;
      }

      const now = Date.now();
      
      if (now > session.expires) {
        setSessionValid(false);
        localStorage.removeItem('admin_session');
        sessionStorage.removeItem('admin_authenticated');
        return false;
      }

      const timeRemaining = session.expires - now;
      setSessionTimeRemaining(timeRemaining);
      
      // セッション期限が5分以内の場合は警告
      if (timeRemaining < 5 * 60 * 1000) {
        secureLog('セッションの有効期限が近づいています');
      }

      return true;
    } catch (error) {
      secureLog('セッションデータの解析エラー:', error);
      setSessionValid(false);
      return false;
    }
  };

  // セッション延長
  const extendSession = () => {
    try {
      const session = SecureStorage.getSecureItem('admin_session');
      if (session) {
        session.expires = Date.now() + (30 * 60 * 1000); // 30分延長
        SecureStorage.setSecureItem('admin_session', session);
        setSessionTimeRemaining(30 * 60 * 1000);
      }
    } catch (error) {
      secureLog('セッション延長エラー:', error);
    }
  };

  useEffect(() => {
    // セッション有効性の初期チェック
    if (!checkSessionValidity()) {
      onLogout();
      return;
    }

    // 30秒ごとにセッションをチェック
    const sessionTimer = setInterval(() => {
      if (!checkSessionValidity()) {
        onLogout();
      }
    }, 30000);

    // Load user sessions from Supabase
    const loadUserSessions = async () => {
      try {
        // まずローカルストレージから読み込み（後方互換性）
        const storedSessionsString = localStorage.getItem('userSessions');
        let loadedSessions: UserSessionData[] = [];
        if (storedSessionsString) {
          try {
            loadedSessions = JSON.parse(storedSessionsString);
            setUserSessions(loadedSessions);
            calculateDashboardStats(loadedSessions);
          } catch (e) {
            secureLog("Error parsing user sessions from localStorage:", e);
          }
        }

        // Supabaseからも読み込み（将来的にはこちらがメイン）
        // 実装はローカルストレージのデータで動作

      } catch (error) {
        secureLog('ユーザーセッションの読み込みエラー:', error);
      }
    };

    loadUserSessions();

    // Load admin settings from Supabase
    const loadAdminSettings = async () => {
      try {
        secureLog('管理者設定をSupabaseから読み込み中...');
        
        // まずSupabaseから最新データを取得（Edge Function経由）
        const supabaseCredentials = await SupabaseAdminAPI.loadAdminCredentialsViaFunction();
        
        if (supabaseCredentials) {
          secureLog('Supabaseから管理者設定を取得');
          setAdminPhoneNumber(supabaseCredentials.phone_number || '09012345678');
          setAdminBackupCode(supabaseCredentials.backup_code || 'MT-BACKUP-2024');
          
          // ローカルストレージにもバックアップとして保存
          const localCredentials = {
            username: 'admin',
            backup_code: supabaseCredentials.backup_code,
            phone_number: supabaseCredentials.phone_number,
            last_updated: new Date().toISOString()
          };
          SecureStorage.setSecureItem('admin_credentials', localCredentials);
          return;
        }
        
        // Supabaseから取得できない場合はローカルストレージを確認
        secureLog('Supabaseから取得できませんでした。ローカルストレージを確認中...');
        const credentials = SecureStorage.getSecureItem('admin_credentials');
        if (credentials) {
          secureLog('ローカルストレージから管理者設定を取得');
          setAdminPhoneNumber(credentials.phone_number || '09012345678');
          setAdminBackupCode(credentials.backup_code || 'MT-BACKUP-2024');
        } else {
          secureLog('デフォルト管理者設定を使用');
          setAdminPhoneNumber('09012345678');
          setAdminBackupCode('MT-BACKUP-2024');
        }
      } catch (error) {
        secureLog('管理者設定の読み込みエラー:', error);
        
        // エラー時はローカルストレージをフォールバック
        const credentials = SecureStorage.getSecureItem('admin_credentials');
        if (credentials) {
          setAdminPhoneNumber(credentials.phone_number || '09012345678');
          setAdminBackupCode(credentials.backup_code || 'MT-BACKUP-2024');
        } else {
          setAdminPhoneNumber('09012345678');
          setAdminBackupCode('MT-BACKUP-2024');
        }
      }
    };

    loadAdminSettings();

    return () => {
      clearInterval(sessionTimer);
    };
  }, [onLogout]);

  useEffect(() => {
    // Load all settings from Supabase first, fallback to localStorage
    const loadAllSettings = async () => {
      // Load financial products for editing
      try {
        const supabaseProducts = await SupabaseAdminAPI.loadAdminSetting('financial_products');
        if (supabaseProducts) {
          secureLog('Supabaseから商品設定を読み込み');
          setProductsForEditing(supabaseProducts);
          // ローカルストレージにもバックアップ保存
          localStorage.setItem('customFinancialProducts', JSON.stringify(supabaseProducts));
        } else {
          // フォールバック: ローカルストレージから読み込み
          const customProductsString = localStorage.getItem('customFinancialProducts');
          if (customProductsString) {
            try {
              const customProducts = JSON.parse(customProductsString);
              setProductsForEditing(customProducts);
            } catch (e) {
              secureLog("Error parsing custom financial products from localStorage:", e);
              setProductsForEditing(JSON.parse(JSON.stringify(defaultFinancialProducts))); // Deep copy
            }
          } else {
            setProductsForEditing(JSON.parse(JSON.stringify(defaultFinancialProducts))); // Deep copy
          }
        }
      } catch (error) {
        secureLog('商品設定のSupabase読み込みエラー、ローカルストレージを使用:', error);
        const customProductsString = localStorage.getItem('customFinancialProducts');
        if (customProductsString) {
          try {
            const customProducts = JSON.parse(customProductsString);
            setProductsForEditing(customProducts);
          } catch (e) {
            secureLog("Error parsing custom financial products from localStorage:", e);
            setProductsForEditing(JSON.parse(JSON.stringify(defaultFinancialProducts))); // Deep copy
          }
        } else {
          setProductsForEditing(JSON.parse(JSON.stringify(defaultFinancialProducts))); // Deep copy
        }
      }

      // Load testimonials for editing
      try {
        const supabaseTestimonials = await SupabaseAdminAPI.loadAdminSetting('testimonials');
        if (supabaseTestimonials) {
          secureLog('Supabaseからお客様の声を読み込み');
          setTestimonialsForEditing(supabaseTestimonials);
          // ローカルストレージにもバックアップ保存
          localStorage.setItem('customTestimonials', JSON.stringify(supabaseTestimonials));
        } else {
          // フォールバック: ローカルストレージから読み込み
          const customTestimonialsString = localStorage.getItem('customTestimonials');
          if (customTestimonialsString) {
            try {
              const customTestimonials = JSON.parse(customTestimonialsString);
              setTestimonialsForEditing(customTestimonials);
            } catch (e) {
              secureLog("Error parsing custom testimonials from localStorage:", e);
              setTestimonialsForEditing(JSON.parse(JSON.stringify(defaultTestimonialsData))); // Deep copy
            }
          } else {
            setTestimonialsForEditing(JSON.parse(JSON.stringify(defaultTestimonialsData))); // Deep copy
          }
        }
      } catch (error) {
        secureLog('お客様の声のSupabase読み込みエラー、ローカルストレージを使用:', error);
        const customTestimonialsString = localStorage.getItem('customTestimonials');
        if (customTestimonialsString) {
          try {
            const customTestimonials = JSON.parse(customTestimonialsString);
            setTestimonialsForEditing(customTestimonials);
          } catch (e) {
            secureLog("Error parsing custom testimonials from localStorage:", e);
            setTestimonialsForEditing(JSON.parse(JSON.stringify(defaultTestimonialsData))); // Deep copy
          }
        } else {
          setTestimonialsForEditing(JSON.parse(JSON.stringify(defaultTestimonialsData))); // Deep copy
        }
      }

      // Load tracking scripts
      try {
        const supabaseTrackingScripts = await SupabaseAdminAPI.loadAdminSetting('tracking_scripts');
        if (supabaseTrackingScripts) {
          secureLog('Supabaseからアナリティクス設定を読み込み');
          setTrackingScripts(supabaseTrackingScripts);
          // ローカルストレージにもバックアップ保存
          localStorage.setItem('customTrackingScripts', JSON.stringify(supabaseTrackingScripts));
        } else {
          // フォールバック: ローカルストレージから読み込み
          const storedTrackingScripts = localStorage.getItem('customTrackingScripts');
          if (storedTrackingScripts) {
            try {
              const parsedScripts = JSON.parse(storedTrackingScripts);
              setTrackingScripts(parsedScripts);
            } catch (e) {
              secureLog("Error parsing tracking scripts from localStorage:", e);
              setTrackingScripts({ head: '', bodyEnd: '' });
            }
          } else {
            setTrackingScripts({ head: '', bodyEnd: '' });
          }
        }
      } catch (error) {
        secureLog('アナリティクス設定のSupabase読み込みエラー、ローカルストレージを使用:', error);
        const storedTrackingScripts = localStorage.getItem('customTrackingScripts');
        if (storedTrackingScripts) {
          try {
            const parsedScripts = JSON.parse(storedTrackingScripts);
            setTrackingScripts(parsedScripts);
          } catch (e) {
            secureLog("Error parsing tracking scripts from localStorage:", e);
            setTrackingScripts({ head: '', bodyEnd: '' });
          }
        } else {
          setTrackingScripts({ head: '', bodyEnd: '' });
        }
      }

      // Load notification settings
      try {
        const supabaseNotificationSettings = await SupabaseAdminAPI.loadAdminSetting('notification_settings');
        if (supabaseNotificationSettings) {
          secureLog('Supabaseから通知設定を読み込み');
          setNotificationSettings({ ...initialNotificationSettings, ...supabaseNotificationSettings });
          // ローカルストレージにもバックアップ保存
          localStorage.setItem('notificationConfigurations', JSON.stringify(supabaseNotificationSettings));
        } else {
          // フォールバック: ローカルストレージから読み込み
          const storedNotificationSettings = localStorage.getItem('notificationConfigurations');
          if (storedNotificationSettings) {
            try {
              const parsedSettings = JSON.parse(storedNotificationSettings);
              setNotificationSettings({ ...initialNotificationSettings, ...parsedSettings });
            } catch (e) {
              secureLog("Error parsing notification settings from localStorage:", e);
              setNotificationSettings(initialNotificationSettings);
            }
          } else {
            setNotificationSettings(initialNotificationSettings);
          }
        }
      } catch (error) {
        secureLog('通知設定のSupabase読み込みエラー、ローカルストレージを使用:', error);
        const storedNotificationSettings = localStorage.getItem('notificationConfigurations');
        if (storedNotificationSettings) {
          try {
            const parsedSettings = JSON.parse(storedNotificationSettings);
            setNotificationSettings({ ...initialNotificationSettings, ...parsedSettings });
          } catch (e) {
            secureLog("Error parsing notification settings from localStorage:", e);
            setNotificationSettings(initialNotificationSettings);
          }
        } else {
          setNotificationSettings(initialNotificationSettings);
        }
      }

      // Load legal links
      await loadLegalLinksFromSupabase();

      // Load homepage content settings
      try {
        // 選ばれる理由
        const supabaseReasons = await loadHomepageContentFromSupabase('reasons_to_choose');
        if (supabaseReasons) {
          secureLog('Supabaseから選ばれる理由を読み込み');
          setReasonsToChoose(supabaseReasons);
        } else {
          secureLog('デフォルトの選ばれる理由を使用');
          setReasonsToChoose(defaultReasonsToChooseData);
        }

        // 初回相談限定特典
        const supabaseOffer = await loadHomepageContentFromSupabase('first_consultation_offer');
        if (supabaseOffer) {
          secureLog('Supabaseから初回相談限定特典を読み込み');
          setFirstConsultationOffer(supabaseOffer);
        } else {
          secureLog('デフォルトの初回相談限定特典を使用');
          setFirstConsultationOffer(defaultFirstConsultationOffer);
        }

        // ヘッダーデータ
        const supabaseHeader = await loadHomepageContentFromSupabase('header_data');
        if (supabaseHeader) {
          secureLog('Supabaseからヘッダーデータを読み込み');
          setHeaderData(supabaseHeader);
        } else {
          secureLog('デフォルトのヘッダーデータを使用');
          setHeaderData(defaultHeaderData);
        }

        // メインビジュアルデータ
        const supabaseMainVisual = await loadHomepageContentFromSupabase('main_visual_data');
        if (supabaseMainVisual) {
          secureLog('Supabaseからメインビジュアルデータを読み込み');
          setMainVisualData(supabaseMainVisual);
        } else {
          secureLog('デフォルトのメインビジュアルデータを使用');
          setMainVisualData(defaultMainVisualData);
        }

        // フッターデータ
        const supabaseFooter = await loadHomepageContentFromSupabase('footer_data');
        if (supabaseFooter) {
          secureLog('Supabaseからフッターデータを読み込み');
          setFooterData(supabaseFooter);
        } else {
          secureLog('デフォルトのフッターデータを使用');
          setFooterData(defaultFooterData);
        }
      } catch (error) {
        secureLog('ホームページコンテンツの読み込みエラー、デフォルトデータを使用:', error);
        setReasonsToChoose(defaultReasonsToChooseData);
        setFirstConsultationOffer(defaultFirstConsultationOffer);
        setHeaderData(defaultHeaderData);
        setMainVisualData(defaultMainVisualData);
        setFooterData(defaultFooterData);
      }
    };

    loadAllSettings();
  }, []);

  const calculateDashboardStats = (sessions: UserSessionData[]) => {
    const totalDiagnoses = sessions.length;
    
    // 過去7日間の診断数を計算
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const diagnosesLast7Days = sessions.filter(session => 
      new Date(session.timestamp).getTime() > sevenDaysAgo
    ).length;
    
    setDashboardStats({
      totalDiagnoses,
      diagnosesLast7Days,
      averageInvestmentAmount: 150, // Placeholder
      mostCommonPurpose: 'retirement', // Placeholder
      ageDistribution: {}
    });
  };

  const getAnswerLabel = (questionId: keyof typeof diagnosisFormMapping, value: string): string => {
    const mapping = diagnosisFormMapping[questionId];
    if (mapping && typeof mapping === 'object' && value in mapping) {
      return (mapping as Record<string, string>)[value];
    }
    return value;
  };

  const handleExportCSV = () => {
    if (userSessions.length === 0) {
      alert("エクスポートするデータがありません。");
      return;
    }
    const headers = ["ID", "回答日時", "電話番号", "年齢", "投資経験", "目的", "投資可能額/月", "開始時期"];
    const rows = userSessions.map(session => [
      session.id,
      new Date(session.timestamp).toLocaleString('ja-JP'),
      session.phoneNumber,
      getAnswerLabel('age', session.diagnosisAnswers.age),
      getAnswerLabel('experience', session.diagnosisAnswers.experience),
      getAnswerLabel('purpose', session.diagnosisAnswers.purpose),
      getAnswerLabel('amount', session.diagnosisAnswers.amount),
      getAnswerLabel('timing', session.diagnosisAnswers.timing),
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
                     + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `moneyticket_diagnoses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Product Settings Handlers
  const handleProductInputChange = (productIndex: number, companyIndex: number, field: keyof Company, value: string) => {
    const updatedProducts = productsForEditing.map((p, pIdx) => {
      if (pIdx === productIndex && p.representativeCompanies) {
        const updatedCompanies = p.representativeCompanies.map((c, cIdx) => {
          if (cIdx === companyIndex) {
            return { ...c, [field]: value };
          }
          return c;
        });
        return { ...p, representativeCompanies: updatedCompanies };
      }
      return p;
    });
    setProductsForEditing(updatedProducts);
  };

  const handleSaveProductSettings = async () => {
    secureLog('handleSaveProductSettings関数が呼び出されました');
    secureLog('保存する商品データ:', productsForEditing);
    
    setProductSettingsStatus('💾 商品設定を保存中...');
    
    try {
      // 商品データの基本チェック
      if (!productsForEditing || productsForEditing.length === 0) {
        setProductSettingsStatus('❌ 商品設定データがありません。');
        setTimeout(() => setProductSettingsStatus(''), 5000);
        return;
      }

      // 既存データとの比較（変更がない場合のチェック）
      const existingProductsString = localStorage.getItem('customFinancialProducts');
      if (existingProductsString) {
        try {
          const existingProducts = JSON.parse(existingProductsString);
          if (JSON.stringify(existingProducts) === JSON.stringify(productsForEditing)) {
            setProductSettingsStatus('❌ 商品設定に変更がありません。');
            setTimeout(() => setProductSettingsStatus(''), 5000);
            return;
          }
        } catch (parseError) {
          secureLog('既存商品データの解析でエラー（新規保存として処理）:', parseError);
        }
      }

      // まずローカルストレージに確実に保存
      localStorage.setItem('customFinancialProducts', JSON.stringify(productsForEditing));
      secureLog('商品設定をローカルストレージに保存完了');
      
      // Supabaseにも保存を試行
      try {
        const supabaseSuccess = await SupabaseAdminAPI.saveAdminSetting('financial_products', productsForEditing);
        if (supabaseSuccess) {
          secureLog('Supabaseにも商品設定を保存完了');
          setProductSettingsStatus('✅ 商品設定が正常に保存され、データベースに反映されました');
        } else {
          secureLog('Supabase保存に失敗しましたが、ローカル保存は成功');
          setProductSettingsStatus('✅ 商品設定が正常に保存されました（ローカル保存）');
        }
      } catch (supabaseError) {
        secureLog('Supabase保存でエラーが発生しましたが、ローカル保存は成功:', supabaseError);
        setProductSettingsStatus('✅ 商品設定が正常に保存されました（ローカル保存）');
      }
      
      setTimeout(() => setProductSettingsStatus(''), 3000);
    } catch (error) {
      secureLog("Error saving product settings:", error);
      setProductSettingsStatus('❌ 保存中にエラーが発生しました。');
      setTimeout(() => setProductSettingsStatus(''), 5000);
    }
  };

  // Testimonial Settings Handlers
  const handleOpenTestimonialModal = (testimonial?: Testimonial) => {
    if (testimonial) {
        setEditingTestimonial({ ...testimonial });
    } else {
        setEditingTestimonial({ id: '', nameAndRole: '', avatarEmoji: '😊', ratingStars: 5, text: '' });
    }
    setShowTestimonialModal(true);
    setTestimonialStatus('');
  };

  const handleCloseTestimonialModal = () => {
    setShowTestimonialModal(false);
    setEditingTestimonial(null);
  };

  const handleTestimonialFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingTestimonial) return;
    const { name, value } = e.target;
    setEditingTestimonial(prev => ({
        ...prev,
        [name]: name === 'ratingStars' ? parseInt(value, 10) : value,
    }));
  };
  
  const handleSaveTestimonialForm = (e: FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial || !editingTestimonial.nameAndRole || !editingTestimonial.text) {
        setTestimonialStatus('名前と役割、本文は必須です。');
        return;
    }

    let updatedTestimonials;
    if (editingTestimonial.id && editingTestimonial.id !== '') { // Editing existing
        updatedTestimonials = testimonialsForEditing.map(t =>
            t.id === editingTestimonial!.id ? { ...editingTestimonial } as Testimonial : t
        );
    } else { // Adding new
        const newTestimonial: Testimonial = {
            ...editingTestimonial,
            id: `testimonial_${new Date().getTime()}_${Math.random().toString(36).substring(2,9)}`, // ensure unique id
        } as Testimonial;
        updatedTestimonials = [...testimonialsForEditing, newTestimonial];
    }
    setTestimonialsForEditing(updatedTestimonials);
    setTestimonialStatus('変更は一時保存されました。「設定を保存」をクリックして確定してください。');
    handleCloseTestimonialModal();
  };

  const handleDeleteTestimonial = (testimonialId: string) => {
    if (window.confirm("このお客様の声を本当に削除しますか？")) {
        setTestimonialsForEditing(testimonialsForEditing.filter(t => t.id !== testimonialId));
        setTestimonialStatus('お客様の声がリストから削除されました。「設定を保存」で確定してください。');
    }
  };
  
  const handleSaveTestimonialSettings = async () => {
    setTestimonialStatus('📝 お客様の声を保存中...');
    
    try {
        // お客様の声データの基本チェック
        if (!testimonialsForEditing || testimonialsForEditing.length === 0) {
          setTestimonialStatus('❌ お客様の声のデータがありません。');
          setTimeout(() => setTestimonialStatus(''), 5000);
          return;
        }

        // 既存データとの比較（変更がない場合のチェック）
        const existingTestimonialsString = localStorage.getItem('customTestimonials');
        if (existingTestimonialsString) {
          try {
            const existingTestimonials = JSON.parse(existingTestimonialsString);
            if (JSON.stringify(existingTestimonials) === JSON.stringify(testimonialsForEditing)) {
              setTestimonialStatus('❌ お客様の声に変更がありません。');
              setTimeout(() => setTestimonialStatus(''), 5000);
              return;
            }
          } catch (parseError) {
            secureLog('既存お客様の声データの解析でエラー（新規保存として処理）:', parseError);
          }
        }

        // まずローカルストレージに保存
        localStorage.setItem('customTestimonials', JSON.stringify(testimonialsForEditing));
        secureLog('お客様の声をローカルストレージに保存完了');
        
        // Supabaseにも保存を試行
        try {
          const supabaseSuccess = await SupabaseAdminAPI.saveAdminSetting('testimonials', testimonialsForEditing);
          if (supabaseSuccess) {
            secureLog('Supabaseにもお客様の声を保存完了');
            setTestimonialStatus('✅ お客様の声が正常に保存され、データベースに反映されました');
          } else {
            secureLog('Supabase保存に失敗しましたが、ローカル保存は成功');
            setTestimonialStatus('✅ お客様の声が正常に保存されました（ローカル保存）');
          }
        } catch (supabaseError) {
          secureLog('Supabase保存でエラーが発生しましたが、ローカル保存は成功:', supabaseError);
          setTestimonialStatus('✅ お客様の声が正常に保存されました（ローカル保存）');
        }
        
        setTimeout(() => setTestimonialStatus(''), 3000);
    } catch (error) {
        secureLog("Error saving testimonial settings:", error);
        setTestimonialStatus('❌ 保存中にエラーが発生しました。');
        setTimeout(() => setTestimonialStatus(''), 5000);
    }
  };

  // Analytics Settings Handlers
  const handleTrackingScriptChange = (part: 'head' | 'bodyEnd', value: string) => {
    setTrackingScripts(prev => ({ ...prev, [part]: value }));
  };

  const handleSaveTrackingScripts = async () => {
      setAnalyticsSettingsStatus('📊 アナリティクス設定を保存中...');
      
      try {
          // 既存データとの比較（変更がない場合のチェック）
          const existingScriptsString = localStorage.getItem('customTrackingScripts');
          if (existingScriptsString) {
            try {
              const existingScripts = JSON.parse(existingScriptsString);
              if (JSON.stringify(existingScripts) === JSON.stringify(trackingScripts)) {
                setAnalyticsSettingsStatus('❌ アナリティクス設定に変更がありません。');
                setTimeout(() => setAnalyticsSettingsStatus(''), 5000);
                return;
              }
            } catch (parseError) {
              secureLog('既存アナリティクス設定の解析でエラー（新規保存として処理）:', parseError);
            }
          }

          // まずローカルストレージに保存
          localStorage.setItem('customTrackingScripts', JSON.stringify(trackingScripts));
          secureLog('アナリティクス設定をローカルストレージに保存完了');
          
          // Supabaseにも保存を試行
          try {
            const supabaseSuccess = await SupabaseAdminAPI.saveAdminSetting('tracking_scripts', trackingScripts);
            if (supabaseSuccess) {
              secureLog('Supabaseにもアナリティクス設定を保存完了');
              setAnalyticsSettingsStatus('✅ アナリティクス設定が正常に保存され、データベースに反映されました');
            } else {
              secureLog('Supabase保存に失敗しましたが、ローカル保存は成功');
              setAnalyticsSettingsStatus('✅ アナリティクス設定が正常に保存されました（ローカル保存）');
            }
          } catch (supabaseError) {
            secureLog('Supabase保存でエラーが発生しましたが、ローカル保存は成功:', supabaseError);
            setAnalyticsSettingsStatus('✅ アナリティクス設定が正常に保存されました（ローカル保存）');
          }
          
          setTimeout(() => setAnalyticsSettingsStatus(''), 3000);
      } catch (error) {
          secureLog("Error saving tracking scripts:", error);
          setAnalyticsSettingsStatus('❌ 保存中にエラーが発生しました。');
          setTimeout(() => setAnalyticsSettingsStatus(''), 5000);
      }
  };

  // Notification Settings Handlers
  const handleNotificationSettingChange = (
    channel: keyof NotificationSettings,
    field: keyof EmailNotificationConfig | keyof SlackNotificationConfig | keyof LineNotificationConfig | keyof ChatWorkNotificationConfig | 'enabled',
    value: string | boolean
  ) => {
    setNotificationSettings(prev => ({
        ...prev,
        [channel]: {
            ...prev[channel],
            [field]: value,
        }
    }));
  };

  const handleSaveNotificationSettings = async () => {
    setNotificationSettingsStatus('🔔 通知設定を保存中...');
    
    try {
        // 既存データとの比較（変更がない場合のチェック）
        const existingSettingsString = localStorage.getItem('notificationConfigurations');
        if (existingSettingsString) {
          try {
            const existingSettings = JSON.parse(existingSettingsString);
            if (JSON.stringify(existingSettings) === JSON.stringify(notificationSettings)) {
              setNotificationSettingsStatus('❌ 通知設定に変更がありません。');
              setTimeout(() => setNotificationSettingsStatus(''), 5000);
              return;
            }
          } catch (parseError) {
            secureLog('既存通知設定の解析でエラー（新規保存として処理）:', parseError);
          }
        }

        // まずローカルストレージに保存
        localStorage.setItem('notificationConfigurations', JSON.stringify(notificationSettings));
        secureLog('通知設定をローカルストレージに保存完了');
        
        // Supabaseにも保存を試行
        try {
          const supabaseSuccess = await SupabaseAdminAPI.saveAdminSetting('notification_settings', notificationSettings);
          if (supabaseSuccess) {
            secureLog('Supabaseにも通知設定を保存完了');
            setNotificationSettingsStatus('✅ 通知設定が正常に保存され、データベースに反映されました');
          } else {
            secureLog('Supabase保存に失敗しましたが、ローカル保存は成功');
            setNotificationSettingsStatus('✅ 通知設定が正常に保存されました（ローカル保存）');
          }
        } catch (supabaseError) {
          secureLog('Supabase保存でエラーが発生しましたが、ローカル保存は成功:', supabaseError);
          setNotificationSettingsStatus('✅ 通知設定が正常に保存されました（ローカル保存）');
        }
        
        setTimeout(() => setNotificationSettingsStatus(''), 3000);
    } catch (error) {
        secureLog("Error saving notification settings:", error);
        setNotificationSettingsStatus('❌ 通知設定の保存中にエラーが発生しました。');
        setTimeout(() => setNotificationSettingsStatus(''), 5000);
    }
  };

  // Legal Links Management Functions
  const loadHomepageContentFromSupabase = async (settingKey: string) => {
    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/homepage_content_settings?setting_key=eq.${settingKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.length > 0 ? data[0].setting_data : null;
    } catch (error) {
      secureLog(`ホームページコンテンツ(${settingKey})のSupabase読み込みエラー:`, error);
      return null;
    }
  };

  const loadLegalLinksFromSupabase = async () => {
    try {
      const supabaseLegalLinks = await SupabaseAdminAPI.loadAdminSetting('legal_links');
      if (supabaseLegalLinks) {
        secureLog('Supabaseからリーガルリンクを読み込み');
        setLegalLinks(supabaseLegalLinks);
        // ローカルストレージにもバックアップ保存
        localStorage.setItem('customLegalLinks', JSON.stringify(supabaseLegalLinks));
      } else {
        // フォールバック: ローカルストレージから読み込み
        const storedLinks = localStorage.getItem('customLegalLinks');
        if (storedLinks) {
          setLegalLinks(JSON.parse(storedLinks));
        } else {
          // デフォルトのリーガルリンク
          const defaultLinks: LegalLink[] = [
            { id: 1, link_type: 'privacy_policy', title: 'プライバシーポリシー', url: '#privacy', is_active: true, created_at: '', updated_at: '' },
            { id: 2, link_type: 'terms_of_service', title: '利用規約', url: '#terms', is_active: true, created_at: '', updated_at: '' },
            { id: 3, link_type: 'specified_commercial_transactions', title: '特定商取引法', url: '#scta', is_active: true, created_at: '', updated_at: '' },
            { id: 4, link_type: 'company_info', title: '会社概要', url: '#company', is_active: true, created_at: '', updated_at: '' }
          ];
          setLegalLinks(defaultLinks);
        }
      }
    } catch (error) {
      secureLog('リーガルリンクのSupabase読み込みエラー、ローカルストレージを使用:', error);
      const storedLinks = localStorage.getItem('customLegalLinks');
      if (storedLinks) {
        setLegalLinks(JSON.parse(storedLinks));
      } else {
        // デフォルトのリーガルリンク
        const defaultLinks: LegalLink[] = [
          { id: 1, link_type: 'privacy_policy', title: 'プライバシーポリシー', url: '#privacy', is_active: true, created_at: '', updated_at: '' },
          { id: 2, link_type: 'terms_of_service', title: '利用規約', url: '#terms', is_active: true, created_at: '', updated_at: '' },
          { id: 3, link_type: 'specified_commercial_transactions', title: '特定商取引法', url: '#scta', is_active: true, created_at: '', updated_at: '' },
          { id: 4, link_type: 'company_info', title: '会社概要', url: '#company', is_active: true, created_at: '', updated_at: '' }
        ];
        setLegalLinks(defaultLinks);
      }
    }
  };

  const handleEditLegalLink = (link: LegalLink) => {
    setEditingLegalLink({ ...link });
  };

  const handleLegalLinkFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editingLegalLink) {
      const { name, value, type } = e.target;
      setEditingLegalLink({
        ...editingLegalLink,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      });
    }
  };

  const handleSaveLegalLink = async () => {
    if (!editingLegalLink) return;

    try {
      setLegalLinksStatus('🔗 リーガルリンクを保存中...');
      
      const updatedLinks = legalLinks.map(link => 
        link.id === editingLegalLink.id ? { ...link, ...editingLegalLink } : link
      );
      
      setLegalLinks(updatedLinks);
      
      // まずローカルストレージに保存
      localStorage.setItem('customLegalLinks', JSON.stringify(updatedLinks));
      secureLog('リーガルリンクをローカルストレージに保存完了');
      
      // Supabaseにも保存を試行
      try {
        const supabaseSuccess = await SupabaseAdminAPI.saveAdminSetting('legal_links', updatedLinks);
        if (supabaseSuccess) {
          secureLog('Supabaseにもリーガルリンクを保存完了');
          setLegalLinksStatus('✅ リーガルリンクが正常に保存され、データベースに反映されました');
        } else {
          secureLog('Supabase保存に失敗しましたが、ローカル保存は成功');
          setLegalLinksStatus('✅ リーガルリンクが正常に保存されました（ローカル保存）');
        }
      } catch (supabaseError) {
        secureLog('Supabase保存でエラーが発生しましたが、ローカル保存は成功:', supabaseError);
        setLegalLinksStatus('✅ リーガルリンクが正常に保存されました（ローカル保存）');
      }
      
      setEditingLegalLink(null);
      setTimeout(() => setLegalLinksStatus(''), 3000);
    } catch (error) {
      secureLog('Error saving legal link:', error);
      setLegalLinksStatus('❌ 保存中にエラーが発生しました。');
      setTimeout(() => setLegalLinksStatus(''), 5000);
    }
  };

  const handleCancelLegalLinkEdit = () => {
    setEditingLegalLink(null);
  };

  // 管理者設定保存機能（ローカルストレージ優先、Supabaseはオプション）
  const handleSaveAdminSettings = async () => {
    secureLog('handleSaveAdminSettings関数が呼び出されました');
    secureLog('現在の電話番号:', adminPhoneNumber);
    secureLog('現在のバックアップコード:', adminBackupCode);
    
    setAdminSettingsStatus('保存中...');
    
    try {
      // 入力値の基本チェック
      if (!adminPhoneNumber || adminPhoneNumber.trim() === '') {
        setAdminSettingsStatus('❌ 電話番号を入力してください。');
        setTimeout(() => setAdminSettingsStatus(''), 5000);
        return;
      }

      if (!adminBackupCode || adminBackupCode.trim() === '') {
        setAdminSettingsStatus('❌ バックアップコードを入力してください。');
        setTimeout(() => setAdminSettingsStatus(''), 5000);
        return;
      }

      // 電話番号の形式チェック（数字のみ、10-11桁）
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(adminPhoneNumber)) {
        setAdminSettingsStatus('❌ 電話番号は10桁または11桁の数字で入力してください。');
        setTimeout(() => setAdminSettingsStatus(''), 5000);
        return;
      }

      // バックアップコードの形式チェック
      if (adminBackupCode.length < 8) {
        setAdminSettingsStatus('❌ バックアップコードは8文字以上で入力してください。');
        setTimeout(() => setAdminSettingsStatus(''), 5000);
        return;
      }

      // 変更がない場合のチェック
      const checkCredentials = SecureStorage.getSecureItem('admin_credentials');
      if (checkCredentials) {
        const currentPhone = checkCredentials.phone_number || '09012345678';
        const currentBackup = checkCredentials.backup_code || 'MT-BACKUP-2024';
        
        if (adminPhoneNumber === currentPhone && adminBackupCode === currentBackup) {
          setAdminSettingsStatus('❌ 設定に変更がありません。');
          setTimeout(() => setAdminSettingsStatus(''), 5000);
          return;
        }
      }

      secureLog('管理者設定をローカルストレージに保存中...');
      
      // まずローカルストレージに確実に保存
      let credentials = {
        username: "admin",
        password: SECURITY_CONFIG.IS_PRODUCTION ? "[SETUP_REQUIRED]" : "MoneyTicket2024!", // 開発環境のみ
        backup_code: SECURITY_CONFIG.IS_PRODUCTION ? "[SETUP_REQUIRED]" : "MT-BACKUP-2024", // 開発環境のみ
        phone_number: SECURITY_CONFIG.IS_PRODUCTION ? "[SETUP_REQUIRED]" : "09012345678" // 開発環境のみ
      };

      // 既存認証情報を再取得
      const storedCredentials = SecureStorage.getSecureItem('admin_credentials');
      if (storedCredentials) {
        credentials = { ...credentials, ...storedCredentials };
      }

      // 新しい設定で更新
      const updatedCredentials = {
        ...credentials,
        phone_number: adminPhoneNumber,
        backup_code: adminBackupCode,
        last_updated: new Date().toISOString()
      };

      // ローカルストレージに保存
      SecureStorage.setSecureItem('admin_credentials', updatedCredentials);
      secureLog('ローカルストレージに保存完了');
      
      // Supabaseへの保存は非同期で試行（Edge Function経由）
      try {
        secureLog('Supabaseへの保存を試行中...');
        const supabaseSuccess = await SupabaseAdminAPI.updateAdminCredentialsViaFunction(adminPhoneNumber, adminBackupCode);
        
        if (supabaseSuccess) {
          secureLog('Supabaseにも正常に保存されました');
          setAdminSettingsStatus('✅ 管理者設定が正常に保存され、データベースに反映されました');
        } else {
          secureLog('Supabase保存に失敗しましたが、ローカル保存は成功');
          setAdminSettingsStatus('✅ 管理者設定が正常に保存されました（ローカル保存）');
        }
      } catch (supabaseError) {
        secureLog('Supabase保存でエラーが発生しましたが、ローカル保存は成功:', supabaseError);
        setAdminSettingsStatus('✅ 管理者設定が正常に保存されました（ローカル保存）');
      }
      
      setTimeout(() => setAdminSettingsStatus(''), 3000);

    } catch (error) {
      secureLog('管理者設定保存エラー:', error);
      setAdminSettingsStatus('❌ 保存中にエラーが発生しました。');
      setTimeout(() => setAdminSettingsStatus(''), 5000);
    }
  };

  // 通知テスト機能
  // Homepage Content Settings Handlers
  const saveHomepageContentToSupabase = async (settingKey: string, settingData: any) => {
    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/homepage_content_settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'apikey': supabaseConfig.key,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          setting_key: settingKey,
          setting_data: settingData,
          updated_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      secureLog(`ホームページコンテンツ(${settingKey})のSupabase保存エラー:`, error);
      return false;
    }
  };

  const handleReasonsToChooseChange = (field: keyof ReasonsToChooseData, value: any) => {
    setReasonsToChoose(prev => ({ ...prev, [field]: value }));
  };

  const handleReasonChange = (index: number, field: string, value: string) => {
    setReasonsToChoose(prev => ({
      ...prev,
      reasons: prev.reasons.map((reason, i) => 
        i === index ? { ...reason, [field]: value } : reason
      )
    }));
  };

  const handleAddReason = () => {
    setReasonsToChoose(prev => ({
      ...prev,
      reasons: [...prev.reasons, {
        iconClass: "fas fa-star",
        title: "新しい理由",
        value: "100%",
        description: "説明を入力してください",
        animationDelay: `${prev.reasons.length * 0.5}s`
      }]
    }));
  };

  const handleRemoveReason = (index: number) => {
    if (reasonsToChoose.reasons.length > 1) {
      setReasonsToChoose(prev => ({
        ...prev,
        reasons: prev.reasons.filter((_, i) => i !== index)
      }));
    }
  };

  const handleFirstConsultationOfferChange = (field: keyof FirstConsultationOffer, value: string) => {
    setFirstConsultationOffer(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveHomepageContentSettings = async () => {
    setHomepageContentStatus('💾 ホームページコンテンツを保存中...');
    
    try {
      // データの基本チェック
      if (!reasonsToChoose.title || !reasonsToChoose.subtitle || !firstConsultationOffer.title) {
        setHomepageContentStatus('❌ 必須項目が入力されていません。');
        setTimeout(() => setHomepageContentStatus(''), 5000);
        return;
      }

      let successCount = 0;
      
      // 選ばれる理由を保存
      try {
        const reasonsSuccess = await saveHomepageContentToSupabase('reasons_to_choose', reasonsToChoose);
        if (reasonsSuccess) {
          secureLog('選ばれる理由をSupabaseに保存完了');
          successCount++;
        }
      } catch (error) {
        secureLog('選ばれる理由のSupabase保存エラー:', error);
      }
      
      // 初回相談限定特典を保存
      try {
        const offerSuccess = await saveHomepageContentToSupabase('first_consultation_offer', firstConsultationOffer);
        if (offerSuccess) {
          secureLog('初回相談限定特典をSupabaseに保存完了');
          successCount++;
        }
      } catch (error) {
        secureLog('初回相談限定特典のSupabase保存エラー:', error);
      }

      if (successCount === 2) {
        setHomepageContentStatus('✅ ホームページコンテンツが正常に保存され、データベースに反映されました');
      } else if (successCount > 0) {
        setHomepageContentStatus('⚠️ 一部のコンテンツが保存されました（部分的成功）');
      } else {
        setHomepageContentStatus('❌ コンテンツの保存に失敗しました');
      }
      
      setTimeout(() => setHomepageContentStatus(''), 3000);
    } catch (error) {
      secureLog("Error saving homepage content settings:", error);
      setHomepageContentStatus('❌ 保存中にエラーが発生しました。');
      setTimeout(() => setHomepageContentStatus(''), 5000);
    }
  };

  const handleTestNotification = async (channel: keyof NotificationSettings) => {
    try {
      setNotificationSettingsStatus(`🧪 ${channel}通知のテストを実行しています...`);
      
      // Basic validation for the channel
      const config = notificationSettings[channel];
      const testMessage = 'MoneyTicket管理システムからのテスト通知です。';
      
      switch (channel) {
        case 'email':
          const emailConfig = config as EmailNotificationConfig;
          if (!emailConfig.recipientEmails) {
            setNotificationSettingsStatus('メールアドレスが設定されていません。');
            return;
          }
          secureLog(`📧 Email Test to: ${emailConfig.recipientEmails}`);
          secureLog(`Message: ${testMessage}`);
          setNotificationSettingsStatus('✅ メール通知テストを実行しました');
          break;
          
        case 'slack':
          const slackConfig = config as SlackNotificationConfig;
          if (!slackConfig.webhookUrl) {
            setNotificationSettingsStatus('SlackのWebhook URLが設定されていません。');
            return;
          }
          secureLog(`💬 Slack Test to: ${slackConfig.channel || '#general'}`);
          secureLog(`Webhook: ${slackConfig.webhookUrl}`);
          secureLog(`Message: ${testMessage}`);
          setNotificationSettingsStatus('✅ Slack通知テストを実行しました');
          break;
          
        case 'line':
          const lineConfig = config as LineNotificationConfig;
          if (!lineConfig.accessToken) {
            setNotificationSettingsStatus('LINEのアクセストークンが設定されていません。');
            return;
          }
          secureLog(`📱 LINE Test`);
          secureLog(`Token: ${lineConfig.accessToken.substring(0, 10)}...`);
          secureLog(`Message: ${testMessage}`);
          setNotificationSettingsStatus('✅ LINE通知テストを実行しました');
          break;
          
        case 'chatwork':
          const chatworkConfig = config as ChatWorkNotificationConfig;
          if (!chatworkConfig.apiToken || !chatworkConfig.roomId) {
            setNotificationSettingsStatus('ChatWorkのAPIトークンまたはルームIDが設定されていません。');
            return;
          }
          secureLog(`💼 ChatWork Test to Room: ${chatworkConfig.roomId}`);
          secureLog(`Token: ${chatworkConfig.apiToken.substring(0, 10)}...`);
          secureLog(`Message: ${testMessage}`);
          setNotificationSettingsStatus('✅ ChatWork通知テストを実行しました');
          break;
      }
      
      setTimeout(() => setNotificationSettingsStatus(''), 5000);
      
    } catch (error) {
      secureLog('通知テストエラー:', error);
      setNotificationSettingsStatus(`❌ ${channel}通知テストでエラーが発生しました: ${error}`);
      setTimeout(() => setNotificationSettingsStatus(''), 5000);
    }
  };

  // ヘッダー・メインビジュアル設定のハンドラー
  const handleHeaderDataChange = (field: keyof HeaderData, value: string) => {
    setHeaderData(prev => ({ ...prev, [field]: value }));
  };

  const handleMainVisualDataChange = (field: keyof MainVisualData, value: string) => {
    setMainVisualData(prev => ({ ...prev, [field]: value }));
  };

  const handleFooterDataChange = (field: keyof FooterData, value: string) => {
    setFooterData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveHeaderAndVisualSettings = async () => {
    setHeaderVisualStatus('💾 ヘッダー・メインビジュアル・フッター設定を保存中...');
    
    try {
      // データの基本チェック
      if (!headerData.title || !headerData.subtitle || !mainVisualData.title || !mainVisualData.subtitle || !footerData.siteName) {
        setHeaderVisualStatus('❌ 必須項目が入力されていません。');
        setTimeout(() => setHeaderVisualStatus(''), 5000);
        return;
      }

      let successCount = 0;
      
      // ヘッダーデータを保存
      try {
        const headerSuccess = await saveHomepageContentToSupabase('header_data', headerData);
        if (headerSuccess) {
          secureLog('ヘッダーデータをSupabaseに保存完了');
          successCount++;
        }
      } catch (error) {
        secureLog('ヘッダーデータの保存エラー:', error);
      }

      // メインビジュアルデータを保存
      try {
        const mainVisualSuccess = await saveHomepageContentToSupabase('main_visual_data', mainVisualData);
        if (mainVisualSuccess) {
          secureLog('メインビジュアルデータをSupabaseに保存完了');
          successCount++;
        }
      } catch (error) {
        secureLog('メインビジュアルデータの保存エラー:', error);
      }

      // フッターデータを保存
      try {
        const footerSuccess = await saveHomepageContentToSupabase('footer_data', footerData);
        if (footerSuccess) {
          secureLog('フッターデータをSupabaseに保存完了');
          successCount++;
        }
      } catch (error) {
        secureLog('フッターデータの保存エラー:', error);
      }

      if (successCount === 3) {
        setHeaderVisualStatus('✅ ヘッダー・メインビジュアル・フッター設定が正常に保存されました');
      } else if (successCount > 0) {
        setHeaderVisualStatus('⚠️ 一部の設定の保存に失敗しました');
      } else {
        setHeaderVisualStatus('❌ 設定の保存に失敗しました');
      }

      setTimeout(() => setHeaderVisualStatus(''), 3000);

    } catch (error) {
      secureLog('ヘッダー・メインビジュアル・フッター設定保存エラー:', error);
      setHeaderVisualStatus('❌ 保存中にエラーが発生しました。');
      setTimeout(() => setHeaderVisualStatus(''), 5000);
    }
  };

  // カラーテーマ変更ハンドラー
  const handleColorThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    secureLog('カラーテーマを変更:', themeId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-gray-800 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <i className="fas fa-tachometer-alt text-2xl mr-3"></i>
              <h1 className="text-xl font-semibold">管理画面</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* セッション情報表示 */}
              <div className="hidden md:flex items-center space-x-3 text-sm">
                <div className="flex items-center">
                  <i className={`fas fa-shield-alt mr-1 ${sessionValid ? 'text-green-400' : 'text-red-400'}`}></i>
                  <span className={sessionValid ? 'text-green-400' : 'text-red-400'}>
                    {sessionValid ? 'セキュア' : '期限切れ'}
                  </span>
                </div>
                {sessionValid && sessionTimeRemaining > 0 && (
                  <div className="flex items-center">
                    <i className="fas fa-clock mr-1 text-yellow-400"></i>
                    <span className="text-yellow-400">
                      残り {Math.ceil(sessionTimeRemaining / 60000)}分
                    </span>
                    {sessionTimeRemaining < 5 * 60 * 1000 && (
                      <button
                        onClick={extendSession}
                        className="ml-2 text-xs bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
                      >
                        延長
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={onNavigateHome}
                className="text-gray-300 hover:text-white text-sm transition duration-150 ease-in-out flex items-center"
                aria-label="ホームページへ戻る"
              >
                <i className="fas fa-home mr-1"></i>
                サイト表示
              </button>
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center"
                aria-label="ログアウト"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                ログアウト
              </button>
            </div>
          </div>

          {/* セキュリティ警告バー（モバイル対応） */}
          {sessionValid && sessionTimeRemaining > 0 && sessionTimeRemaining < 5 * 60 * 1000 && (
            <div className="mt-3 p-2 bg-yellow-600 rounded-lg flex items-center justify-between">
              <div className="flex items-center text-sm">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                <span>セッションの有効期限が近づいています（残り {Math.ceil(sessionTimeRemaining / 60000)}分）</span>
              </div>
              <button
                onClick={extendSession}
                className="text-xs bg-yellow-700 hover:bg-yellow-800 px-3 py-1 rounded"
              >
                30分延長
              </button>
            </div>
          )}

          {!sessionValid && (
            <div className="mt-3 p-2 bg-red-600 rounded-lg flex items-center text-sm">
              <i className="fas fa-lock mr-2"></i>
              <span>セッションが無効です。再ログインが必要です。</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8">
        {/* Navigation between admin sections */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">管理メニュー</h2>
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => setViewMode('userHistory')}
                    className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'userHistory' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-users-cog mr-2"></i>
                    <span>ユーザー診断履歴</span>
                </button>
                <button 
                    onClick={() => setViewMode('productSettings')}
                    className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'productSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-gifts mr-2"></i>
                    <span>商品リンク設定</span>
                </button>
                <button 
                    onClick={() => setViewMode('adminSettings')}
                    className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'adminSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-user-cog mr-2"></i>
                    <span>管理者設定</span>
                </button>
                 <button 
                    onClick={() => setViewMode('testimonialSettings')}
                    className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'testimonialSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-comments mr-2"></i>
                    <span>お客様の声 管理</span>
                </button>
                <button 
                    onClick={() => setViewMode('analyticsSettings')}
                    className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'analyticsSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-chart-line mr-2"></i>
                    <span>アナリティクス設定</span>
                </button>
                 <button 
                    onClick={() => setViewMode('notificationSettings')}
                    className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'notificationSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-bell mr-2"></i>
                    <span>通知設定</span>
                </button>
                <button 
                    onClick={() => setViewMode('legalLinksSettings')}
                    className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'legalLinksSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-gavel mr-2"></i>
                    <span>リーガルリンク設定</span>
                </button>
                <button 
                    onClick={() => setViewMode('homepageContentSettings')}
                    className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'homepageContentSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-home mr-2"></i>
                    <span>ホームページコンテンツ設定</span>
                </button>
                                 <button 
                     onClick={() => setViewMode('headerAndVisualSettings')}
                     className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'headerAndVisualSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                 >
                     <i className="fas fa-heading mr-2"></i>
                     <span>ヘッダー・メインビジュアル・フッター設定</span>
                 </button>
                 <button 
                     onClick={() => setViewMode('colorThemeSettings')}
                     className={`admin-nav-button px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'colorThemeSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                 >
                     <i className="fas fa-palette mr-2"></i>
                     <span>カラーテーマ設定</span>
                 </button>
            </div>
        </div>

        {viewMode === 'userHistory' && (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <i className="fas fa-users-cog mr-3 text-blue-600"></i>ユーザー診断履歴
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center text-sm"
                        disabled={userSessions.length === 0}
                    >
                        <i className="fas fa-file-csv mr-2"></i>CSVエクスポート
                    </button>
                </h2>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg shadow">
                        <h4 className="text-sm font-semibold text-blue-700">総診断数</h4>
                        <p className="text-2xl font-bold text-blue-800">{dashboardStats.totalDiagnoses}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg shadow">
                        <h4 className="text-sm font-semibold text-green-700">過去7日間の診断数</h4>
                        <p className="text-2xl font-bold text-green-800">{dashboardStats.diagnosesLast7Days}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg shadow">
                        <h4 className="text-sm font-semibold text-indigo-700">平均投資希望額/月</h4>
                        <p className="text-2xl font-bold text-indigo-800">{dashboardStats.averageInvestmentAmount.toLocaleString()} 円</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg shadow md:col-span-2 lg:col-span-1">
                        <h4 className="text-sm font-semibold text-purple-700">最も多い投資目的</h4>
                        <p className="text-lg font-bold text-purple-800 truncate" title={dashboardStats.mostCommonPurpose}>{dashboardStats.mostCommonPurpose}</p>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-lg shadow md:col-span-3 lg:col-span-2">
                        <h4 className="text-sm font-semibold text-pink-700 mb-1">年齢層分布</h4>
                        {Object.keys(dashboardStats.ageDistribution).length > 0 ? (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                {Object.entries(dashboardStats.ageDistribution).map(([age, percent]) => (
                                    <span key={age} className="text-pink-800">{age}: <strong>{percent}</strong></span>
                                ))}
                            </div>
                        ) : <p className="text-sm text-pink-800">データなし</p>}
                    </div>
                </div>


                {userSessions.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">回答日時</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話番号</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年齢</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">投資経験</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目的</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">投資可能額/月</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">開始時期</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {userSessions.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {new Date(session.timestamp).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{session.phoneNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{getAnswerLabel('age', session.diagnosisAnswers.age)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{getAnswerLabel('experience', session.diagnosisAnswers.experience)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{getAnswerLabel('purpose', session.diagnosisAnswers.purpose)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{getAnswerLabel('amount', session.diagnosisAnswers.amount)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{getAnswerLabel('timing', session.diagnosisAnswers.timing)}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                ) : (
                <div className="text-center py-10">
                    <i className="fas fa-folder-open text-4xl text-gray-400 mb-3"></i>
                    <p className="text-gray-600">まだユーザーの診断履歴はありません。</p>
                </div>
                )}
            </div>
        )}

        {viewMode === 'productSettings' && (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-gifts mr-3 text-green-600"></i>金融商品リンク設定
                </h2>
                {productSettingsStatus && (
                    <div className={`p-3 mb-4 rounded-md text-sm ${productSettingsStatus.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {productSettingsStatus}
                    </div>
                )}
                <div className="space-y-6">
                {productsForEditing.map((product, pIdx) => (
                    <div key={product.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">{product.name}</h3>
                    {product.representativeCompanies && product.representativeCompanies.length > 0 ? (
                        product.representativeCompanies.map((company, cIdx) => (
                        <div key={company.id} className="border border-blue-200 rounded-lg p-4 mb-4 bg-blue-50">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">取扱会社 #{cIdx + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor={`name-${pIdx}-${cIdx}`} className="block text-xs font-medium text-gray-500">会社名</label>
                                    <input
                                        type="text"
                                        id={`name-${pIdx}-${cIdx}`}
                                        value={company.name}
                                        onChange={(e) => handleProductInputChange(pIdx, cIdx, 'name', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="例: SBI証券"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`url-${pIdx}-${cIdx}`} className="block text-xs font-medium text-gray-500">ウェブサイトURL</label>
                                    <input
                                        type="url"
                                        id={`url-${pIdx}-${cIdx}`}
                                        value={company.websiteUrl}
                                        onChange={(e) => handleProductInputChange(pIdx, cIdx, 'websiteUrl', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`action-${pIdx}-${cIdx}`} className="block text-xs font-medium text-gray-500">アクションテキスト</label>
                                    <input
                                        type="text"
                                        id={`action-${pIdx}-${cIdx}`}
                                        value={company.actionText}
                                        onChange={(e) => handleProductInputChange(pIdx, cIdx, 'actionText', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="詳しく見る"
                                    />
                                </div>
                            </div>
                        </div>
                        ))
                    ) : <p className="text-sm text-gray-500">この商品には編集可能な取扱会社情報がありません。</p>}
                    </div>
                ))}
                </div>
                <button
                    onClick={() => {
                        secureLog('商品設定保存ボタンがクリックされました');
                        handleSaveProductSettings();
                    }}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                >
                    <i className="fas fa-save mr-2"></i>商品設定を保存
                </button>

            </div>
        )}

        {viewMode === 'testimonialSettings' && (
             <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <i className="fas fa-comments mr-3 text-purple-600"></i>お客様の声 管理
                    </div>
                    <button
                        onClick={() => handleOpenTestimonialModal()}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center text-sm"
                    >
                        <i className="fas fa-plus mr-2"></i>新規追加
                    </button>
                </h2>

                {testimonialStatus && (
                    <div className={`p-3 mb-4 rounded-md text-sm ${testimonialStatus.includes('エラー') ? 'bg-red-100 text-red-700' : (testimonialStatus.includes('保存され') || testimonialStatus.includes('削除され') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}`}>
                        {testimonialStatus}
                    </div>
                )}

                {testimonialsForEditing.length > 0 ? (
                    <div className="space-y-4">
                        {testimonialsForEditing.map(testimonial => (
                            <div key={testimonial.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-gray-700">{testimonial.nameAndRole} <span className="text-sm">({testimonial.avatarEmoji}, {'⭐'.repeat(testimonial.ratingStars)})</span></h4>
                                        <p className="text-sm text-gray-600 mt-1">{testimonial.text}</p>
                                    </div>
                                    <div className="flex space-x-2 flex-shrink-0 ml-4">
                                        <button onClick={() => handleOpenTestimonialModal(testimonial)} className="text-blue-500 hover:text-blue-700 text-xs p-1"><i className="fas fa-edit"></i> 編集</button>
                                        <button onClick={() => handleDeleteTestimonial(testimonial.id)} className="text-red-500 hover:text-red-700 text-xs p-1"><i className="fas fa-trash"></i> 削除</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-10">
                        <i className="fas fa-comment-slash text-4xl text-gray-400 mb-3"></i>
                        <p className="text-gray-600">まだお客様の声はありません。「新規追加」から登録してください。</p>
                    </div>
                )}
                
                <button
                    onClick={handleSaveTestimonialSettings}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                >
                    <i className="fas fa-save mr-2"></i>お客様の声を保存
                </button>

            </div>
        )}

        {/* Testimonial Add/Edit Modal */}
        {showTestimonialModal && editingTestimonial && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="testimonial-modal-title"
            >
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <h3 id="testimonial-modal-title" className="text-xl font-semibold mb-4">{editingTestimonial.id && editingTestimonial.id !== '' ? 'お客様の声を編集' : 'お客様の声を新規追加'}</h3>
                    <form onSubmit={handleSaveTestimonialForm} className="space-y-4">
                        <div>
                            <label htmlFor="nameAndRole" className="block text-sm font-medium text-gray-700">名前と役割 (例: 田中様 30代会社員)</label>
                            <input type="text" name="nameAndRole" id="nameAndRole" value={editingTestimonial.nameAndRole || ''} onChange={handleTestimonialFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="avatarEmoji" className="block text-sm font-medium text-gray-700">アバター絵文字 (例: 👩)</label>
                            <input type="text" name="avatarEmoji" id="avatarEmoji" value={editingTestimonial.avatarEmoji || ''} onChange={handleTestimonialFormChange} maxLength={2} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="ratingStars" className="block text-sm font-medium text-gray-700">評価 (星の数)</label>
                            <select name="ratingStars" id="ratingStars" value={editingTestimonial.ratingStars || 5} onChange={handleTestimonialFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white">
                                {[1,2,3,4,5].map(s => <option key={s} value={s}>{'⭐'.repeat(s)}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="text" className="block text-sm font-medium text-gray-700">本文</label>
                            <textarea name="text" id="text" value={editingTestimonial.text || ''} onChange={handleTestimonialFormChange} rows={4} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button type="button" onClick={handleCloseTestimonialModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">キャンセル</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">フォームを保存</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {viewMode === 'analyticsSettings' && (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-chart-line mr-3 text-teal-600"></i>アナリティクス設定
                </h2>
                {analyticsSettingsStatus && (
                    <div className={`p-3 mb-4 rounded-md text-sm ${analyticsSettingsStatus.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {analyticsSettingsStatus}
                    </div>
                )}
                <div className="space-y-6">
                    <div>
                        <label htmlFor="headScripts" className="block text-sm font-medium text-gray-700 mb-1">
                            &lt;head&gt; 内に追加するスクリプト・タグ
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            例: Google Analyticsトラッキングコード、メタ認証タグ、カスタムCSSリンクなど。
                        </p>
                        <textarea
                            id="headScripts"
                            rows={8}
                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                            value={trackingScripts.head}
                            onChange={(e) => handleTrackingScriptChange('head', e.target.value)}
                            placeholder={`<script>\n  // Google Analytics or other head scripts\n</script>\n<meta name="google-site-verification" content="..." />`}
                            aria-label="Head scripts"
                        />
                    </div>
                    <div>
                        <label htmlFor="bodyEndScripts" className="block text-sm font-medium text-gray-700 mb-1">
                            &lt;body&gt; の末尾に追加するスクリプト・タグ
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            例: Facebook Pixelコード、チャットウィジェットのスクリプトなど。
                        </p>
                        <textarea
                            id="bodyEndScripts"
                            rows={8}
                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                            value={trackingScripts.bodyEnd}
                            onChange={(e) => handleTrackingScriptChange('bodyEnd', e.target.value)}
                            placeholder={`<script>\n  // Facebook Pixel or other body-end scripts\n</script>`}
                            aria-label="Body-end scripts"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSaveTrackingScripts}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                >
                    <i className="fas fa-save mr-2"></i>トラッキング設定を保存
                </button>
                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0"><i className="fas fa-exclamation-triangle text-yellow-500 text-xl"></i></div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700"><strong>警告:</strong> ここに貼り付けたスクリプトはサイト全体に影響します。信頼できないソースからのスクリプトや、誤った形式のスクリプトはサイトの表示を壊したり、セキュリティリスクを生じさせたりする可能性があります。変更後は必ずサイトの動作確認を行ってください。</p>

                        </div>
                    </div>
                </div>
            </div>
        )}

        {viewMode === 'notificationSettings' && (
             <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-bell mr-3 text-orange-500"></i>通知設定

                </h2>
                {notificationSettingsStatus && (
                    <div className={`p-3 mb-4 rounded-md text-sm ${notificationSettingsStatus.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {notificationSettingsStatus}
                    </div>
                )}
                <div className="space-y-8">
                    {/* Email */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                <i className="fas fa-envelope mr-2 text-blue-500"></i>メール通知
                            </h3>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" 
                                    checked={notificationSettings.email.enabled}
                                    onChange={(e) => handleNotificationSettingChange('email', 'enabled', e.target.checked)}
                                />
                                <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-700">{notificationSettings.email.enabled ? '有効' : '無効'}</span>
                            </label>
                        </div>
                        {notificationSettings.email.enabled && (
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="emailRecipients" className="block text-sm font-medium text-gray-600">受信者メールアドレス (カンマ区切り)</label>
                                    <input type="text" id="emailRecipients"
                                        value={notificationSettings.email.recipientEmails}
                                        onChange={(e) => handleNotificationSettingChange('email', 'recipientEmails', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="admin1@example.com,admin2@example.com"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTestNotification('email')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded shadow transition-colors"
                                >
                                    <i className="fas fa-paper-plane mr-1"></i>テスト送信
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Slack */}
                     <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                <i className="fab fa-slack mr-2" style={{color: '#4A154B'}}></i>Slack通知
                            </h3>
                             <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer"
                                    checked={notificationSettings.slack.enabled}
                                    onChange={(e) => handleNotificationSettingChange('slack', 'enabled', e.target.checked)}
                                />
                                <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slack-brand"></div>
                                <span className="ms-3 text-sm font-medium text-gray-700">{notificationSettings.slack.enabled ? '有効' : '無効'}</span>
                            </label>
                        </div>
                        {notificationSettings.slack.enabled && (
                            <div className="space-y-2">
                                <div>
                                    <label htmlFor="slackWebhookUrl" className="block text-sm font-medium text-gray-600">Webhook URL</label>
                                    <input type="url" id="slackWebhookUrl"
                                        value={notificationSettings.slack.webhookUrl}
                                        onChange={(e) => handleNotificationSettingChange('slack', 'webhookUrl', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="https://hooks.slack.com/services/..."
                                    />
                                </div>
                                <div>
                                    <label htmlFor="slackChannel" className="block text-sm font-medium text-gray-600">チャンネル (例: #general, @username)</label>
                                    <input type="text" id="slackChannel"
                                        value={notificationSettings.slack.channel}
                                        onChange={(e) => handleNotificationSettingChange('slack', 'channel', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="#diagnoses"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTestNotification('slack')}
                                    className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1 rounded shadow transition-colors"
                                >
                                    <i className="fab fa-slack mr-1"></i>テスト送信
                                </button>
                            </div>
                        )}
                    </div>

                    {/* LINE */}
                     <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                <i className="fab fa-line mr-2" style={{color: '#00B900'}}></i>LINE通知
                            </h3>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer"
                                    checked={notificationSettings.line.enabled}
                                    onChange={(e) => handleNotificationSettingChange('line', 'enabled', e.target.checked)}
                                />
                                <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-line-brand"></div>
                                <span className="ms-3 text-sm font-medium text-gray-700">{notificationSettings.line.enabled ? '有効' : '無効'}</span>
                            </label>
                        </div>
                        {notificationSettings.line.enabled && (
                            <div>
                                <label htmlFor="lineAccessToken" className="block text-sm font-medium text-gray-600">LINE Notify アクセストークン</label>
                                <input type="password" id="lineAccessToken"
                                    value={notificationSettings.line.accessToken}
                                    onChange={(e) => handleNotificationSettingChange('line', 'accessToken', e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="LINE Notify アクセストークン"
                                />

                                <button
                                    type="button"
                                    onClick={() => handleTestNotification('line')}
                                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded shadow transition-colors mt-2"
                                >
                                    <i className="fab fa-line mr-1"></i>テスト送信
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* ChatWork */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                         <div className="flex justify-between items-center mb-2">
                           <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{color: '#22394A'}}><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17.29 15.88L15.88 17.29L12 13.41L8.12 17.29L6.71 15.88L10.59 12L6.71 8.12L8.12 6.71L12 10.59L15.88 6.71L17.29 8.12L13.41 12L17.29 15.88Z" fill="currentColor"/></svg>
                                ChatWork通知
                            </h3>
                             <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer"
                                    checked={notificationSettings.chatwork.enabled}
                                    onChange={(e) => handleNotificationSettingChange('chatwork', 'enabled', e.target.checked)}
                                />
                                <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-chatwork-brand"></div>
                                <span className="ms-3 text-sm font-medium text-gray-700">{notificationSettings.chatwork.enabled ? '有効' : '無効'}</span>
                            </label>
                        </div>
                        {notificationSettings.chatwork.enabled && (
                             <div className="space-y-2">
                                <div>
                                    <label htmlFor="chatworkApiToken" className="block text-sm font-medium text-gray-600">APIトークン</label>
                                    <input type="password" id="chatworkApiToken"
                                        value={notificationSettings.chatwork.apiToken}
                                        onChange={(e) => handleNotificationSettingChange('chatwork', 'apiToken', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="ChatWork APIトークン"
                                    />

                                </div>
                                <div>
                                    <label htmlFor="chatworkRoomId" className="block text-sm font-medium text-gray-600">ルームID</label>
                                    <input type="text" id="chatworkRoomId"
                                         value={notificationSettings.chatwork.roomId}
                                         onChange={(e) => handleNotificationSettingChange('chatwork', 'roomId', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="123456789"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTestNotification('chatwork')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1 rounded shadow transition-colors"
                                >
                                    <i className="fas fa-comments mr-1"></i>テスト送信
                                </button>
                            </div>
                        )}
                    </div>

                </div>
                 <button
                    onClick={handleSaveNotificationSettings}
                    className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                >
                    <i className="fas fa-save mr-2"></i>通知設定を保存
                </button>

            </div>
        )}

        {viewMode === 'legalLinksSettings' && (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-gavel mr-3 text-purple-600"></i>リーガルリンク設定
                </h2>
                {legalLinksStatus && (
                    <div className={`p-3 mb-4 rounded-md text-sm ${legalLinksStatus.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {legalLinksStatus}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {legalLinks.map((link) => (
                        <div key={link.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-gray-700">{link.title}</h3>
                                <button
                                    onClick={() => handleEditLegalLink(link)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">URL:</span> {link.url}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">ステータス:</span> 
                                <span className={`ml-1 ${link.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                    {link.is_active ? '有効' : '無効'}
                                </span>
                            </p>
                        </div>
                    ))}
                </div>

                {editingLegalLink && (
                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            <i className="fas fa-edit mr-2"></i>リンク編集
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    タイトル
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={editingLegalLink.title || ''}
                                    onChange={handleLegalLinkFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL
                                </label>
                                <input
                                    type="url"
                                    name="url"
                                    value={editingLegalLink.url || ''}
                                    onChange={handleLegalLinkFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://example.com/privacy"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={editingLegalLink.is_active || false}
                                        onChange={handleLegalLinkFormChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">有効</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={handleSaveLegalLink}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                            >
                                <i className="fas fa-save mr-2"></i>保存
                            </button>
                            <button
                                onClick={handleCancelLegalLinkEdit}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                            >
                                <i className="fas fa-times mr-2"></i>キャンセル
                            </button>
                        </div>
                    </div>
                )}


            </div>
        )}

        {viewMode === 'homepageContentSettings' && (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-home mr-3 text-orange-600"></i>ホームページコンテンツ設定
                </h2>

                {/* デバッグ情報（開発時のみ表示） */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <h4 className="font-semibold text-blue-800 mb-2">🔧 設定確認情報:</h4>
                    <p className="text-blue-700">選ばれる理由タイトル: {reasonsToChoose?.title || 'データなし'}</p>
                    <p className="text-blue-700">理由項目数: {reasonsToChoose?.reasons?.length || 0}</p>
                    <p className="text-blue-700">初回相談特典タイトル: {firstConsultationOffer?.title || 'データなし'}</p>
                </div>

                {homepageContentStatus && (
                    <div className={`p-3 mb-4 rounded-md text-sm ${homepageContentStatus.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {homepageContentStatus}
                    </div>
                )}

                <div className="space-y-8">
                    {/* 選ばれる理由設定 */}
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-thumbs-up mr-2 text-blue-600"></i>
                            選ばれる理由セクション
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    メインタイトル
                                </label>
                                <input
                                    type="text"
                                    value={reasonsToChoose.title}
                                    onChange={(e) => handleReasonsToChooseChange('title', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="例: 選ばれる理由があります"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    サブタイトル
                                </label>
                                <input
                                    type="text"
                                    value={reasonsToChoose.subtitle}
                                    onChange={(e) => handleReasonsToChooseChange('subtitle', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="例: 多くのお客様から信頼をいただいている..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-md font-semibold text-gray-700">理由項目</h4>
                                <button
                                    onClick={handleAddReason}
                                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center text-sm"
                                >
                                    <i className="fas fa-plus mr-2"></i>項目を追加
                                </button>
                            </div>
                            
                            {reasonsToChoose.reasons.map((reason, index) => (
                                <div key={index} className="p-4 bg-white border border-gray-300 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="text-sm font-semibold text-gray-700">理由項目 #{index + 1}</h5>
                                        {reasonsToChoose.reasons.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveReason(index)}
                                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded text-xs"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                アイコンクラス
                                            </label>
                                            <input
                                                type="text"
                                                value={reason.iconClass}
                                                onChange={(e) => handleReasonChange(index, 'iconClass', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="fas fa-thumbs-up"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                タイトル
                                            </label>
                                            <input
                                                type="text"
                                                value={reason.title}
                                                onChange={(e) => handleReasonChange(index, 'title', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="お客様満足度"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                数値・データ
                                            </label>
                                            <input
                                                type="text"
                                                value={reason.value}
                                                onChange={(e) => handleReasonChange(index, 'value', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="98.8%"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                説明文
                                            </label>
                                            <input
                                                type="text"
                                                value={reason.description}
                                                onChange={(e) => handleReasonChange(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="継続的なサポートによる..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 初回相談限定特典設定 */}
                    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-gift mr-2 text-yellow-600"></i>
                            初回相談限定特典
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    特典タイトル
                                </label>
                                <input
                                    type="text"
                                    value={firstConsultationOffer.title}
                                    onChange={(e) => handleFirstConsultationOfferChange('title', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="例: 初回相談限定特典"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    アイコンクラス
                                </label>
                                <input
                                    type="text"
                                    value={firstConsultationOffer.icon}
                                    onChange={(e) => handleFirstConsultationOfferChange('icon', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="fas fa-gift"
                                />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    特典説明
                                </label>
                                <textarea
                                    value={firstConsultationOffer.description}
                                    onChange={(e) => handleFirstConsultationOfferChange('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="例: 投資戦略ガイドブック（通常価格2,980円）を無料プレゼント中"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    背景色（CSS）
                                </label>
                                <input
                                    type="text"
                                    value={firstConsultationOffer.backgroundColor}
                                    onChange={(e) => handleFirstConsultationOfferChange('backgroundColor', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="rgba(212, 175, 55, 0.1)"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ボーダー色（CSS）
                                </label>
                                <input
                                    type="text"
                                    value={firstConsultationOffer.borderColor}
                                    onChange={(e) => handleFirstConsultationOfferChange('borderColor', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="var(--accent-gold)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 保存ボタン */}
                    <div className="flex justify-center">
                        <button
                            onClick={handleSaveHomepageContentSettings}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center min-w-max"
                        >
                            <i className="fas fa-save mr-2 text-white"></i>
                            <span className="text-white">ホームページコンテンツを保存</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {viewMode === 'headerAndVisualSettings' && (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-heading mr-3 text-purple-600"></i>ヘッダー・メインビジュアル・フッター設定
                </h2>
                
                {headerVisualStatus && (
                    <div className={`p-3 mb-4 rounded-md text-sm ${headerVisualStatus.includes('❌') || headerVisualStatus.includes('エラー') ? 'bg-red-100 text-red-700' : 
                        headerVisualStatus.includes('⚠️') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {headerVisualStatus}
                    </div>
                )}

                <div className="space-y-8">
                    {/* ヘッダー設定 */}
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-bars mr-2 text-blue-600"></i>
                            ヘッダー設定
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            サイトの上部に表示されるヘッダー情報を設定します。
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    サイトタイトル
                                </label>
                                <input
                                    type="text"
                                    value={headerData.title}
                                    onChange={(e) => handleHeaderDataChange('title', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="例: マネーチケット"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    モバイル用サブタイトル
                                </label>
                                <input
                                    type="text"
                                    value={headerData.subtitle}
                                    onChange={(e) => handleHeaderDataChange('subtitle', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="例: あなたの資産運用をプロがサポート"
                                />
                            </div>
                        </div>
                    </div>

                    {/* メインビジュアル設定 */}
                    <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-image mr-2 text-green-600"></i>
                            メインビジュアル設定
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            トップページのメインビジュアル部分のテキストを設定します。
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    メインタイトル
                                </label>
                                <textarea
                                    value={mainVisualData.title}
                                    onChange={(e) => handleMainVisualDataChange('title', e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="例: あなたの資産運用を\nプロフェッショナルが\n完全サポート"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    改行（\n）で改行が表示されます
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ハイライト単語
                                </label>
                                <input
                                    type="text"
                                    value={mainVisualData.highlightWord}
                                    onChange={(e) => handleMainVisualDataChange('highlightWord', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="例: プロフェッショナル"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    この単語は金色でハイライト表示されます
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    サブタイトル
                                </label>
                                <textarea
                                    value={mainVisualData.subtitle}
                                    onChange={(e) => handleMainVisualDataChange('subtitle', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="例: 経験豊富なファイナンシャルプランナーが、あなただけの投資戦略を無料でご提案。 安心して始められる資産運用の第一歩を踏み出しませんか。"
                                />
                            </div>
                        </div>
                    </div>

                    {/* フッター設定 */}
                    <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-footer mr-2 text-orange-600"></i>
                            フッター設定
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            サイトの下部に表示されるフッター情報を設定します。
                        </p>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        サイト名
                                    </label>
                                    <input
                                        type="text"
                                        value={footerData.siteName}
                                        onChange={(e) => handleFooterDataChange('siteName', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="例: マネーチケット"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        説明文
                                    </label>
                                    <input
                                        type="text"
                                        value={footerData.description}
                                        onChange={(e) => handleFooterDataChange('description', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="例: お客様の豊かな未来を全力でサポートいたします"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    会社情報
                                </label>
                                <input
                                    type="text"
                                    value={footerData.companyInfo}
                                    onChange={(e) => handleFooterDataChange('companyInfo', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="例: 運営会社：株式会社◯◯◯ | 金融商品取引業者 関東財務局長（金商）第◯◯◯号"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    連絡先情報
                                </label>
                                <input
                                    type="text"
                                    value={footerData.contactInfo}
                                    onChange={(e) => handleFooterDataChange('contactInfo', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="例: 〒XXX-XXXX 東京都○○区○○ X-X-X | TEL：0120-XXX-XXX"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    著作権表示
                                </label>
                                <input
                                    type="text"
                                    value={footerData.copyright}
                                    onChange={(e) => handleFooterDataChange('copyright', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="例: MoneyTicket. All rights reserved."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    年号は自動で挿入されます（© 2024 の部分）
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* プレビュー */}
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-eye mr-2 text-gray-600"></i>
                            プレビュー
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-white border rounded-lg">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">ヘッダータイトル：</h4>
                                <p className="text-xl font-bold text-blue-800">{headerData.title}</p>
                                <p className="text-sm text-gray-600 mt-1">{headerData.subtitle}</p>
                            </div>
                            
                                                         <div className="p-4 bg-white border rounded-lg">
                                 <h4 className="text-sm font-medium text-gray-700 mb-2">メインビジュアル：</h4>
                                 <div className="text-lg font-bold text-gray-800 mb-2">
                                     {mainVisualData.title.split('\n').map((line, index) => (
                                         <div key={index}>
                                             {line.includes(mainVisualData.highlightWord) ? (
                                                 line.split(mainVisualData.highlightWord).map((part, partIndex) => (
                                                     <span key={partIndex}>
                                                         {part}
                                                         {partIndex < line.split(mainVisualData.highlightWord).length - 1 && (
                                                             <span className="text-yellow-600 font-extrabold">
                                                                 {mainVisualData.highlightWord}
                                                             </span>
                                                         )}
                                                     </span>
                                                 ))
                                             ) : (
                                                 line
                                             )}
                                         </div>
                                     ))}
                                 </div>
                                 <p className="text-gray-600">{mainVisualData.subtitle}</p>
                             </div>
                             
                             <div className="p-4 bg-white border rounded-lg">
                                 <h4 className="text-sm font-medium text-gray-700 mb-2">フッター：</h4>
                                 <div className="space-y-2 text-sm">
                                     <p className="text-lg font-bold text-orange-600">{footerData.siteName}</p>
                                     <p className="text-gray-600">{footerData.description}</p>
                                     <p className="text-gray-500 text-xs">{footerData.companyInfo}</p>
                                     <p className="text-gray-500 text-xs">{footerData.contactInfo}</p>
                                     <p className="text-gray-400 text-xs">© {new Date().getFullYear()} {footerData.copyright}</p>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* 保存ボタン */}
                    <div className="flex justify-center">
                                                 <button
                             onClick={handleSaveHeaderAndVisualSettings}
                             className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center min-w-max"
                         >
                             <i className="fas fa-save mr-2 text-white"></i>
                             <span className="text-white">ヘッダー・メインビジュアル・フッター設定を保存</span>
                         </button>
                    </div>
                </div>
            </div>
        )}

        {viewMode === 'colorThemeSettings' && (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-palette mr-3 text-purple-600"></i>カラーテーマ設定
                </h2>
                
                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        サイト全体のカラーテーマを選択してください。変更は即座に反映されます。
                    </p>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">
                            現在のテーマ: <span className="text-purple-600">{currentTheme.name}</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {themes.map((theme) => (
                                <div
                                    key={theme.id}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                        currentTheme.id === theme.id
                                            ? 'border-purple-500 bg-purple-50 shadow-md'
                                            : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                                    }`}
                                    onClick={() => handleColorThemeChange(theme.id)}
                                >
                                    <div className="mb-3">
                                        <h4 className="text-md font-semibold text-gray-800 mb-1">
                                            {theme.name}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {theme.description}
                                        </p>
                                    </div>
                                    
                                    {/* カラーパレット表示 */}
                                    <div className="flex space-x-2 mb-3">
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-300"
                                            style={{ backgroundColor: theme.colors.primaryNavy }}
                                            title="Primary Navy"
                                        ></div>
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-300"
                                            style={{ backgroundColor: theme.colors.primaryBlue }}
                                            title="Primary Blue"
                                        ></div>
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-300"
                                            style={{ backgroundColor: theme.colors.accentGold }}
                                            title="Accent Gold"
                                        ></div>
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-300"
                                            style={{ backgroundColor: theme.colors.accentEmerald }}
                                            title="Accent Emerald"
                                        ></div>
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-300"
                                            style={{ backgroundColor: theme.colors.accentRose }}
                                            title="Accent Rose"
                                        ></div>
                                    </div>
                                    
                                    {/* 選択状態表示 */}
                                    {currentTheme.id === theme.id && (
                                        <div className="flex items-center text-purple-600 text-sm font-medium">
                                            <i className="fas fa-check-circle mr-2"></i>
                                            現在選択中
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* プレビュー例 */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">プレビュー例</h3>
                        <div className="space-y-4">
                            <div 
                                className="p-4 rounded-lg text-white"
                                style={{ backgroundColor: currentTheme.colors.primaryNavy }}
                            >
                                <h4 className="font-bold">プライマリーカラー（ネイビー）</h4>
                                <p>メインヘッダーやナビゲーションに使用されます</p>
                            </div>
                            
                            <div 
                                className="p-4 rounded-lg text-white"
                                style={{ backgroundColor: currentTheme.colors.primaryBlue }}
                            >
                                <h4 className="font-bold">プライマリーカラー（ブルー）</h4>
                                <p>ボタンやリンクに使用されます</p>
                            </div>
                            
                            <div className="flex space-x-2">
                                <div 
                                    className="flex-1 p-3 rounded text-white text-center"
                                    style={{ backgroundColor: currentTheme.colors.accentGold }}
                                >
                                    <strong>アクセントゴールド</strong>
                                </div>
                                <div 
                                    className="flex-1 p-3 rounded text-white text-center"
                                    style={{ backgroundColor: currentTheme.colors.accentEmerald }}
                                >
                                    <strong>アクセントエメラルド</strong>
                                </div>
                                <div 
                                    className="flex-1 p-3 rounded text-white text-center"
                                    style={{ backgroundColor: currentTheme.colors.accentRose }}
                                >
                                    <strong>アクセントローズ</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                            <div>
                                <h4 className="font-medium text-gray-800">カラーテーマについて</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    • カラーテーマの変更は即座にサイト全体に反映されます<br/>
                                    • 設定はブラウザに自動保存され、次回アクセス時にも適用されます<br/>
                                    • 各テーマは異なる印象やブランドイメージを表現するように設計されています
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {viewMode === 'adminSettings' && (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-user-cog mr-3 text-indigo-600"></i>管理者設定
                </h2>
                
                {adminSettingsStatus && (
                    <div className={`p-3 mb-4 rounded-md text-sm ${adminSettingsStatus.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {adminSettingsStatus}
                    </div>
                )}

                <div className="space-y-8">
                    {/* パスワードリセット用設定 */}
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-shield-alt mr-2 text-blue-600"></i>
                            パスワードリセット認証設定
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            管理者パスワードを忘れた場合に使用する認証方法を設定します。
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 電話番号設定 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fas fa-mobile-alt mr-2 text-blue-500"></i>
                                    登録電話番号
                                </label>
                                <input
                                    type="tel"
                                    value={adminPhoneNumber}
                                    onChange={(e) => {
                                      const numbersOnly = e.target.value.replace(/\D/g, '');
                                      setAdminPhoneNumber(numbersOnly);
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                    placeholder="例: 09012345678"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    SMS認証でパスワードリセットを行う際に使用されます
                                </p>
                            </div>

                            {/* バックアップコード設定 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fas fa-key mr-2 text-green-500"></i>
                                    バックアップコード
                                </label>
                                <input
                                    type="text"
                                    value={adminBackupCode}
                                    onChange={(e) => setAdminBackupCode(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out"
                                    placeholder="例: MT-BACKUP-2024"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    SMS認証が利用できない場合の代替認証方法です（8文字以上）
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* セキュリティ情報 */}
                    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-exclamation-triangle mr-2 text-yellow-600"></i>
                            セキュリティ情報
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                                <div>
                                    <h4 className="font-medium text-gray-800">パスワードリセット手順</h4>
                                    <p className="text-sm text-gray-600">
                                        1. ログイン画面で「パスワードを忘れた場合」をクリック<br/>
                                        2. SMS認証またはバックアップコードで本人確認<br/>
                                        3. 新しいパスワードを設定
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                                <i className="fas fa-lock text-green-500 mt-1"></i>
                                <div>
                                    <h4 className="font-medium text-gray-800">セキュリティ対策</h4>
                                    <p className="text-sm text-gray-600">
                                        • 電話番号とバックアップコードは安全な場所に保管してください<br/>
                                        • バックアップコードは定期的に変更することを推奨します<br/>
                                        • SMS認証が利用できない場合に備えてバックアップコードを必ず設定してください
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <i className="fas fa-shield-alt text-purple-500 mt-1"></i>
                                <div>
                                    <h4 className="font-medium text-gray-800">認証方法</h4>
                                    <p className="text-sm text-gray-600">
                                        • <strong>SMS認証:</strong> 登録電話番号に送信される4桁の認証コード<br/>
                                        • <strong>バックアップコード:</strong> 事前に設定した固定のコード<br/>
                                        • どちらか一方の認証に成功すればパスワードリセットが可能です
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 保存ボタン */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => {
                                secureLog('管理者設定保存ボタンがクリックされました');
                                handleSaveAdminSettings();
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center"
                        >
                            <i className="fas fa-save mr-2"></i>
                            管理者設定を保存
                        </button>
                    </div>
                </div>
            </div>
        )}

      </main>

      <footer className="bg-gray-200 text-center py-4 mt-auto">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} MoneyTicket Admin Dashboard.
        </p>
      </footer>
    </div>
  );
};

export default AdminDashboardPage;
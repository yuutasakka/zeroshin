

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { UserSessionData, FinancialProduct, Company, Testimonial, NotificationSettings, EmailNotificationConfig, SlackNotificationConfig, LineNotificationConfig, ChatWorkNotificationConfig } from '../types';
import { diagnosisFormMapping } from '../data/diagnosisFormMapping';
import { allFinancialProducts as defaultFinancialProducts } from '../data/financialProductsData';
import { defaultTestimonialsData } from '../data/testimonialsData';


interface AdminDashboardPageProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

type AdminViewMode = 'userHistory' | 'productSettings' | 'testimonialSettings' | 'analyticsSettings' | 'notificationSettings';

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
  const [userSessions, setUserSessions] = useState<UserSessionData[]>([]);
  const [viewMode, setViewMode] = useState<AdminViewMode>('userHistory');
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


  useEffect(() => {
    // Load user sessions
    const storedSessionsString = localStorage.getItem('userSessions');
    let loadedSessions: UserSessionData[] = [];
    if (storedSessionsString) {
      try {
        loadedSessions = JSON.parse(storedSessionsString);
        setUserSessions(loadedSessions);
      } catch (e) {
        console.error("Error parsing user sessions from localStorage:", e);
      }
    }
    calculateDashboardStats(loadedSessions);


    // Load financial products for editing
    const customProductsString = localStorage.getItem('customFinancialProducts');
    if (customProductsString) {
      try {
        const customProducts = JSON.parse(customProductsString);
        setProductsForEditing(customProducts);
      } catch (e) {
        console.error("Error parsing custom financial products from localStorage:", e);
        setProductsForEditing(JSON.parse(JSON.stringify(defaultFinancialProducts))); // Deep copy
      }
    } else {
      setProductsForEditing(JSON.parse(JSON.stringify(defaultFinancialProducts))); // Deep copy
    }

    // Load testimonials for editing
    const customTestimonialsString = localStorage.getItem('customTestimonials');
    if (customTestimonialsString) {
        try {
            const customTestimonials = JSON.parse(customTestimonialsString);
            setTestimonialsForEditing(customTestimonials);
        } catch (e) {
            console.error("Error parsing custom testimonials from localStorage:", e);
            setTestimonialsForEditing(JSON.parse(JSON.stringify(defaultTestimonialsData)));
        }
    } else {
        setTestimonialsForEditing(JSON.parse(JSON.stringify(defaultTestimonialsData)));
    }

    // Load tracking scripts
    const storedTrackingScripts = localStorage.getItem('customTrackingScripts');
    if (storedTrackingScripts) {
      try {
        const parsedScripts = JSON.parse(storedTrackingScripts);
        if (parsedScripts && typeof parsedScripts === 'object' &&
            typeof parsedScripts.head === 'string' &&
            typeof parsedScripts.bodyEnd === 'string') {
          setTrackingScripts(parsedScripts);
        } else {
            console.warn("Custom tracking scripts data from localStorage is malformed or not in the expected format.");
        }
      } catch (e) {
        console.error("Error parsing custom tracking scripts from localStorage:", e);
      }
    }

    // Load notification settings
    const storedNotificationSettings = localStorage.getItem('notificationConfigurations');
    if (storedNotificationSettings) {
        try {
            const parsedSettings = JSON.parse(storedNotificationSettings);
            // Basic validation to ensure structure matches
            if (parsedSettings.email && parsedSettings.slack && parsedSettings.line && parsedSettings.chatwork) {
                 setNotificationSettings(parsedSettings);
            } else {
                console.warn("Notification settings from localStorage are malformed. Using defaults.");
                setNotificationSettings(initialNotificationSettings);
            }
        } catch (e) {
            console.error("Error parsing notification settings from localStorage:", e);
            setNotificationSettings(initialNotificationSettings);
        }
    } else {
        setNotificationSettings(initialNotificationSettings);
    }

  }, []);

  const calculateDashboardStats = (sessions: UserSessionData[]) => {
    if (sessions.length === 0) {
        setDashboardStats({
            totalDiagnoses: 0,
            diagnosesLast7Days: 0,
            averageInvestmentAmount: 0,
            mostCommonPurpose: 'N/A',
            ageDistribution: {},
        });
        return;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const diagnosesLast7Days = sessions.filter(s => new Date(s.timestamp) >= sevenDaysAgo).length;

    const investmentAmountsNumeric: Record<string, number> = {
        'less_10k': 5000,
        '10k_30k': 20000,
        '30k_50k': 40000,
        '50k_100k': 75000,
        'more_100k': 120000,
    };
    
    let totalInvestmentSum = 0;
    let validInvestmentCount = 0;
    sessions.forEach(s => {
        const amountKey = s.diagnosisAnswers.amount;
        if (amountKey && investmentAmountsNumeric[amountKey]) {
            totalInvestmentSum += investmentAmountsNumeric[amountKey];
            validInvestmentCount++;
        }
    });
    const averageInvestmentAmount = validInvestmentCount > 0 ? totalInvestmentSum / validInvestmentCount : 0;

    const purposeCounts: Record<string, number> = {};
    sessions.forEach(s => {
        const purpose = s.diagnosisAnswers.purpose;
        if (purpose) {
            purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
        }
    });
    const mostCommonPurposeValue = Object.keys(purposeCounts).reduce((a, b) => purposeCounts[a] > purposeCounts[b] ? a : b, 'N/A');
    const mostCommonPurposeLabel = mostCommonPurposeValue !== 'N/A' ? getAnswerLabel('purpose', mostCommonPurposeValue) : 'N/A';


    const ageCounts: Record<string, number> = {};
    sessions.forEach(s => {
        const age = s.diagnosisAnswers.age;
        if (age) {
            ageCounts[age] = (ageCounts[age] || 0) + 1;
        }
    });
    const ageDistribution: Record<string, string> = {};
    Object.keys(ageCounts).forEach(ageKey => {
        ageDistribution[getAnswerLabel('age', ageKey)] = ((ageCounts[ageKey] / sessions.length) * 100).toFixed(1) + '%';
    });
    
    setDashboardStats({
        totalDiagnoses: sessions.length,
        diagnosesLast7Days,
        averageInvestmentAmount: parseFloat(averageInvestmentAmount.toFixed(0)),
        mostCommonPurpose: mostCommonPurposeLabel,
        ageDistribution,
    });
  };

  const getAnswerLabel = (questionId: keyof typeof diagnosisFormMapping, value: string): string => {
    const mapping = diagnosisFormMapping[questionId];
    if (mapping && mapping[value]) {
      return mapping[value];
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

  const handleSaveProductSettings = () => {
    setProductSettingsStatus('保存中...');
    try {
      localStorage.setItem('customFinancialProducts', JSON.stringify(productsForEditing));
      setProductSettingsStatus('商品設定が保存されました！');
      setTimeout(() => setProductSettingsStatus(''), 3000);
    } catch (error) {
      console.error("Error saving product settings to localStorage:", error);
      setProductSettingsStatus('保存中にエラーが発生しました。');
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
  
  const handleSaveTestimonialSettings = () => {
    setTestimonialStatus('保存中...');
    try {
        localStorage.setItem('customTestimonials', JSON.stringify(testimonialsForEditing));
        setTestimonialStatus('お客様の声の設定が保存されました！');
        setTimeout(() => setTestimonialStatus(''), 3000);
    } catch (error) {
        console.error("Error saving testimonial settings to localStorage:", error);
        setTestimonialStatus('保存中にエラーが発生しました。');
    }
  };

  // Analytics Settings Handlers
  const handleTrackingScriptChange = (part: 'head' | 'bodyEnd', value: string) => {
    setTrackingScripts(prev => ({ ...prev, [part]: value }));
  };

  const handleSaveTrackingScripts = () => {
      setAnalyticsSettingsStatus('保存中...');
      try {
          localStorage.setItem('customTrackingScripts', JSON.stringify(trackingScripts));
          setAnalyticsSettingsStatus('トラッキング設定が保存されました！');
          setTimeout(() => setAnalyticsSettingsStatus(''), 3000);
      } catch (error) {
          console.error("Error saving tracking scripts to localStorage:", error);
          setAnalyticsSettingsStatus('保存中にエラーが発生しました。');
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

  const handleSaveNotificationSettings = () => {
    setNotificationSettingsStatus('保存中...');
    try {
        localStorage.setItem('notificationConfigurations', JSON.stringify(notificationSettings));
        setNotificationSettingsStatus('通知設定が保存されました！');
        setTimeout(() => setNotificationSettingsStatus(''), 3000);
    } catch (error) {
        console.error("Error saving notification settings to localStorage:", error);
        setNotificationSettingsStatus('通知設定の保存中にエラーが発生しました。');
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-gray-800 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-tachometer-alt text-2xl mr-3"></i>
            <h1 className="text-xl font-semibold">管理画面</h1>
          </div>
          <div className="flex items-center space-x-4">
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
      </header>

      <main className="flex-grow container mx-auto px-6 py-8">
        {/* Navigation between admin sections */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">管理メニュー</h2>
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => setViewMode('userHistory')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'userHistory' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-users-cog mr-2"></i>ユーザー診断履歴
                </button>
                <button 
                    onClick={() => setViewMode('productSettings')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'productSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-gifts mr-2"></i>商品リンク設定
                </button>
                 <button 
                    onClick={() => setViewMode('testimonialSettings')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'testimonialSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-comments mr-2"></i>お客様の声 管理
                </button>
                <button 
                    onClick={() => setViewMode('analyticsSettings')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'analyticsSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-chart-line mr-2"></i>アナリティクス設定
                </button>
                 <button 
                    onClick={() => setViewMode('notificationSettings')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'notificationSettings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-bell mr-2"></i>通知設定
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
                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0"><i className="fas fa-exclamation-triangle text-yellow-500 text-xl"></i></div>
                        <div className="ml-3"><p className="text-sm text-yellow-700"><strong>デモに関する注意:</strong> ユーザーデータはブラウザのローカルストレージに保存されています。</p></div>
                    </div>
                </div>
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
                        <div key={company.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 items-end">
                            <span className="text-sm font-medium text-gray-600 md:col-span-3">取扱会社: {company.name}</span>
                            <div>
                            <label htmlFor={`url-${pIdx}-${cIdx}`} className="block text-xs font-medium text-gray-500">ウェブサイトURL</label>
                            <input
                                type="url"
                                id={`url-${pIdx}-${cIdx}`}
                                value={company.websiteUrl}
                                onChange={(e) => handleProductInputChange(pIdx, cIdx, 'websiteUrl', e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                            />
                            </div>
                        </div>
                        ))
                    ) : <p className="text-sm text-gray-500">この商品には編集可能な取扱会社情報がありません。</p>}
                    </div>
                ))}
                </div>
                <button
                    onClick={handleSaveProductSettings}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                >
                    <i className="fas fa-save mr-2"></i>商品設定を保存
                </button>
                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0"><i className="fas fa-exclamation-triangle text-yellow-500 text-xl"></i></div>
                        <div className="ml-3"><p className="text-sm text-yellow-700"><strong>デモに関する注意:</strong> 商品データはブラウザのローカルストレージに保存されています。</p></div>
                    </div>
                </div>
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
                 <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0"><i className="fas fa-exclamation-triangle text-yellow-500 text-xl"></i></div>
                        <div className="ml-3"><p className="text-sm text-yellow-700"><strong>デモに関する注意:</strong> お客様の声データはブラウザのローカルストレージに保存されています。</p></div>
                    </div>
                </div>
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
                            <p className="text-sm text-yellow-700 mt-1">データはブラウザのローカルストレージに保存されます。</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {viewMode === 'notificationSettings' && (
             <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-bell mr-3 text-orange-500"></i>通知設定
                    <span className="text-xs text-gray-500 ml-2">(実際の通知はバックエンド実装が必要です)</span>
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
                            <div>
                                <label htmlFor="emailRecipients" className="block text-sm font-medium text-gray-600">受信者メールアドレス (カンマ区切り)</label>
                                <input type="text" id="emailRecipients"
                                    value={notificationSettings.email.recipientEmails}
                                    onChange={(e) => handleNotificationSettingChange('email', 'recipientEmails', e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="admin1@example.com,admin2@example.com"
                                />
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
                                    placeholder="デモ用: バックエンドで安全に管理"
                                />
                                <p className="text-xs text-red-500 mt-1">注意: アクセストークンは機密情報です。このデモでは入力できますが、実際のアプリではバックエンドで安全に保管してください。</p>
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
                                        placeholder="デモ用: バックエンドで安全に管理"
                                    />
                                     <p className="text-xs text-red-500 mt-1">注意: APIトークンは機密情報です。このデモでは入力できますが、実際のアプリではバックエンドで安全に保管してください。</p>
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
                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0"><i className="fas fa-exclamation-triangle text-yellow-500 text-xl"></i></div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700"><strong>デモに関する注意:</strong> 通知設定はブラウザのローカルストレージに保存されます。実際の通知送信はバックエンドサーバーでの実装が必要です。Webhook URLやAPIトークンなどの機密情報は、本番環境ではフロントエンドに保存せず、必ずバックエンドで安全に管理してください。</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </main>

      <footer className="bg-gray-200 text-center py-4 mt-auto">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} MoneyTicket Admin Dashboard.
          <br />
          セキュリティとプライバシーを最優先に。
        </p>
      </footer>
    </div>
  );
};

export default AdminDashboardPage;
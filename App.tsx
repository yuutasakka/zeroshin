

import React, { useState, useEffect } from 'react';
// import { GoogleGenAI } from "@google/genai"; // Removed: AI client should be in the backend
import Header from './components/Header';
import MainVisualAndDiagnosis from './components/MainVisualAndDiagnosis';
import ReliabilitySection from './components/ReliabilitySection';
import SecurityTrustSection from './components/SecurityTrustSection';
import CallToActionSection from './components/CallToActionSection';
import Footer from './components/Footer';
import PhoneVerificationPage from './components/PhoneVerificationPage';
import DiagnosisResultsPage from './components/DiagnosisResultsPage';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboardPage from './components/AdminDashboardPage';
import { DiagnosisFormState, PageView, UserSessionData } from './types';

// AI Client Initialization (GoogleGenAI) has been removed from the frontend.
// API calls to Gemini API should be proxied through a secure backend server
// to protect the API key and manage requests efficiently.
// The backend will be responsible for interacting with the GoogleGenAI SDK.

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('diagnosis');
  const [phoneNumberToVerify, setPhoneNumberToVerify] = useState<string | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisFormState | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);


  useEffect(() => {
    // Apply body class for verification and results pages for consistent styling
    if (currentPage === 'verification' || currentPage === 'results' || currentPage === 'login' || currentPage === 'adminDashboard') {
      document.body.classList.add('verification-page-active'); // This class now applies premium dark gradient
    } else {
      document.body.classList.remove('verification-page-active');
      document.body.style.fontFamily = 'var(--font-primary)'; // Ensure main pages use Inter
    }
    // Cleanup function
    return () => {
      document.body.classList.remove('verification-page-active');
    };
  }, [currentPage]);

  useEffect(() => {
    const scriptsString = localStorage.getItem('customTrackingScripts');
    if (scriptsString) {
      try {
        const scripts: { head: string; bodyEnd: string } = JSON.parse(scriptsString);

        if (scripts.head && typeof scripts.head === 'string' && scripts.head.trim() !== '') {
          const headFragment = document.createRange().createContextualFragment(scripts.head);
          document.head.appendChild(headFragment);
        }

        if (scripts.bodyEnd && typeof scripts.bodyEnd === 'string' && scripts.bodyEnd.trim() !== '') {
          const bodyEndFragment = document.createRange().createContextualFragment(scripts.bodyEnd);
          document.body.appendChild(bodyEndFragment); // Appends at the end of body
        }
      } catch (e) {
        console.error("Error loading or injecting custom tracking scripts:", e);
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleProceedToVerification = (phoneNumber: string, formData: DiagnosisFormState) => {
    setPhoneNumberToVerify(phoneNumber);
    setDiagnosisData(formData); // Store diagnosis data
    setCurrentPage('verification');
    window.scrollTo(0, 0); 
  };

  const handleVerificationComplete = () => {
    if (diagnosisData && phoneNumberToVerify) {
      const newSession: UserSessionData = {
        id: `session_${new Date().getTime()}_${Math.random().toString(36).substring(2,9)}`,
        timestamp: new Date().toISOString(),
        phoneNumber: phoneNumberToVerify,
        diagnosisAnswers: diagnosisData,
      };

      // Retrieve existing sessions or initialize if none
      const existingSessionsString = localStorage.getItem('userSessions');
      const existingSessions: UserSessionData[] = existingSessionsString ? JSON.parse(existingSessionsString) : [];
      
      // Add new session and save back to local storage
      existingSessions.push(newSession);
      localStorage.setItem('userSessions', JSON.stringify(existingSessions));
    }
    setCurrentPage('results'); 
    window.scrollTo(0, 0);
  };

  const handleVerificationCancel = () => {
    setCurrentPage('diagnosis'); 
    window.scrollTo(0,0);
  }

  const handleReturnToStart = () => {
    setPhoneNumberToVerify(null);
    setDiagnosisData(null);
    if (isAdminLoggedIn) { // Also log out admin if returning to start from an admin context
        setIsAdminLoggedIn(false);
    }
    setCurrentPage('diagnosis');
    window.scrollTo(0,0);
  }

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentPage('adminDashboard');
    window.scrollTo(0,0);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentPage('login'); // Redirect to admin login page after logout
    window.scrollTo(0,0);
  };
  
  const navigateToHome = () => {
    setCurrentPage('diagnosis');
    window.scrollTo(0,0);
  };

  const navigateToAdminLogin = () => {
    setCurrentPage('login');
    window.scrollTo(0,0);
  };


  if (currentPage === 'login') {
    return <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} onNavigateHome={navigateToHome} />;
  }

  if (currentPage === 'adminDashboard') {
    if (!isAdminLoggedIn) {
      // Redirect to login if not authenticated
      return <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} onNavigateHome={navigateToHome} />;
    }
    return <AdminDashboardPage onLogout={handleAdminLogout} onNavigateHome={navigateToHome} />;
  }

  if (currentPage === 'verification') {
    return phoneNumberToVerify ? (
      <PhoneVerificationPage 
        phoneNumber={phoneNumberToVerify} 
        onVerificationComplete={handleVerificationComplete}
        onCancel={handleVerificationCancel}
      />
    ) : (
      // Fallback if somehow phoneNumberToVerify is null
      <MainVisualAndDiagnosis onProceedToVerification={handleProceedToVerification} />
    );
  }

  if (currentPage === 'results') {
    return <DiagnosisResultsPage diagnosisData={diagnosisData} onReturnToStart={handleReturnToStart}/>;
  }

  // Default page is 'diagnosis'
  return (
    <>
      <Header />
      <MainVisualAndDiagnosis onProceedToVerification={handleProceedToVerification} />
      <ReliabilitySection />
      <SecurityTrustSection />
      <CallToActionSection />
      <Footer onNavigateToAdminLogin={navigateToAdminLogin} />
    </>
  );
};

export default App;
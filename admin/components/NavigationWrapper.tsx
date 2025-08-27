/**
 * React Router ナビゲーション設定ラッパー
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigate } from '../utils/navigation';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

const NavigationWrapper: React.FC<NavigationWrapperProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // グローバルナビゲーション関数を設定
    setNavigate(navigate);
  }, [navigate]);

  return <>{children}</>;
};

export default NavigationWrapper;
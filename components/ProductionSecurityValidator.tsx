import React, { useEffect, useState } from 'react';
import { SECURITY_CONFIG } from '../security.config';

interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const ProductionSecurityValidator: React.FC = () => {
  const [validationResult, setValidationResult] = useState<SecurityValidationResult | null>(null);
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    const checkProductionEnvironment = () => {
      const isProd = process.env.NODE_ENV === 'production' ||
                    (typeof window !== 'undefined' && 
                     window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1') &&
                     !window.location.hostname.includes('preview'));
      
      setIsProduction(isProd);
      
      if (isProd) {
        validateProductionSecurity();
      }
    };

    const validateProductionSecurity = async () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        // 環境変数チェック
        const requiredVars = ['VITE_JWT_SECRET', 'VITE_SESSION_SECRET', 'VITE_ENCRYPTION_KEY'];
        requiredVars.forEach(varName => {
          const value = (import.meta as any).env?.[varName];
          if (!value || value.includes('CHANGE_ME') || value.includes('dev-')) {
            errors.push(`${varName} is not properly configured for production`);
          }
        });

        // セキュリティ設定検証
        if (typeof SECURITY_CONFIG.validateProductionSecurity === 'function') {
          try {
            await SECURITY_CONFIG.validateProductionSecurity();
          } catch (error) {
            errors.push(`Security validation failed: ${error}`);
          }
        }

        // CSPヘッダー警告
        const unsafeInlineUsage = document.querySelector('style[nonce]') === null;
        if (unsafeInlineUsage) {
          warnings.push('Consider implementing nonce-based CSP for inline styles');
        }

        setValidationResult({
          isValid: errors.length === 0,
          errors,
          warnings
        });

      } catch (error) {
        setValidationResult({
          isValid: false,
          errors: [`Security validation error: ${error}`],
          warnings: []
        });
      }
    };

    checkProductionEnvironment();
  }, []);

  if (!isProduction) {
    return null; // 開発環境では何も表示しない
  }

  if (!validationResult) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center z-50">
        セキュリティ検証中...
      </div>
    );
  }

  if (!validationResult.isValid) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 text-center z-50">
        <div className="font-bold">🚨 本番環境セキュリティエラー</div>
        <div className="text-sm mt-2">
          {validationResult.errors.map((error, index) => (
            <div key={index}>• {error}</div>
          ))}
        </div>
      </div>
    );
  }

  if (validationResult.warnings.length > 0) {
    return (
      <div className="fixed top-0 right-0 bg-orange-500 text-white p-2 text-xs z-40 max-w-sm">
        <div className="font-bold">⚠️ セキュリティ警告</div>
        {validationResult.warnings.map((warning, index) => (
          <div key={index}>• {warning}</div>
        ))}
      </div>
    );
  }

  return null;
};

export default ProductionSecurityValidator; 
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: '127.0.0.1',
    open: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  optimizeDeps: {
    exclude: ['mock-aws-s3', 'aws-sdk', 'nock', '@mapbox/node-pre-gyp']
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      external: ['mock-aws-s3', 'aws-sdk', 'nock', '@mapbox/node-pre-gyp'],
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-utils': ['crypto-js', 'qrcode.react'],
          'admin-components': [
            './src/components/AdminDashboardPage',
            './src/components/AdminLoginPage',
            './src/components/AdminPasswordResetPage'
          ],
          'diagnosis-components': [
            './src/components/OptimizedDiagnosisFlow',
            './src/components/DiagnosisResultsPage'
          ],
          'auth-components': [
            './src/components/PhoneVerificationPage',
            './src/components/SMSAuthFlow',
            './src/components/SupabaseAuthLogin'
          ]
        }
      }
    }
  }
});
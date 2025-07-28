import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// 管理画面専用のVite設定
export default defineConfig({
  plugins: [react()],
  build: {
    // 管理画面専用のビルド設定
    outDir: 'dist/admin',
    emptyOutDir: true,
    
    // エントリーポイントを管理画面に設定
    rollupOptions: {
      input: {
        admin: resolve(__dirname, 'admin/admin.html'),
      },
      output: {
        // 管理画面のチャンクファイル名を隠蔽
        entryFileNames: '[hash].js',
        chunkFileNames: '[hash].js',
        assetFileNames: '[hash].[ext]',
        
        // 管理画面のコードを難読化
        manualChunks: undefined,
      },
      external: [],
    },
    
    // セキュリティ強化のための設定
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      mangle: {
        toplevel: true,
        properties: {
          regex: /^_/,
        },
      },
      format: {
        comments: false,
      },
    },
    
    // バンドルサイズ最適化
    chunkSizeWarningLimit: 1000,
    
    // ソースマップを本番では無効化
    sourcemap: false,
  },
  
  // 開発サーバー設定（管理画面用）
  server: {
    port: 3001,
    strictPort: true,
    host: 'localhost',
    
    // 管理画面のプロキシ設定
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // 環境変数の設定
  define: {
    __ADMIN_BUILD__: true,
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // 管理画面専用のエイリアス
  resolve: {
    alias: {
      '@admin': resolve(__dirname, 'admin'),
      '@components': resolve(__dirname, 'admin/components'),
      '@pages': resolve(__dirname, 'admin/pages'),
      '@utils': resolve(__dirname, 'admin/utils'),
    },
  },
  
  // CSS設定
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          $admin-primary: #007acc;
          $admin-secondary: #0056b3;
          $admin-success: #28a745;
          $admin-danger: #dc3545;
          $admin-warning: #ffc107;
          $admin-dark: #1a1a2e;
          $admin-darker: #16213e;
        `,
      },
    },
    modules: {
      // CSS Modulesの設定（管理画面のスタイル隠蔽）
      generateScopedName: '[hash:base64:8]',
    },
  },
  
  // ESBuilドの最適化
  esbuild: {
    // 本番ビルドでは全てのログを削除
    drop: ['console', 'debugger'],
    legalComments: 'none',
    
    // TypeScriptの型チェックを厳格化
    target: 'es2020',
    format: 'esm',
  },
  
  // プラグイン設定
  optimizeDeps: {
    // 管理画面で使用する依存関係の事前バンドル
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
    ],
    exclude: [
      // メインアプリの依存関係は除外
    ],
  },
});
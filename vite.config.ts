import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isDev = mode === 'development';
  
  return {
    base: '/',
    plugins: [react({
      jsxRuntime: 'automatic'
    })],
    server: {
      port: 5174,
      open: true,
      host: 'localhost',
      strictPort: false,
      hmr: isDev ? {
        port: 5175,
        overlay: false,
        clientPort: 5175,
        // WebSocket接続エラーを抑制
        skipRestartOnNegotiation: true
      } : false,
      cors: true,
      // 本番環境ではWebSocketを完全に無効化
      ...(isDev ? {} : { ws: false, hmr: false })
    },
    preview: {
      port: 4173,
      host: 'localhost',
      strictPort: false,
      // プレビューでもWebSocketを無効化
      ws: false
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'production' ? false : true,
      minify: mode === 'production' ? 'terser' : 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['crypto-js', 'chart.js'],
            supabase: ['@supabase/supabase-js']
          }
        }
      },
      // 本番環境でのビルド最適化
      ...(mode === 'production' ? {
        target: 'es2020',
        cssCodeSplit: true,
        assetsInlineLimit: 4096,
        chunkSizeWarningLimit: 500
      } : {})
    },
    esbuild: {
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      drop: isDev ? [] : ['console', 'debugger']
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.WS_ENDPOINT': JSON.stringify(false),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.DEV': JSON.stringify(isDev),
      'process.env.API_BASE_URL': JSON.stringify(isDev ? 'http://localhost:8080' : ''),
      'import.meta.hot': JSON.stringify(isDev ? true : undefined),
      '__DEV__': JSON.stringify(isDev),
      '__PROD__': JSON.stringify(!isDev),
      // WebSocket関連の定数を無効化
      'WEBSOCKET_ENABLED': JSON.stringify(false),
      'HMR_WEBSOCKET_URL': JSON.stringify('')
    },
    envPrefix: ['VITE_', 'REACT_APP_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      exclude: ['plasmo', 'parcel', 'ws', 'websocket', 'parcel-runtime', 'socket.io-client']
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api']
        }
      }
    },
    logLevel: isDev ? 'info' : 'warn'
  };
});

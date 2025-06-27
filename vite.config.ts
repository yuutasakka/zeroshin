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
        clientPort: 5175
      } : false,
      cors: true,
      ...(isDev ? {} : { ws: false })
    },
    build: {
      outDir: 'dist',
      sourcemap: isDev,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['crypto-js', 'chart.js']
          }
        }
      }
    },
    esbuild: {
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment'
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.WS_ENDPOINT': 'false',
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.DEV': JSON.stringify(isDev),
      'process.env.API_BASE_URL': JSON.stringify(isDev ? 'http://localhost:8080' : '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      exclude: ['plasmo', 'parcel', 'ws', 'websocket']
    },
    logLevel: 'warn'
  };
});

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
    preview: {
      port: 4173,
      host: 'localhost',
      strictPort: false
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
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
      '__DEV__': JSON.stringify(isDev),
      '__PROD__': JSON.stringify(!isDev)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      exclude: ['plasmo', 'parcel', 'ws', 'websocket', 'parcel-runtime']
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

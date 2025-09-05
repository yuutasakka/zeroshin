import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081,
    host: '127.0.0.1',
    open: false
  },
  build: {
    target: 'es2020',
    minify: true
  }
});
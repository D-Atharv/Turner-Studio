import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@turner/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@turner/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});

import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PACKAGES_SRC = path.resolve(__dirname, '../../packages');

// Vite plugin: redirects .js imports from packages/*/src/ to their .ts
// equivalents, bridging NodeNext resolution in packages vs. Vite browser serving.
const resolvePackageTsFromJs = {
  name: 'resolve-package-ts-from-js',
  resolveId(id: string, importer: string | undefined): string | undefined {
    if (!id.endsWith('.js')) return undefined;
    if (!importer?.startsWith(PACKAGES_SRC)) return undefined;

    const candidate = id.startsWith('/')
      ? id.slice(0, -3) + '.ts'
      : path.resolve(path.dirname(importer), id.slice(0, -3) + '.ts');

    return fs.existsSync(candidate) ? candidate : undefined;
  }
};

export default defineConfig({
  plugins: [react(), resolvePackageTsFromJs],
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

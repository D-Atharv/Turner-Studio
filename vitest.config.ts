import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage'
    }
  },
  resolve: {
    alias: {
      '@turner/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
      '@turner/contracts': path.resolve(__dirname, 'packages/contracts/src/index.ts'),
      '@turner/domain': path.resolve(__dirname, 'packages/domain/src/index.ts'),
      '@turner/media-engine': path.resolve(__dirname, 'packages/media-engine/src/index.ts'),
      '@turner/persistence': path.resolve(__dirname, 'packages/persistence/src/index.ts'),
      '@turner/observability': path.resolve(__dirname, 'packages/observability/src/index.ts')
    }
  }
});

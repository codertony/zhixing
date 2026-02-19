import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', '.turbo/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/migrations/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@zhixing/db': new URL('./packages/db/src', import.meta.url).pathname,
      '@zhixing/shared': new URL('./packages/shared/src', import.meta.url).pathname,
      '@zhixing/gitlab-client': new URL('./packages/gitlab-client/src', import.meta.url).pathname,
    },
  },
});

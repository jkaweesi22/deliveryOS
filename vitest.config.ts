import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/automation/**/*.test.ts', 'src/automation/**/__tests__/**/*.ts'],
  },
});

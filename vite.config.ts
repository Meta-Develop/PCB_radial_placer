import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
  },
});

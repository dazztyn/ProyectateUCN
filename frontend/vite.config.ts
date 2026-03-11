import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    
    environment: 'jsdom',
    
    include: ['**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx'],
    
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    setupFiles: './vitest.setup.js',
    
    globals: true,
  },
})

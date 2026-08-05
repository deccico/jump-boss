/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the game from /jump-boss/
  base: command === 'build' ? '/jump-boss/' : '/',
  build: { target: 'es2022' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));

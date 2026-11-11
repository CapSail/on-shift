import { defineConfig } from 'vite';

// BASE_PATH is set by the Pages workflow (Phase 1), e.g. "/on-shift/".
// './' keeps the build relocatable for local previews.
export default defineConfig({
  base: process.env.BASE_PATH || './',
  build: { target: 'es2022', sourcemap: false },
});

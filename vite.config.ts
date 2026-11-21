import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the static build works on GitHub Pages project sites
  // (e.g. /Song-Adventskalender/) and locally via `vite preview`.
  base: './',
  build: {
    target: 'es2022',
  },
});

import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [
    vinext(),
    cloudflare({viteEnvironment: {name: 'rsc', childEnvironments: ['ssr']}}),
  ],
});

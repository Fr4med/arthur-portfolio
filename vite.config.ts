import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

if (process.env.WORKERS_CI === '1' && process.env.WORKERS_CI_BRANCH === 'cloudflare-workers-preview') {
  // PostHog project tokens are public and are included in the browser bundle.
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = 'phc_wLS7t4Vcu7NbACSKpwy6iirvSyKhFZzN5FPFyRxHXv7x';
}

export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [
    vinext(),
  ],
});

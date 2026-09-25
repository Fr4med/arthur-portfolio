# Deploy ArthurH on Render

Create a **Web Service**, connected to `Fr4med/arthur-portfolio`.

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root directory | Leave blank: package.json is at this repository's root |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check | `/health` |
| Instance | Free for initial validation |
| NODE_VERSION | `22.22.0` |
| NODE_ENV | `production` |

There is no Publish Directory field for a Web Service. `render.yaml` records these settings for a Render Blueprint. Push this migration before deploying it; selecting an older commit will use the old Cloudflare build.

If this project is later placed inside a different monorepo, set Root Directory to the folder containing this package.json.

## Why the original build could not be a Static Site

The original build contained browser files in `dist/client` and a Cloudflare Worker in `dist/server`. The Worker rendered page requests and handled routing. A Static Site serves prebuilt files and cannot execute that server code. Publishing only the client folder leaves the page renderer behind.

This migration retains Vinext, React, all routes, fonts, photos, and the Three.js camera. Vinext now builds a Node.js server; `npm start` runs its production server on `0.0.0.0` using Render's `PORT`. No Wrangler development server runs in production. A static export could be a separate future approach, but is not what this migration builds.

## Optional Instagram connection

Set `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_USER_ID` as private Render environment variables only if the live feed is used. Never prefix secrets with `VITE_` or `NEXT_PUBLIC_`. Missing credentials or an API failure use the saved, filtered posts. The About page feed uses a disposable 15-minute Node process cache; restarts clear it.

## Local verification

Run `npm ci --include=dev`, `npm run build`, `npm test`, and `npx tsc --noEmit`. Start with `npm start`, then run `node scripts/check-render.mjs http://127.0.0.1:3000` in another terminal.

The browser audit compares the preserved original Worker build with the Node production build, covering all five content pages, desktop and mobile layouts, camera reveal, film dialogs, contact navigation, and the old `/shaba-sesh` redirect. A pre-existing short-landscape film dialog overflow was fixed by bounding the dialog to the viewport and allowing its content to scroll.

Local browser tests verified the dialog and fallback link. After deployment, the H-Town Adventures embedded video played successfully in the live browser. This does not verify every third-party video or future availability.

## Live service and keep-alive

Arthur's site is `https://arthurkhitrik.com`, with `www.arthurkhitrik.com` redirecting to it. Both Cloudflare CNAME records point directly to `arthur-portfolio-yi47.onrender.com` with DNS-only mode. Render manages HTTPS. Email MX/SPF/DKIM records are preserved.

Arthur's free service also remains accessible at `https://arthur-portfolio-yi47.onrender.com`, in Frankfurt. Auto-deploy is disabled; deploy validated revisions deliberately through Render. The lightweight `/health` route returns JSON without invoking Instagram or loading media.

The dedicated Cloudflare Worker in `ops/arthur-keepalive` requests Render's `/health` route every five minutes. Its Cron Trigger runs in the Cloudflare account that owns `arthurkhitrik.com`, without a local PC or GitHub runner. A failed health check causes a failed Worker invocation visible in Cloudflare Cron Events. The previous GitHub Actions schedule ran hours late despite reporting successful jobs.

The Worker schedule is best-effort. Render sleeps after 15 minutes without inbound traffic and may restart free services independently. Render also limits each workspace to 750 free instance hours per calendar month; additional free services share it. Bandwidth and build limits still apply.

References: [Render Web Services](https://render.com/docs/web-services), [Render Next.js hosting choices](https://render.com/docs/deploy-nextjs-app).

import {createContactHandler} from '../lib/contact-handler';
import {PLAY_OUTSIDE_PATH, PLAY_OUTSIDE_RELEASE_AT} from '../lib/play-outside';

type Env = {
  ASSETS: {fetch: (request: Request) => Promise<Response>};
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
};

const contactHandlers = new WeakMap<Env, ReturnType<typeof createContactHandler>>();
const releaseAssetDirectory = '/play-outside-release';
const filmRoutes = new Set([PLAY_OUTSIDE_PATH, `${PLAY_OUTSIDE_PATH}/`, `${PLAY_OUTSIDE_PATH}.html`, `${PLAY_OUTSIDE_PATH}.txt`]);

async function servePlayOutside(request: Request, url: URL, assets: Env['ASSETS'], released: boolean) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, {status: 405, headers: {Allow: 'GET, HEAD'}});
  }

  const flight = url.pathname.endsWith('.txt');
  const assetPath = released ? `${releaseAssetDirectory}/ready` : PLAY_OUTSIDE_PATH;
  url.pathname = flight ? `${assetPath}.txt` : assetPath;
  url.search = '';
  const asset = await assets.fetch(new Request(url, {method: request.method}));
  const headers = new Headers(asset.headers);
  // The public URL must be checked again on every visit across the release time.
  headers.set('Cache-Control', 'no-store');
  return new Response(asset.body, {status: asset.status, headers});
}

export default {
  fetch(request: Request, env: Env): Promise<Response> | Response {
    const url = new URL(request.url);
    if (url.pathname === releaseAssetDirectory || url.pathname.startsWith(`${releaseAssetDirectory}/`)) {
      return new Response('Not found', {status: 404, headers: {'Cache-Control': 'no-store'}});
    }
    if (filmRoutes.has(url.pathname)) {
      return servePlayOutside(request, url, env.ASSETS, Date.now() >= PLAY_OUTSIDE_RELEASE_AT);
    }
    if (url.pathname === '/health') {
      return Response.json({status: 'ok'}, {headers: {'Cache-Control': 'no-store'}});
    }
    if (url.pathname === '/shaba-sesh' || url.pathname === '/shaba-sesh/') {
      return Response.redirect(new URL(`/shabbat-sesh${url.search}`, url.origin), 308);
    }
    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return new Response(null, {status: 405, headers: {Allow: 'POST'}});
      let handler = contactHandlers.get(env);
      if (!handler) {
        handler = createContactHandler(() => ({
          token: env.RESEND_API_KEY,
          turnstileSecret: env.TURNSTILE_SECRET_KEY,
          turnstileRequired: true,
        }));
        contactHandlers.set(env, handler);
      }
      return handler(request);
    }
    return env.ASSETS.fetch(request);
  },
};

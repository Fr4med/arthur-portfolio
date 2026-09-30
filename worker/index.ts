import {createContactHandler} from '../lib/contact-handler';

type Env = {
  ASSETS: {fetch: (request: Request) => Promise<Response>};
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
};

const contactHandlers = new WeakMap<Env, ReturnType<typeof createContactHandler>>();

export default {
  fetch(request: Request, env: Env): Promise<Response> | Response {
    const url = new URL(request.url);
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

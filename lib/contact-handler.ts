const recipient = 'bigboss@arthurkhitrik.com';
const maxBytes = 16384;
const allowedOrigins = new Set(['https://arthurkhitrik.com', 'https://www.arthurkhitrik.com', 'https://arthur-portfolio-yi47.onrender.com']);
type Config = {token?: string};
type Bucket = {count: number; until: number};

export function createContactHandler(config: () => Config, send: typeof fetch = fetch, now = Date.now) {
  // Bounded in-memory limits for this single Render instance. A restart resets them.
  const clients = new Map<string, Bucket>();
  let global: Bucket = {count: 0, until: 0};
  const json = (body: object, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});
  return async (request: Request) => {
    if (!allowedOrigins.has(request.headers.get('origin') || '')) return json({error: 'Please send your message from this website.'}, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error: 'Invalid request.'}, 415);
    if (Number(request.headers.get('content-length')) > maxBytes) return json({error: 'Message is too large.'}, 413);
    let input: Record<string, unknown>;
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({error: 'Please enter your message.'}, 400);
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) { await reader.cancel(); return json({error: 'Message is too large.'}, 413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
      input = JSON.parse(new TextDecoder().decode(bytes));
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid input');
    } catch { return json({error: 'Invalid request.'}, 400); }
    if (input.website) return json({error: 'Your message could not be sent.'}, 400);
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim() : '';
    const message = typeof input.message === 'string' ? input.message.trim() : '';
    if (!name || name.length > 100 || name.split('').some(char => char.charCodeAt(0) < 32) || !message || message.length > 3000 || message.includes('\0') || email.length > 254 || !/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(email)) {
      return json({error: 'Please enter your name, a valid email, and a message of up to 3,000 characters.'}, 400);
    }
    const {token} = config();
    if (!token) return json({error: `Sending is temporarily unavailable. Please email ${recipient}.`}, 503);
    const time = now();
    for (const [key, bucket] of clients) if (bucket.until <= time) clients.delete(key);
    if (global.until <= time) global = {count: 0, until: time + 3600000};
    // The global cap also limits abuse if a proxy supplies an untrusted client IP.
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',').at(-1)!.trim().slice(0, 64);
    const bucket = clients.get(ip) || {count: 0, until: time + 900000};
    if (bucket.count >= 3 || global.count >= 20) return json({error: 'Too many messages. Please try again later or email Arthur directly.'}, 429);
    bucket.count++; global.count++; clients.set(ip, bucket);
    try {
      const response = await send('https://api.resend.com/emails', {
        method: 'POST', headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({from: 'website@arthurkhitrik.com', to: [recipient], reply_to: email,
          subject: `Website enquiry from ${name}`, text: `Name: ${name}\nReply email: ${email}\n\n${message}`}),
        signal: AbortSignal.timeout(20000),
      });
      const body = await response.json();
      if (!response.ok || typeof body?.id !== 'string' || !body.id.trim()) {
        console.error('Contact email was not accepted', response.status);
        return json({error: `Your message could not be sent. Please try again or email ${recipient}.`}, 502);
      }
      return json({ok: true});
    } catch {
      console.error('Contact email request failed');
      return json({error: `Could not confirm delivery. Please try again or email ${recipient}.`}, 502);
    }
  };
}

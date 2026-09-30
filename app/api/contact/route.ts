import {createContactHandler} from '../../../lib/contact-handler';

export const POST = createContactHandler(() => ({
  token: process.env.RESEND_API_KEY,
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY,
  turnstileRequired: process.env.TURNSTILE_REQUIRED === 'true',
}));

import {createContactHandler} from '../../../lib/contact-handler';

export const POST = createContactHandler(() => ({
  token: process.env.CLOUDFLARE_EMAIL_API_TOKEN,
  accountId: process.env.CLOUDFLARE_EMAIL_ACCOUNT_ID,
}));

import {createContactHandler} from '../../../lib/contact-handler';

export const POST = createContactHandler(() => ({
  token: process.env.RESEND_API_KEY,
}));

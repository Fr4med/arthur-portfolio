import test from 'node:test';
import assert from 'node:assert/strict';
import {createContactHandler} from '../lib/contact-handler.ts';

const valid = {name: 'Visitor', email: 'visitor@example.com', message: 'A film enquiry', website: ''};
const req = (data = valid, origin = 'https://arthurkhitrik.com') => new Request('https://arthurkhitrik.com/api/contact', {method: 'POST', headers: {'content-type': 'application/json', origin}, body: JSON.stringify(data)});
const config = () => ({token: 'test-only'});
const accepted = () => Response.json({id: 'test-email-id'});

test('sends to the fixed official address and sets the visitor as reply-to', async () => {
  let sent;
  const handler = createContactHandler(config, async (url, options) => {assert.equal(url, 'https://api.resend.com/emails'); assert.equal(options.headers.Authorization, 'Bearer test-only'); sent = JSON.parse(options.body); return accepted();});
  assert.equal((await handler(req({...valid, to: 'attacker@example.com'}))).status, 200);
  assert.deepEqual(sent.to, ['bigboss@arthurkhitrik.com']);
  assert.equal(sent.reply_to, valid.email);
  assert.equal(sent.from, 'website@arthurkhitrik.com');
});
test('accepts the Cloudflare preview origin for contact form validation', async () => {
  const handler = createContactHandler(config, async () => accepted());
  assert.equal((await handler(req(valid, 'https://arthur-portfolio-preview.adamkrestol.workers.dev'))).status, 200);
});
test('blocks foreign origins, malformed input, header injection, spam traps and oversized bodies without sending', async () => {
  let calls = 0;
  const handler = createContactHandler(config, async () => {calls++; return accepted();});
  assert.equal((await handler(req(valid, 'https://other.example'))).status, 403);
  for (const value of [null, [], {...valid, email: 'x\r\nBcc:evil@example.com'}, {...valid, name: 'x\nBcc:evil'}, {...valid, message: ' '}, {...valid, website: 'spam'}]) assert.equal((await handler(req(value))).status, 400);
  assert.equal((await handler(req({...valid, message: 'x'.repeat(17000)}))).status, 413);
  assert.equal(calls, 0);
});
test('never reports success for missing credentials, provider rejection, missing message ID or network failure', async () => {
  assert.equal((await createContactHandler(() => ({}))(req())).status, 503);
  for (const provider of [async () => Response.json({name:'validation_error',message:'Domain not verified'}, {status:403}), async () => Response.json({}), async () => {throw new Error('offline');}]) {
    assert.equal((await createContactHandler(config, provider)(req())).status, 502);
  }
});
test('limits repeated messages and permits sending after the limit expires', async () => {
  let time = 1000;
  const handler = createContactHandler(config, async () => accepted(), () => time);
  for (let i = 0; i < 3; i++) assert.equal((await handler(req())).status, 200);
  assert.equal((await handler(req())).status, 429);
  time += 900001;
  assert.equal((await handler(req())).status, 200);
});
test('requires server-verified Turnstile token with matching hostname and action before sending', async () => {
  let sends = 0;
  let verification;
  const handler = createContactHandler(
    () => ({token: 'test-only', turnstileSecret: 'test-secret', turnstileRequired: true}),
    async () => {sends++; return accepted();},
    Date.now,
    async (url, options) => {
      assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
      assert.equal(options.body.get('secret'), 'test-secret');
      assert.equal(options.body.get('response'), 'challenge-token');
      return Response.json(verification);
    },
  );
  assert.equal((await handler(req())).status, 400);
  for (const result of [
    {success: false},
    {success: true, hostname: 'attacker.example', action: 'contact'},
    {success: true, hostname: 'arthurkhitrik.com', action: 'other'},
  ]) {
    verification = result;
    assert.equal((await handler(req({...valid, turnstileToken: 'challenge-token'}))).status, 400);
  }
  assert.equal(sends, 0);
  verification = {success: true, hostname: 'arthurkhitrik.com', action: 'contact'};
  assert.equal((await handler(req({...valid, turnstileToken: 'challenge-token'}))).status, 200);
  assert.equal(sends, 1);
});
test('fails closed when Turnstile is required but unavailable', async () => {
  assert.equal((await createContactHandler(() => ({token: 'test-only', turnstileRequired: true}))(req({...valid, turnstileToken: 'challenge-token'}))).status, 503);
  const handler = createContactHandler(() => ({token: 'test-only', turnstileSecret: 'test-secret', turnstileRequired: true}), async () => {throw new Error('Email must not send');}, Date.now, async () => {throw new Error('offline');});
  assert.equal((await handler(req({...valid, turnstileToken: 'challenge-token'}))).status, 503);
});

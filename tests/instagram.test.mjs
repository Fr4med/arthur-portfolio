import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyPost, selectWorkPosts, postShortcode } from '../lib/instagram-rules.ts';
import { fetchInstagramPosts } from '../lib/instagram-source.ts';

const post = (caption, extra = {}) => ({ id: '1', username: 'arthurkhitrik', permalink: 'https://www.instagram.com/p/ValidPost123/', mediaType: 'VIDEO', caption, timestamp: '2026-09-06T12:00:00Z', ...extra });

test('only the clearly credited film qualifies in the six real captions', () => {
  const sample = JSON.parse(readFileSync(new URL('../lib/instagram-posts.json', import.meta.url), 'utf8'));
  assert.deepEqual(sample.map(p => classifyPost(p).decision), ['include', 'exclude', 'exclude', 'exclude', 'exclude', 'review']);
  assert.deepEqual(selectWorkPosts(sample).map(p => postShortcode(p.permalink)), ['Dcf_JeJNzu8']);
});

test('explicit English and Hebrew work credits qualify', () => {
  for (const caption of ['Filmed by me.', 'Edit by @arthurkhitrik', 'VIDEO BY ARTHUR KHITRIK', 'I filmed this session.', 'I edited the whole video.', '#filmedbyarthur', '#editedbyme', 'צילום ועריכה שלי', 'ערכתי את הסרטון', 'צילמתי את הסרטון']) {
    assert.equal(classifyPost(post(caption)).decision, 'include', caption);
  }
  assert.deepEqual(classifyPost(post('Filmed & edited by me')).roles, ['Filming', 'Editing']);
});

test('broad skate words, other people’s credits, denials and questions stay out', () => {
  for (const caption of ['Skateboarding session in Paris #skate #bts', 'Always a good time shooting with @rvca_israel', 'Filmed by @someone_else', 'I was filmed by @someone_else', 'Filmed by @arthurkhitrik_fan', 'Not filmed by me.', 'This is not my edit.', 'Filmed by me? No.', 'He said "filmed by me".', 'My edit #notportfolio', 'My edit #akprivate', '#filmedbyme_fake']) {
    assert.notEqual(classifyPost(post(caption)).decision, 'include', caption);
  }
});

test('Stories, Highlights, profile URLs and lookalike domains never qualify', () => {
  for (const permalink of ['https://www.instagram.com/stories/arthurkhitrik/123/', 'https://www.instagram.com/stories/highlights/123/', 'https://www.instagram.com/arthurkhitrik/', 'https://instagram.com.evil.test/p/ValidPost123/', 'https://instagram.com@evil.test/p/ValidPost123/']) {
    assert.equal(classifyPost(post('Filmed by me', { permalink })).decision, 'exclude');
  }
  assert.equal(classifyPost(post('Filmed by me', { mediaProductType: 'STORY' })).decision, 'exclude');
  assert.equal(classifyPost(post('Filmed by me', { username: 'another_account' })).decision, 'exclude');
  assert.equal(classifyPost(post('Filmed by me', { permalink: 'https://www.instagram.com/reel/ValidReel123/' })).decision, 'include');
});

test('newer qualifying posts sort first and duplicate permalinks are removed', () => {
  const old = post('My edit');
  const recent = post('Filmed by me', { id: '2', permalink: 'https://www.instagram.com/p/NewPost456/', timestamp: '2026-09-07T12:00:00Z' });
  assert.deepEqual(selectWorkPosts([old, recent, old]).map(p => p.id), ['2', '1']);
});

test('API uses only the media endpoint and never follows a supplied paging host', async () => {
  const calls = [];
  const posts = await fetchInstagramPosts({ token: 'test-token', userId: '12345', request: async (url, options) => {
    calls.push({ url: url.toString(), options });
    return Response.json({ data: [{ id: String(calls.length), username: 'arthurkhitrik', caption: 'Filmed by me', permalink: `https://www.instagram.com/p/MediaPost${calls.length}/`, media_type: 'VIDEO', media_product_type: 'REELS', timestamp: '2026-09-06T12:00:00Z' }], ...(calls.length === 1 ? { paging: { next: 'https://evil.test/?access_token=stolen', cursors: { after: 'next-cursor' } } } : {}) });
  } });
  assert.equal(posts.length, 2);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(new URL(call.url).origin, 'https://graph.instagram.com');
    assert.equal(new URL(call.url).pathname, '/v25.0/12345/media');
    assert.equal(call.options.headers.Authorization, 'Bearer test-token');
    assert.equal(call.url.includes('test-token'), false);
    assert.equal(call.options.redirect, 'error');
  }
  assert.equal(new URL(calls[1].url).searchParams.get('after'), 'next-cursor');
});

test('expired tokens and malformed API data fail without exposing response details', async () => {
  await assert.rejects(fetchInstagramPosts({ token: 'test-token', userId: '12345', request: async () => new Response('secret payload', { status: 401 }) }), { message: 'Instagram request failed' });
  await assert.rejects(fetchInstagramPosts({ token: 'test-token', userId: '12345', request: async () => Response.json({ error: 'secret payload' }) }), { message: 'Invalid Instagram response' });
  await assert.rejects(fetchInstagramPosts({ token: 'test-token', userId: '../invalid', request: async () => { throw new Error('Should not fetch'); } }), { message: 'Instagram connection missing' });
});

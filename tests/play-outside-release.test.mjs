import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getPlayOutsideRelease,
  PLAY_OUTSIDE_RELEASE_AT,
  PLAY_OUTSIDE_TIME_ZONE,
} from '../lib/play-outside.ts';

test('release instant is Thursday 12 November at 15:00 in Israel', () => {
  const local = new Intl.DateTimeFormat('en-GB', {
    timeZone: PLAY_OUTSIDE_TIME_ZONE,
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(PLAY_OUTSIDE_RELEASE_AT);
  const part = name => local.find(item => item.type === name).value;
  assert.equal(part('weekday'), 'Thursday');
  assert.equal(`${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`, '2026-11-12 15:00');
  assert.equal(new Date(PLAY_OUTSIDE_RELEASE_AT).toISOString(), '2026-11-12T13:00:00.000Z');
});

test('the final fraction of a second still counts down without releasing early', () => {
  assert.deepEqual(getPlayOutsideRelease(PLAY_OUTSIDE_RELEASE_AT - 1), {
    released: false, days: 0, hours: 0, minutes: 0, seconds: 1,
  });
});

test('the film releases at the exact instant and stays released the next week', () => {
  for (const now of [PLAY_OUTSIDE_RELEASE_AT, PLAY_OUTSIDE_RELEASE_AT + 1, PLAY_OUTSIDE_RELEASE_AT + 7 * 86400000]) {
    assert.deepEqual(getPlayOutsideRelease(now), {
      released: true, days: 0, hours: 0, minutes: 0, seconds: 0,
    });
  }
});

test('countdown carries days, hours and minutes correctly', () => {
  assert.deepEqual(getPlayOutsideRelease(Date.parse('2026-11-10T10:44:32Z')), {
    released: false, days: 2, hours: 2, minutes: 15, seconds: 28,
  });
});

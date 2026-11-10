export const PLAY_OUTSIDE_VIDEO_ID = 'cLxrlSP5gO8';
export const PLAY_OUTSIDE_RELEASE = '2026-11-12T15:00:00+02:00';
export const PLAY_OUTSIDE_RELEASE_AT = Date.parse(PLAY_OUTSIDE_RELEASE);
export const PLAY_OUTSIDE_TIME_ZONE = 'Asia/Jerusalem';
export const PLAY_OUTSIDE_PATH = '/daniel-torneo-play-outside';

export function getPlayOutsideRelease(now: number) {
  const secondsLeft = Math.max(0, Math.ceil((PLAY_OUTSIDE_RELEASE_AT - now) / 1000));
  return {
    released: now >= PLAY_OUTSIDE_RELEASE_AT,
    days: Math.floor(secondsLeft / 86400),
    hours: Math.floor((secondsLeft % 86400) / 3600),
    minutes: Math.floor((secondsLeft % 3600) / 60),
    seconds: secondsLeft % 60,
  };
}

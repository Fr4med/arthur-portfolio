import type { Metadata } from 'next';
import { PLAY_OUTSIDE_PATH } from './play-outside';

export const PLAY_OUTSIDE_PUBLIC_URL = `https://arthurkhitrik.com${PLAY_OUTSIDE_PATH}`;

export function getPlayOutsideShare(released: boolean) {
  const phase = released ? 'ready' : 'coming-soon';
  return {
    url: PLAY_OUTSIDE_PUBLIC_URL,
    title: 'Daniel Torneo: Play Outside',
    description: released
      ? 'Watch Play Outside, a skate film with Daniel Torneo, and see photographs from the sessions.'
      : 'Play Outside with Daniel Torneo. Full part premieres Thursday, 12 November at 15:00 Israel time.',
    image: `/films/play-outside/share/${phase}-card-red-v1.png`,
    story: `/films/play-outside/share/${phase}-story-red-v1.png`,
    imageAlt: released
      ? 'Play Outside with Daniel Torneo. Out now. Arthur Khitrik.'
      : 'Play Outside with Daniel Torneo. Coming Thursday, 12 November at 15:00 Israel time. Arthur Khitrik.',
    phase,
  };
}

export function getFacebookShareUrl() {
  const url = new URL('https://www.facebook.com/sharer/sharer.php');
  url.searchParams.set('u', PLAY_OUTSIDE_PUBLIC_URL);
  return url.toString();
}

export function getPlayOutsideMetadata(released: boolean): Metadata {
  const share = getPlayOutsideShare(released);
  return {
    title: `${share.title} | Arthur Khitrik`,
    description: share.description,
    alternates: { canonical: PLAY_OUTSIDE_PUBLIC_URL },
    openGraph: {
      title: share.title,
      description: share.description,
      siteName: 'Arthur Khitrik',
      url: share.url,
      type: 'website',
      images: [{ url: share.image, width: 1200, height: 630, alt: share.imageAlt, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: share.title,
      description: share.description,
      images: [{ url: share.image, alt: share.imageAlt }],
    },
  };
}

import { PLAY_OUTSIDE_PATH } from './play-outside';

type BlogPost = {
  slug: string;
  href: string;
  title: string;
  category: string;
  image: number;
  alt: string;
  excerpt: string;
  coverTitle?: string;
  coverCaption?: string;
};

// Append new stories here. The blog and carousel both display this catalog newest first.
const entries: BlogPost[] = [
  {
    slug: 'behind-the-camera',
    href: '/blog/behind-the-camera',
    title: 'Behind the camera',
    category: 'Photo journal',
    image: 12,
    alt: 'Arthur filming a street session in Paris',
    excerpt: 'Following the session, checking the clip and going again. Photographs from behind the lens.',
    coverTitle: 'BEHIND THE\nCAMERA',
  },
  {
    slug: 'shabbat-sesh',
    href: '/shabbat-sesh',
    title: 'SHABBAT SESH',
    category: 'Film & premiere',
    image: 13,
    alt: 'The SHABBAT SESH premiere at Gilis Skateshop',
    excerpt: 'The full film, the crew and a night at Gilis. A look back at 18 September 2025.',
    coverTitle: 'SHABBAT\nSESH',
  },
  {
    slug: 'evyatar-tahar-rvca-il',
    href: '/evyatar-tahar-rvca-il',
    title: 'Evyatar Tahar welcome part - RVCA IL',
    category: 'Film & premiere',
    image: 30,
    alt: 'The audience at the RVCA IL premiere at Skyriders bar',
    excerpt: 'Seven months of filming with Evyatar, Gil and the RVCA IL team. Watch the welcome part and revisit the premiere night.',
    coverTitle: 'EVYATAR\nTAHAR',
    coverCaption: 'WELCOME PART / RVCA IL',
  },
  {
    slug: 'daniel-torneo-play-outside',
    href: PLAY_OUTSIDE_PATH,
    title: 'Daniel Torneo: Play Outside',
    category: 'Film & premiere',
    image: 33,
    alt: 'A skater carrying his board up concrete steps beside a curved wall',
    excerpt: 'Daniel Torneo’s skate part, plus four prints from the sessions.',
    coverTitle: 'PLAY\nOUTSIDE',
  },
];

export const posts = [...entries].reverse();

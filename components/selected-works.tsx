'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { PLAY_OUTSIDE_RELEASE_AT, PLAY_OUTSIDE_VIDEO_ID } from '@/lib/play-outside';

type Film = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  poster?: string;
  releaseAt?: number;
};

// Add new videos at the top and preserve the existing videos' relative order.
const films: Film[] = [
  {
    id: PLAY_OUTSIDE_VIDEO_ID,
    title: 'PLAY OUTSIDE',
    subtitle: 'Daniel Torneo · RVCA IL',
    category: 'Skate film',
    poster: '/films/play-outside/steps-640.webp',
    releaseAt: PLAY_OUTSIDE_RELEASE_AT,
  },
  { id: 'qebe1pawd4Q', title: 'EVYATAR TAHAR', subtitle: 'Welcome part - RVCA IL', category: 'Welcome part' },
  { id: 'a_6WP38cPLs', title: 'H-TOWN ADVENTURES', subtitle: 'RVCA Israel', category: 'On the road', poster: '/photos/06-1600.webp' },
  { id: '-T_E8705WKM', title: 'SHABBAT SESH', subtitle: 'A skate video by Arthur Khitrik', category: 'Skate film' },
  { id: '3P2LnFrUu0U', title: 'N9 IN PARIS', subtitle: 'N9 trip to Paris, 2025', category: 'On the road' },
  { id: 'RMm_e1s54A8', title: 'GO SKATE DAY', subtitle: "Tel Aviv, 2026 · Gili's Skate Shop", category: 'Skate film' },
  { id: '_tyHrUSh6GI', title: 'JIN-G DROPS', subtitle: 'Ramat Hachayal Skatepark', category: 'Skate film' },
  { id: 'J6dvfCfBzL4', title: 'EVYATAR TAHAR', subtitle: 'Welcome to Spicy Grips', category: 'Welcome part' },
];

const releaseTimes = films
  .map(({ releaseAt }) => releaseAt)
  .filter(releaseAt => releaseAt !== undefined)
  .sort((first, second) => first - second);

export default function SelectedWorks({ initialNow }: { initialNow: number }) {
  const [now, setNow] = useState(initialNow);
  const [active, setActive] = useState<string | null>(null);
  const filmTitleRef = useRef<HTMLHeadingElement>(null);
  const visibleFilms = films.filter(({ releaseAt }) => releaseAt === undefined || releaseAt <= now);
  const film = visibleFilms.find(item => item.id === active);

  useEffect(() => {
    if (!releaseTimes.some(releaseAt => releaseAt > initialNow)) return;

    let timer: number | undefined;
    let latest = initialNow;
    const update = () => {
      window.clearTimeout(timer);
      latest = Math.max(latest, Date.now());
      setNow(latest);
      const nextRelease = releaseTimes.find(releaseAt => releaseAt > latest);
      if (nextRelease !== undefined) {
        // Browsers cap setTimeout delays at a signed 32-bit integer.
        timer = window.setTimeout(update, Math.min(nextRelease - latest, 2_147_483_647));
      }
    };

    update();
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pageshow', update);
    window.addEventListener('focus', update);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('pageshow', update);
      window.removeEventListener('focus', update);
    };
  }, [initialNow]);

  return <>
    <section id="work" className="work-section" aria-labelledby="work-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ARCHIVE</p>
          <h2 id="work-title">SELECTED WORKS</h2>
        </div>
        <p>Out in the streets.<br />Back in the timeline.</p>
      </div>
      <div className="film-grid">
        {visibleFilms.map((item, index) => (
          <article className="film" key={item.id}>
            <div className="film-preview" aria-hidden="true">
              <img src={item.poster ?? `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`} alt="" loading="lazy" />
              <span className="film-number">{String(index + 1).padStart(2, '0')} / {String(visibleFilms.length).padStart(2, '0')}</span>
              <span className="play-circle"><Play size={20} fill="currentColor" /></span>
              <span className="preview-label">WATCH FILM</span>
            </div>
            <div className="film-info">
              <div>
                <h3>
                  <button
                    type="button"
                    className="film-trigger"
                    aria-label={`Play ${item.title}, ${item.subtitle}`}
                    aria-haspopup="dialog"
                    onClick={() => setActive(item.id)}
                  >
                    {item.title}
                  </button>
                </h3>
                <p>{item.subtitle}</p>
              </div>
              <span className="category">{item.category}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
    <Dialog open={active !== null} onOpenChange={open => { if (!open) setActive(null); }}>
      <DialogContent
        initialFocus={filmTitleRef}
        className="w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-w-5xl p-5"
      >
        <DialogTitle ref={filmTitleRef} tabIndex={-1} className="pr-8">{film?.title ?? 'Watch film'}</DialogTitle>
        <DialogDescription>{film?.subtitle}</DialogDescription>
        {film && <>
          <iframe
            className="youtube-player"
            key={film.id}
            src={`https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&playsinline=1&rel=0`}
            title={film.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <a className="youtube-fallback" href={`https://www.youtube.com/watch?v=${film.id}`} target="_blank" rel="noreferrer">
            Watch on YouTube <ArrowUpRight size={16} />
          </a>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}

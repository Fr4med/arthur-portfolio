'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import FeatureFilm from '@/components/feature-film';
import PlayOutsideShare, { usePlayOutsideSharePoster } from '@/components/play-outside-share';
import PlayOutsideBodyRoll from '@/components/play-outside-body-roll';
import {
  getPlayOutsideRelease,
  PLAY_OUTSIDE_RELEASE,
  PLAY_OUTSIDE_RELEASE_AT,
  PLAY_OUTSIDE_VIDEO_ID,
} from '@/lib/play-outside';
import styles from './project.module.css';

const photos = [
  { name: 'steps', width: 1729, height: 1364, alt: 'A skater carrying a skateboard up concrete steps beside a curved wall' },
  { name: 'street', width: 1739, height: 1365, alt: 'A skater talking with a group of children beside a street spot' },
  { name: 'hill', width: 1754, height: 1377, alt: 'Three skaters riding down a concrete path between trees and pale rocks' },
  { name: 'banks', width: 1506, height: 1191, alt: 'Two skaters at a concrete bank surrounded by tall grass' },
];

function Print({ name, width, height, alt, priority = false }: {
  name: string; width: number; height: number; alt: string; priority?: boolean;
}) {
  return <img
    src={`/films/play-outside/${name}-1600.webp`}
    srcSet={`/films/play-outside/${name}-640.webp ${Math.min(640, width)}w, /films/play-outside/${name}-1600.webp ${Math.min(1600, width)}w`}
    sizes={priority ? '(max-width: 700px) 82vw, 390px' : '(max-width: 700px) 88vw, 44vw'}
    width={width}
    height={height}
    alt={alt}
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : undefined}
  />;
}

export default function PlayOutsidePage({ initialNow }: { initialNow: number }) {
  const [now, setNow] = useState(initialNow);
  const time = getPlayOutsideRelease(now);
  const { released } = time;
  const sharePoster = usePlayOutsideSharePoster(released);

  useEffect(() => {
    if (initialNow >= PLAY_OUTSIDE_RELEASE_AT) return;

    let timer: number | undefined;
    const update = () => {
      window.clearTimeout(timer);
      const current = Date.now();
      setNow(previous => Math.max(previous, current));
      const untilRelease = PLAY_OUTSIDE_RELEASE_AT - current;
      if (untilRelease > 0) {
        timer = window.setTimeout(update, Math.min(1000, untilRelease));
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

  return <div className={styles.theme}>
    <a className={styles.skipLink} href="#top">Skip to film page</a>
    <SiteHeader />
    <main id="top" className={`sesh-page ${styles.page}`}>
      <section className={`sesh-hero ${styles.hero}`} aria-labelledby="film-title">
        <div>
          <p className={`eyebrow ${styles.skater}`}>DANIEL TORNEO</p>
          <h1 id="film-title" className={styles.title} aria-label="Play Outside">
            <PlayOutsideBodyRoll sizes="(max-width: 700px) 86vw, (max-width: 1100px) 47vw, 500px" />
          </h1>
          <div className={styles.releaseLine}>
            <span className={styles.releaseStatus} role="status">{released ? 'OUT NOW' : 'COMING SOON'}</span>
            <time dateTime={PLAY_OUTSIDE_RELEASE}>12 November 2026 / 15:00 Israel time</time>
          </div>
          <a className={`work-link ${styles.watchLink}`} href="#film">
            {released ? 'WATCH THE FILM' : 'COUNTING DOWN TO THE FULL PART'}<ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <div className={styles.heroPhoto}>
          <figure className={`sesh-poster ${styles.portrait}`}>
            <Print name="car" width={1280} height={1006} alt="A person at the wheel of a car, with open countryside outside the window" priority />
            <figcaption>PLAY OUTSIDE / PHOTO NOTES</figcaption>
          </figure>
          <PlayOutsideShare released={released} poster={sharePoster} compact />
        </div>
      </section>

      <section className={styles.filmSection} aria-label={released ? 'Watch Play Outside' : 'Play Outside release countdown'}>
        {released ? <div className={styles.releasedFilm}>
          <FeatureFilm
            videoId={PLAY_OUTSIDE_VIDEO_ID}
            title="Daniel Torneo: Play Outside"
            posterSrc="/films/play-outside/steps-1600.webp"
            posterAlt="A skater carrying a skateboard up concrete steps"
            label="PLAY OUTSIDE / WATCH THE FULL PART"
          />
        </div> : <div id="film" className={`feature-film ${styles.countdownFilm}`}>
          <div className={styles.filmCover}>
            <img src="/films/play-outside/steps-1600.webp" alt="A skater heading up the steps with his board" width={1729} height={1364} />
            <div className={styles.countdownOverlay}>
              <p className={styles.countdownHeading}>THE FULL PART DROPS IN</p>
              <dl className={styles.countdown} role="timer" aria-label="Time until Play Outside is released" aria-live="off">
                {([
                  ['Days', time.days],
                  ['Hours', time.hours],
                  ['Minutes', time.minutes],
                  ['Seconds', time.seconds],
                ] as const).map(([label, value]) => <div key={label}>
                  <dt>{label}</dt><dd>{String(value).padStart(2, '0')}</dd>
                </div>)}
              </dl>
              <p className={styles.releaseNote}>Thursday, 12 November at 15:00<span>Israel time</span></p>
            </div>
            <span className={styles.coverCaption}>DANIEL TORNEO / PLAY OUTSIDE</span>
          </div>
        </div>}
      </section>

      <PlayOutsideShare released={released} poster={sharePoster} />

      <section className={`premiere-section ${styles.photoSection}`} aria-labelledby="photos-title">
        <div className="section-heading">
          <div><p className="eyebrow">PLAY OUTSIDE</p><h2 id="photos-title">FROM THE SESSIONS.</h2></div>
        </div>
        <p className={styles.photoNote}>
          We had to make the most of the time before Santo left for his big trip. That’s how this short part for RVCA IL came to life, filmed over two and a half months as we wandered through various kibbutzim and back roads where we never expected to find any spots at all. But Santo’s passion for skateboarding always prevailed; somehow, he always found a way to skate anything, anywhere. It was a pleasure to be part of this project for my dear friends.
        </p>
        <div className={styles.gallery}>
          {photos.map(photo => <figure key={photo.name}><Print {...photo} /></figure>)}
        </div>
      </section>

      <a className="next-story" href="/shabbat-sesh">
        <span className="eyebrow">MORE SKATE FILMS</span>
        <h2>SHABBAT SESH <ArrowUpRight aria-hidden="true" /></h2>
      </a>
    </main>
    <SiteFooter />
  </div>;
}

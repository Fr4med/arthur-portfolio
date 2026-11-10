'use client';

import { useEffect, useState } from 'react';
import PlayOutsideLogo from './play-outside-logo';
import styles from './play-outside-body-roll.module.css';

const figures = '/films/play-outside/branding/body-roll-figures.webp';
const lettering = '/films/play-outside/branding/body-roll-lettering.webp';
const hoverQuery = '(hover: hover) and (pointer: fine)';
const motionQuery = '(prefers-reduced-motion: no-preference)';
type MotionMode = 'still' | 'tap' | 'hover';

export default function PlayOutsideBodyRoll({ sizes }: { sizes: string }) {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<MotionMode>('still');
  const [tap, setTap] = useState<number | null>(null);
  const playRequested = tap !== null;

  useEffect(() => {
    const hover = window.matchMedia(hoverQuery);
    const motion = window.matchMedia(motionQuery);

    function updateMode() {
      if (!motion.matches) {
        setMode('still');
        setTap(null);
        return;
      }
      setMode(hover.matches ? 'hover' : 'tap');
    }

    updateMode();
    hover.addEventListener('change', updateMode);
    motion.addEventListener('change', updateMode);
    return () => {
      hover.removeEventListener('change', updateMode);
      motion.removeEventListener('change', updateMode);
    };
  }, []);

  useEffect(() => {
    if (ready || mode === 'still' || (mode === 'tap' && !playRequested)) return;

    let disposed = false;
    const layers = [figures, lettering].map(src => {
      const image = new Image();
      if (!playRequested) image.fetchPriority = 'low';
      image.src = src;
      return image.decode();
    });

    Promise.all(layers).then(() => {
      if (!disposed) setReady(true);
    }).catch(() => {
      if (!disposed) setTap(null);
    });

    return () => { disposed = true; };
  }, [mode, playRequested, ready]);

  return <span
    className={styles.logo}
    data-body-roll
    data-ready={ready ? 'true' : undefined}
    data-playing={ready && playRequested ? 'true' : undefined}
  >
    <PlayOutsideLogo className={styles.still} priority sizes={sizes} />
    {ready && <span className={styles.layers} aria-hidden="true">
      <img className={styles.lettering} src={lettering} alt="" width={640} height={427} />
      <span
        key={tap ?? 0}
        className={styles.figures}
        data-body-roll-figures
        style={{ backgroundImage: `url(${figures})` }}
        onAnimationEnd={() => setTap(current => current === tap ? null : current)}
      />
    </span>}
    {mode !== 'still' && <button
      type="button"
      className={styles.trigger}
      aria-label="Play logo animation"
      aria-busy={playRequested && !ready}
      onClick={() => setTap(current => (current ?? 0) + 1)}
    />}
  </span>;
}

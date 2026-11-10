'use client';

import { useEffect, useState } from 'react';
import PlayOutsideLogo from './play-outside-logo';
import styles from './play-outside-body-roll.module.css';

const figures = '/films/play-outside/branding/body-roll-figures.webp';
const lettering = '/films/play-outside/branding/body-roll-lettering.webp';
const canHover = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

export default function PlayOutsideBodyRoll({ sizes }: { sizes: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(canHover);
    let disposed = false;
    let loading = false;

    function loadLayers() {
      if (!media.matches || loading) return;
      loading = true;
      const layers = [figures, lettering].map(src => {
        const image = new Image();
        image.fetchPriority = 'low';
        image.src = src;
        return image.decode();
      });

      Promise.all(layers).then(() => {
        if (!disposed) setReady(true);
      }).catch(() => {
        loading = false;
      });
    }

    loadLayers();
    media.addEventListener('change', loadLayers);
    return () => {
      disposed = true;
      media.removeEventListener('change', loadLayers);
    };
  }, []);

  return <span className={styles.logo} data-body-roll data-ready={ready ? 'true' : undefined}>
    <PlayOutsideLogo className={styles.still} priority sizes={sizes} />
    {ready && <span className={styles.layers} aria-hidden="true">
      <img className={styles.lettering} src={lettering} alt="" width={640} height={427} />
      <span className={styles.figures} data-body-roll-figures style={{ backgroundImage: `url(${figures})` }} />
    </span>}
  </span>;
}

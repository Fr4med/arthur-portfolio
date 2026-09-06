'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { mountCameraScene } from '@/lib/camera-scene';
import styles from './camera-hero.module.css';

export default function CameraHero({ onPlayFilm }: { onPlayFilm: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ReturnType<typeof mountCameraScene> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const abort = new AbortController();
    import('@/lib/camera-scene').then(({ mountCameraScene }) => {
      if (abort.signal.aborted) return;
      controlsRef.current = mountCameraScene(host, {
        signal: abort.signal,
        onReady: () => setStatus('ready'),
        onError: () => setStatus('error'),
        onPauseChange: setPaused,
      });
    }).catch(() => { if (!abort.signal.aborted) setStatus('error'); });
    return () => {
      abort.abort();
      controlsRef.current?.dispose();
      controlsRef.current = null;
    };
  }, []);

  return <section className={styles.hero} aria-labelledby="hero-title">
    <div className={styles.topline}>
      <span>BEHIND THE LENS. IN THE EDIT.</span>
      <span className={styles.filmIt}><i aria-hidden="true" /> FILM IT.</span>
    </div>
    <h1 id="hero-title" className={styles.title}>ARTHUR <span>KHITRIK.</span></h1>
    <div className={styles.stage} data-camera-status={status}>
      <div ref={hostRef} className={styles.canvas} role="group" tabIndex={status === 'ready' ? 0 : -1}
        aria-label="Interactive Panasonic HMC150 camera" aria-describedby="camera-instructions" />
      {status === 'loading' && <p className={styles.loading} role="status">LOADING CAMERA…</p>}
      {status === 'error' && <img className={styles.fallback} src="/models/panasonic-hmc150-preview.png" alt="Panasonic HMC150 camera model" width="1200" height="900" />}
    </div>
    <div className={styles.viewerBar}>
      <p className={styles.modelName}>PANASONIC AG-HMC150</p>
      <p id="camera-instructions" className={styles.instructions}>
        {status === 'ready' ? <>DRAG TO ROTATE<span className="sr-only">. Use the left and right arrow keys when the camera is focused.</span></> : status === 'error' ? 'CAMERA PREVIEW' : ''}
      </p>
      {status === 'ready' && <div className={styles.controls}>
        <button type="button" onClick={() => controlsRef.current?.setPaused(!paused)} aria-label={paused ? 'Play camera animation' : 'Pause camera animation'}>
          {paused ? <Play size={15} /> : <Pause size={15} />}<span>{paused ? 'PLAY' : 'PAUSE'}</span>
        </button>
        <button type="button" onClick={() => controlsRef.current?.reset()} aria-label="Reset camera view"><RotateCcw size={15} /></button>
      </div>}
    </div>
    <div className={styles.bottomline}>
      <p>Skateboarding. People. Places.<br />Films from the streets.</p>
      <a className={styles.explore} href="#work">EXPLORE THE FILMS <ArrowDown size={18} /></a>
      <button className={styles.featured} onClick={onPlayFilm}>WATCH SHABBAT SESH <ArrowUpRight size={18} /></button>
    </div>
  </section>;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowDownRight } from 'lucide-react';
import { cameraScrollProgress } from '@/lib/camera-scroll';
import type { mountCameraScene } from '@/lib/camera-scene';
import styles from './camera-scroll-intro.module.css';

export default function CameraScrollIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ReturnType<typeof mountCameraScene> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const host = hostRef.current;
    if (!section || !viewport || !host) return;
    const abort = new AbortController();
    let frame = 0;
    let progress = 0;
    function update() {
      frame = 0;
      if (!section || !viewport || abort.signal.aborted) return;
      const rect = section.getBoundingClientRect();
      progress = cameraScrollProgress(rect.top, rect.height, viewport.clientHeight);
      controlsRef.current?.setProgress(progress);
      section.style.setProperty('--intro-progress', String(progress));
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    const resize = new ResizeObserver(schedule);
    resize.observe(section);
    resize.observe(viewport);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    update();

    import('@/lib/camera-scene').then(({ mountCameraScene }) => {
      if (abort.signal.aborted) return;
      controlsRef.current = mountCameraScene(host, {
        signal: abort.signal,
        scrollDriven: true,
        onReady: () => { setStatus('ready'); schedule(); },
        onError: () => setStatus('error'),
        onPauseChange: () => {},
      });
      controlsRef.current.setProgress(progress);
    }).catch(() => { if (!abort.signal.aborted) setStatus('error'); });

    return () => {
      abort.abort();
      controlsRef.current?.dispose();
      controlsRef.current = null;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('pageshow', schedule);
    };
  }, []);

  return <>
    <section ref={sectionRef} className={styles.intro} data-status={status} aria-label="Camera introduction">
      <div ref={viewportRef} className={styles.viewport}>
        <div className={styles.topline}>
          <span>ARTHUR KHITRIK</span>
          <a href="#site-start">ENTER SITE <ArrowDownRight size={16} /></a>
        </div>
        <div ref={hostRef} className={styles.canvas} aria-hidden="true" />
        {status === 'loading' && <p className={styles.loading} role="status">LOADING CAMERA…</p>}
        {status === 'error' && <img className={styles.fallback} src="/models/panasonic-hmc150-preview.png" alt="Panasonic camera" width="1200" height="900" />}
        <div className={styles.bottomline}>
          <span>FILM IT.</span>
          <a href="#site-start">SCROLL TO EXPLORE <ArrowDown size={16} /></a>
        </div>
        <div className={styles.progress} aria-hidden="true" />
      </div>
    </section>
    <noscript><style>{`.${styles.intro}{display:none}`}</style></noscript>
  </>;
}

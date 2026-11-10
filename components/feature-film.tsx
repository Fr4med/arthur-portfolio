'use client';
import {useEffect, useRef, useState} from 'react';
import {Play,ArrowUpRight} from 'lucide-react';

type FeatureFilmProps = {
  videoId?: string;
  title?: string;
  posterSrc?: string;
  posterAlt?: string;
  label?: string;
};

export default function FeatureFilm({
  videoId = '-T_E8705WKM',
  title = 'SHABBAT SESH',
  posterSrc = '/photos/13-1600.webp',
  posterAlt = 'SHABBAT SESH on the screen at Gilis Skateshop',
  label = 'WATCH THE FULL FILM',
}: FeatureFilmProps) {
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (playing) playerRef.current?.focus();
  }, [playing]);
  return <div id="film" className="feature-film">
    {playing ? <iframe
      className="youtube-player"
      ref={playerRef}
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
      title={title}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    /> : <button className="feature-film-cover" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
      <img src={posterSrc} alt={posterAlt} loading="lazy" />
      <span className="play-circle"><Play fill="currentColor" aria-hidden="true" /></span>
      <span className="feature-film-label">{label}</span>
    </button>}
    <a className="youtube-fallback" href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer">Watch on YouTube <ArrowUpRight size={16} aria-hidden="true" /></a>
  </div>;
}

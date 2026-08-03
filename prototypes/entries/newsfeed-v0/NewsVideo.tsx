'use client';

import clsx from 'clsx';
import { useState } from 'react';

import type { NewsVideo } from './mocks';
import s from './NewsVideo.module.scss';

/**
 * Video affordances for a news story: the compact 16:9 poster beside a headline
 * in the feed, and the play-in-place hero at the top of the detail modal. Both
 * share one frame so a card thumbnail and the modal read as the same object.
 */

/**
 * Poster frames YouTube serves for a video id, best first. `maxresdefault` is
 * 1280×720 but 404s on older uploads; `hqdefault` (480×360, letterboxed) always
 * exists and is cropped to 16:9 by the frame; `mqdefault` (320×180) is already
 * 16:9 and plenty for the small card thumbnail.
 */
const POSTER_STEPS: Record<'card' | 'hero', string[]> = {
  card: ['mqdefault', 'hqdefault'],
  hero: ['maxresdefault', 'hqdefault'],
};

const posterUrl = (id: string, name: string) => `https://img.youtube.com/vi/${id}/${name}.jpg`;

/** Privacy-mode embed. `autoplay=1` is safe — playback is always user-initiated. */
const embedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;

/**
 * Poster image that walks the fallback chain, then gives up to a branded tile —
 * an unresolvable id shows a plain media surface rather than a broken image.
 */
function Poster({ video, variant }: { video: NewsVideo; variant: 'card' | 'hero' }) {
  const [step, setStep] = useState(0);
  const steps = POSTER_STEPS[variant];

  if (step >= steps.length) return <span className={s.fallback} aria-hidden />;

  return (
    <img
      className={s.img}
      src={posterUrl(video.id, steps[step])}
      alt=""
      loading="lazy"
      onError={() => setStep((i) => i + 1)}
    />
  );
}

/**
 * Feed card: a fixed-width poster beside the headline. Clicking it opens the
 * story's modal with the video already playing (the row's own click opens the
 * same modal, just paused) — so the play button never leads to a second click.
 */
export function VideoThumb({ video, title, onPlay }: { video: NewsVideo; title: string; onPlay: () => void }) {
  return (
    <button
      type="button"
      className={clsx(s.frame, s.thumb)}
      aria-label={`Play video: ${title}`}
      onClick={(e) => {
        e.stopPropagation();
        onPlay();
      }}
    >
      <Poster video={video} variant="card" />
      <span className={s.play} aria-hidden>
        <PlayIcon />
      </span>
      <span className={s.duration}>{video.duration}</span>
    </button>
  );
}

/**
 * Detail modal: full-width poster that swaps to the embed on click. Nothing
 * loads from YouTube's player until then — at rest this is one image.
 */
export function VideoPlayer({
  video,
  title,
  autoplay = false,
}: {
  video: NewsVideo;
  title: string;
  autoplay?: boolean;
}) {
  const [playing, setPlaying] = useState(autoplay);

  if (playing) {
    return (
      <div className={clsx(s.frame, s.hero)}>
        <iframe
          className={s.iframe}
          src={embedUrl(video.id)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={clsx(s.frame, s.hero)}
      aria-label={`Play video: ${title}`}
      onClick={() => setPlaying(true)}
    >
      <Poster video={video} variant="hero" />
      <span className={clsx(s.play, s.playLarge)} aria-hidden>
        <PlayIcon />
      </span>
      <span className={s.duration}>{video.duration}</span>
    </button>
  );
}

// Neutral play triangle — the badge carries the shape, so it stays in the PL
// palette rather than borrowing YouTube's red pill.
const PlayIcon = () => (
  <svg viewBox="0 0 12 14" fill="currentColor" aria-hidden>
    <path d="M11.2 6.13a1 1 0 0 1 0 1.74l-9.2 5.2A1 1 0 0 1 .5 12.2V1.8A1 1 0 0 1 2 .93l9.2 5.2Z" />
  </svg>
);

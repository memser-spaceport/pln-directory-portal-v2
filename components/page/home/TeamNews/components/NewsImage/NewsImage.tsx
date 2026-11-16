'use client';

import clsx from 'clsx';
import { useState } from 'react';

import s from './NewsImage.module.scss';
import { NEWS_IMAGE_SIZES } from './newsImageSources';

/**
 * Where the image sits (LAB-3134, Polina's "News imagery" rules; the prototype's `NewsImage` in newsfeed-v0):
 * - `thumb`: the Home stream card's fixed 168px column beside the text; full card width on phones.
 * - `wide`: the card's full width under the text, before the meta line (the default on every other surface).
 * - `hero`: the story modal's header, full width up to 632 × 356.
 */
export type NewsImageVariant = 'thumb' | 'wide' | 'hero';

interface NewsImageProps {
  src: string;
  /** LAB-3135: the resized copies as a `srcset` string (see `getNewsImageSources`). Absent = serve `src` as is. */
  srcSet?: string;
  variant: NewsImageVariant;
  className?: string;
}

type LoadState = 'loading' | 'loaded' | 'failed';

/**
 * A news story's image in a 16:9 frame. Not a control: the story row around it is the click target, so this is a plain
 * picture with `alt=""` (the headline already names the story). While it loads, and for good if the URL fails, the
 * frame shows a soft brand gradient instead of a broken image.
 *
 * Keyed by `src`, so moving to another story's image starts from "loading" again.
 */
export function NewsImage(props: NewsImageProps) {
  return <NewsImageFrame key={props.src} {...props} />;
}

function NewsImageFrame({ src, srcSet, variant, className }: NewsImageProps) {
  // The gradient is the frame's own background, behind the image rather than instead of it: an SSR'd image that
  // settles before hydration (so onLoad/onError never fire) still covers it when loaded, and a failed one with alt=""
  // draws nothing over it.
  const [state, setState] = useState<LoadState>('loading');

  return (
    <span className={clsx(s.frame, s.still, s[variant], state !== 'loaded' && s.pending, className)} data-state={state}>
      {state === 'failed' ? (
        <span className={s.fallback} aria-hidden />
      ) : (
        // LAB-3135: with resized copies the browser picks one by `sizes`; without them `src` is the stored URL.
        <img
          className={s.img}
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? NEWS_IMAGE_SIZES[variant] : undefined}
          alt=""
          loading="lazy"
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
        />
      )}
    </span>
  );
}

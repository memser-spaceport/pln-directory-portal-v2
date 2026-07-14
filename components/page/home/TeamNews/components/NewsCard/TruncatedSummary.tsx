'use client';

import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';

import s from './NewsCard.module.scss';

/**
 * Rail-only summary teaser, ported from the team-profile prototype
 * (prototypes/entries/team-profile/NewsCardView.tsx). Trims the summary to two
 * whole lines and appends an inline "… Show more". Measuring against an
 * off-screen gauge lets us cut on a word boundary, so text is never sliced
 * mid-word the way a fixed-width overlay would.
 *
 * Costs ~log2(words) forced reflows per card in a layout effect — acceptable
 * only because the rail caps at TEAM_NEWS_PREVIEW_LIMIT (3) cards. Never mount
 * this in modal-sized lists.
 */

// Two 20px lines (+1px measurement tolerance). .summaryTruncated's
// max-height: 40px safety net and .summaryMeasure's font metrics in
// NewsCard.module.scss must stay in sync with this.
const MAX_HEIGHT = 41;

type SummaryState =
  | { phase: 'measuring' } // full text behind the CSS clamp (SSR / pre-hydration fallback)
  | { phase: 'fits' } // full text, no button
  | { phase: 'truncated'; display: string };

interface TruncatedSummaryProps {
  summary: string;
  /** Item title, used only to label the button for screen readers. */
  title: string;
  onShowMore: () => void;
}

export const TruncatedSummary = ({ summary, title, onShowMore }: TruncatedSummaryProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SummaryState>({ phase: 'measuring' });

  useLayoutEffect(() => {
    // The fonts.ready promise below outlives unmount and effect re-runs; the
    // flag keeps a late resolution from measuring detached nodes.
    let canceled = false;
    let raf = 0;
    let lastWidth = -1;

    const compute = () => {
      if (canceled) return;
      const wrap = wrapRef.current;
      const gauge = gaugeRef.current;
      if (!wrap || !gauge) return;

      const width = wrap.clientWidth;
      // Hidden/detached elements report 0 and would misread as "fits".
      if (width === 0) return;
      lastWidth = width;

      gauge.style.width = `${width}px`;

      // Mirror the rendered line exactly: "text… " in the body weight, then
      // "Show more" as an atomic inline-block at weight 500 — matching the real
      // button, which can't break across lines. One label node reused across
      // all probes.
      const label = document.createElement('span');
      label.textContent = 'Show more';
      label.style.fontWeight = '500';
      label.style.whiteSpace = 'nowrap';
      label.style.display = 'inline-block';

      const fitsWithSuffix = (text: string) => {
        gauge.textContent = `${text}… `;
        gauge.appendChild(label);
        return gauge.offsetHeight <= MAX_HEIGHT;
      };

      gauge.textContent = summary;
      if (gauge.offsetHeight <= MAX_HEIGHT) {
        setState({ phase: 'fits' });
        return;
      }

      // Largest whole-word prefix that still fits beside the "… Show more"
      // label. Never trim below one word — a bare "… Show more" reads broken.
      const words = summary.split(' ');
      let lo = 1;
      let hi = words.length;
      let best = 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (fitsWithSuffix(words.slice(0, mid).join(' '))) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      setState({
        phase: 'truncated',
        display: words
          .slice(0, best)
          .join(' ')
          .replace(/[\s,;:]+$/, ''),
      });
    };

    const scheduleCompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    compute();

    // Width changes only (rail scrollbar appearing, breakpoint switches) — this
    // subsumes window resize. Our own setState changes the wrap's height, not
    // its width, so the width guard keeps the observer from feeding back into
    // itself; rAF-coalescing keeps a live window drag to one measure per frame
    // at most.
    const observer = new ResizeObserver(() => {
      const wrap = wrapRef.current;
      if (!wrap || wrap.clientWidth === lastWidth) return;
      scheduleCompute();
    });
    if (wrapRef.current) observer.observe(wrapRef.current);

    // A late web-font swap changes wrap points and would leave a stale cut.
    document.fonts?.ready?.then(() => {
      if (!canceled) scheduleCompute();
    });

    return () => {
      canceled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [summary]);

  return (
    <div ref={wrapRef} className={s.summaryWrap}>
      {state.phase === 'truncated' ? (
        <p className={clsx(s.summary, s.summaryTruncated)}>
          {state.display}
          {'… '}
          <button
            type="button"
            className={s.showMore}
            aria-label={`Show more: ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onShowMore();
            }}
          >
            <span>Show more</span>
          </button>
        </p>
      ) : (
        <p className={clsx(s.summary, state.phase === 'measuring' && s.summaryCompact)}>{summary}</p>
      )}
      <div ref={gaugeRef} className={s.summaryMeasure} aria-hidden="true" />
    </div>
  );
};

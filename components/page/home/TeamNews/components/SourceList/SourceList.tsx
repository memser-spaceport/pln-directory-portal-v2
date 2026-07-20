'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { getNewsSources } from '../../utils/getNewsSources';
import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import s from './SourceList.module.scss';

interface SourceListProps {
  item: ITeamNewsItem;
  position?: number;
  analyticsSource?: TeamNewsAnalyticsSource;
  compact?: boolean;
}

/**
 * The source segment of a story's meta line. One outlet → the plain domain
 * span, unchanged from before `sources[]` existed. Several outlets covering
 * the same story → a compact "N sources" pill whose popover lists each outlet
 * as its own link, so an aggregated story reads as one card, not N.
 *
 * The pill is a disclosure button: its click-toggled state is what
 * `aria-expanded` reports (Escape closes and refocuses it; clicking outside or
 * choosing a source closes it). On hover-capable devices CSS also previews the
 * popover on hover — a preview, deliberately not mirrored into `aria-expanded`
 * and not emitting the expand analytics event.
 *
 * The popover opens upward: the meta line sits at the card's bottom edge, and
 * cards live in scrollable columns where a downward popover would be clipped.
 */
export const SourceList = ({ item, position = 0, analyticsSource = 'home', compact = false }: SourceListProps) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const { onTeamNewsSourcesExpanded, onTeamNewsSourceLinkClicked } = useTeamNewsAnalytics();

  const sources = getNewsSources(item);
  const isMulti = sources.length > 1;

  // Close a pinned-open popover when a press lands outside the pill + panel.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  if (!isMulti) {
    const domain = sources[0]?.domain ?? item.sourceDomain;
    if (!domain) return null;
    return <span className={newsCardStyles.source}>{domain}</span>;
  }

  const handleToggle = () => {
    const next = !open;
    if (next) onTeamNewsSourcesExpanded(item, position, analyticsSource);
    setOpen(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // The whole card/row is role="link" with its own key handler — no key
    // pressed inside the source segment may bubble up and open the article.
    e.stopPropagation();
    if (e.key === 'Escape' && open) {
      setOpen(false);
      pillRef.current?.focus();
    }
  };

  return (
    // Clicks anywhere in the segment (pill, panel padding, header) must not
    // reach the card's onClick — hence stopPropagation on the wrapper.
    <span
      ref={wrapperRef}
      className={clsx(s.wrapper, compact && s.compact)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      <button ref={pillRef} type="button" className={s.pill} aria-expanded={open} onClick={handleToggle}>
        {sources.length} sources
        <svg className={s.caret} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Always in the DOM (CSS-hidden) so the hover preview needs no JS; the
          shell's padding doubles as the hover bridge across the 6px gap. */}
      <span className={clsx(s.popover, open && s.popoverOpen)}>
        <span className={s.panel}>
          <span className={s.panelHead}>Sources</span>
          {sources.map((src, index) => (
            <a
              // Same outlet can cover a story twice (two URLs, one domain), so
              // never key by domain alone.
              key={`${src.url}-${index}`}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className={s.row}
              onClick={(e) => {
                e.stopPropagation();
                onTeamNewsSourceLinkClicked(item, position, src, analyticsSource);
                setOpen(false);
              }}
            >
              {src.domain}
            </a>
          ))}
        </span>
      </span>
    </span>
  );
};

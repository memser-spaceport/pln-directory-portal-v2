'use client';

import clsx from 'clsx';
import { useState } from 'react';

import local from './NewsfeedV0.module.scss';
import type { NewsSource } from './mocks';

interface SourceListProps {
  /** Multi-source list for this story, if the same news ran in several outlets. */
  sources?: NewsSource[];
  /** Fallback single domain (the item's own `sourceDomain`) when there's no aggregation. */
  fallbackDomain: string | null;
}

const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

/**
 * The source segment of a story's meta line. One outlet → the plain domain,
 * unchanged. Several outlets covering the same story → a compact "N sources"
 * pill that opens the full list inline (no logo stack). So an aggregated story
 * reads as one item, not N cards.
 */
export function SourceList({ sources, fallbackDomain }: SourceListProps) {
  const [expanded, setExpanded] = useState(false);

  // No aggregation: render the single domain as a quiet link-on-hover, unchanged.
  if (!sources || sources.length <= 1) {
    const domain = sources?.[0]?.domain ?? fallbackDomain;
    if (!domain) return null;
    return <span className={local.sourceDomain}>{domain}</span>;
  }

  // Desktop reveals the list on hover / keyboard focus (CSS); the click toggle
  // is the touch fallback, where there's no hover. The popover is always in the
  // DOM so CSS can drive its visibility.
  return (
    <span className={local.sourceMulti}>
      <button
        type="button"
        className={local.sourcePill}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        {sources.length} sources
        <svg className={local.sourcePillCaret} viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <span className={clsx(local.sourcePopover, expanded && local.sourcePopoverOpen)} role="list">
        <span className={local.sourcePopoverHead}>Sources</span>
        {sources.map((src) => (
          <button
            key={src.domain}
            type="button"
            role="listitem"
            className={clsx(local.sourceLink, local.sourcePopoverRow)}
            onClick={() => open(src.url)}
          >
            {src.domain}
          </button>
        ))}
      </span>
    </span>
  );
}

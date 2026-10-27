'use client';

import { useState } from 'react';

// Production's site-wide announcement bar (the Demo Day banner's slot in SiteHeader).
import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';
import { CloseIcon } from '@/components/icons';

import s from './McpSectionMock.module.scss';

/**
 * The launch announcement, shown on every page until the member opens MCP
 * connections or closes it. Laid out like Mobbin's top bars (Wellfound,
 * Equals, Visual Electric): centred, a New pill, one line, a small pill CTA.
 */
export function LaunchBanner({ onSetUp }: { onSetUp: () => void }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    <HighlightsBar>
      <div className={s.launch}>
        <div className={s.launchMain}>
          <span className={s.launchNew}>New</span>
          <span className={s.launchText}>Connect Claude, Codex or any AI agent to LabOS</span>
          <button type="button" className={s.launchCta} onClick={onSetUp}>
            Set it up
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2.5 6h7M6.5 3l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <button type="button" className={s.launchClose} aria-label="Close" onClick={() => setClosed(true)}>
          <CloseIcon />
        </button>
      </div>
    </HighlightsBar>
  );
}

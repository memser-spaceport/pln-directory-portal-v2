'use client';

import { useState } from 'react';

// Production's site-wide announcement bar (the Demo Day banner's slot in SiteHeader).
import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';
import { CloseIcon } from '@/components/icons';

import { BackendTag } from './shared';

import s from './McpSectionMock.module.scss';

/**
 * The launch announcement, shown on every page until the member opens MCP
 * connections or closes it. Audience first: PL infra, admins and portfolio
 * team members (Anuj, 2026-10-27); the copy leads with what you can do. Laid out like Mobbin's top bars (Wellfound,
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
          <span className={s.launchText}>
            Search teams and members, post news or reply in the forum right from your AI session. LabOS now works with
            AI agents.
          </span>
          <button type="button" className={s.launchCta} onClick={onSetUp}>
            Set up now
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
        <BackendTag>Shown to PL infra, admins and portfolio teams first</BackendTag>
        <button type="button" className={s.launchClose} aria-label="Close" onClick={() => setClosed(true)}>
          <CloseIcon />
        </button>
      </div>
    </HighlightsBar>
  );
}

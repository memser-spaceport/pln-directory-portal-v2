'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';

import { ClientLogo } from './ClientLogo';
import { BackendTag } from './shared';
import s from './DiscoveryMock.module.scss';

/** Mock search results; names are invented. */
const RESULTS = [
  { name: 'Maya Chen', meta: 'Arcadia Compute · Prover engineer' },
  { name: 'Jordan Lee', meta: 'Brightline Labs · Research lead' },
  { name: 'Northwind Storage', meta: 'Team · Proof aggregation, storage' },
];

/**
 * In-product discovery (MCP strategy decision, 2026-10-23): members learn that
 * MCP exists from a contextual suggestion where an agent would help, here in
 * member search. The copy is a placeholder until Horizon gives the context for
 * the member-facing discovery. The same pattern fits the forum and comment flows.
 */
export function DiscoveryMock({ onSetUp }: { onSetUp: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className={s.root}>
      <div className={s.searchBar}>
        <span className={s.query}>zero-knowledge proofs</span>
        <span className={s.meta}>Search · 3 results</span>
      </div>

      {!dismissed && (
        <aside className={s.suggestion} aria-label="Use an AI agent for this search">
          <span className={s.logos} aria-hidden>
            <ClientLogo client="claude-code" size={18} />
            <ClientLogo client="codex" size={18} />
          </span>
          <div className={s.text}>
            <div className={s.labelRow}>
              <span className={s.title}>Search LabOS from your AI agent</span>
              <BackendTag>Placeholder copy: Horizon</BackendTag>
            </div>
            <p className={s.help}>
              Connect Claude, Codex or another MCP client. Ask it to find people like these, read the forum or catch up
              on the news feed for you.
            </p>
          </div>
          <div className={s.actions}>
            <Button size="s" variant="primary" className={s.btn} onClick={onSetUp}>
              Set up in Settings
            </Button>
            <button type="button" className={s.iconBtn} aria-label="Dismiss" onClick={() => setDismissed(true)}>
              <CloseIcon />
            </button>
          </div>
        </aside>
      )}

      <ul className={s.results}>
        {RESULTS.map((r) => (
          <li key={r.name} className={s.result}>
            <span className={s.avatar} aria-hidden>
              {r.name.charAt(0)}
            </span>
            <span className={s.resultText}>
              <span className={s.name}>{r.name}</span>
              <span className={s.meta}>{r.meta}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

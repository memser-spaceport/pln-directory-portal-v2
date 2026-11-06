'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';

import { AGENT_REPLIES, type AgentAction } from './mocks';
import s from './DesignHomepageRefactorOpenPrototype.module.scss';

/**
 * Concept only (Polina, 2026-10-28): a LabOS agent in the navigation, "like
 * Linear's", that can search, book office hours and draft posts. A launcher at
 * the lower right opens a side panel with the three jobs. Every answer is
 * canned. Booking is an outward action, so it asks for a confirm first; the
 * draft opens nothing and posts nothing.
 */
export function AgentPanel() {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<AgentAction | null>(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const choose = (a: AgentAction) => {
    setAction(a);
    setBooked(false);
  };

  return (
    <>
      {!open && (
        <button type="button" className={s.agentLauncher} onClick={() => setOpen(true)}>
          <AiSearchIcon size={18} />
          Agent
        </button>
      )}

      {open && (
        <aside className={s.agentPanel} aria-label="LabOS agent (concept)">
          <div className={s.agentHead}>
            <div>
              <p className={s.agentTitle}>LabOS agent</p>
              <p className={s.agentSub}>Concept. It does work for you in the network.</p>
            </div>
            <button type="button" className={s.agentClose} aria-label="Close" onClick={() => setOpen(false)}>
              <CloseIcon />
            </button>
          </div>

          <div className={s.agentActions}>
            {(Object.keys(AGENT_REPLIES) as AgentAction[]).map((a) => (
              <button
                key={a}
                type="button"
                className={clsx(s.agentAction, action === a && s.agentActionActive)}
                onClick={() => choose(a)}
              >
                {AGENT_REPLIES[a].title}
              </button>
            ))}
          </div>

          {action && (
            <div className={s.agentReply} aria-live="polite">
              <p>{AGENT_REPLIES[action].reply}</p>
              {action === 'office' &&
                (booked ? (
                  <p className={s.agentDone}>Booked. Mara gets an email (mock).</p>
                ) : (
                  <div className={s.agentButtons}>
                    <Button size="s" onClick={() => setBooked(true)}>
                      Confirm booking
                    </Button>
                    <Button size="s" style="border" variant="secondary" onClick={() => setAction(null)}>
                      Not now
                    </Button>
                  </div>
                ))}
              {action === 'draft' && (
                <div className={s.agentButtons}>
                  <Button size="s" style="border" variant="secondary" onClick={() => setAction(null)}>
                    Edit in forum
                  </Button>
                </div>
              )}
              {action === 'search' && (
                <Link
                  className={s.seeAll}
                  href="/prototypes/ai-mode-results?q=Find%20teams%20building%20on%20Filecoin%20in%20Berlin"
                >
                  Open in AI Search
                </Link>
              )}
            </div>
          )}
        </aside>
      )}
    </>
  );
}

'use client';

// The Email & Accounts section frame, the same one the Email card uses.
import tabCss from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';

import { SPIKE_TABLE_URL } from './mocks';
import { BackendTag } from './shared';
import s from './McpSectionMock.module.scss';

/**
 * Answers the ticket's open question ("does the page list which features MCP
 * covers?") from the LAB-2944 spike table, in the table's own split: read,
 * edit, outward (waits for the confirm of LAB-2903), and "should not be covered".
 * "Today" is what the MCP server's 26 tools cover; "Proposed" is the spike's
 * P0/P1 list, not a decision yet.
 */
const ROWS: { level: string; when: string; today?: string; next?: string }[] = [
  {
    level: 'Read',
    when: 'Read-only and Make changes',
    today:
      'Members, teams, projects, events, forum threads, the PL portfolio, investors and warm intros, feedback on your AI Apps.',
    next: 'Jobs, the news feed, notifications.',
  },
  {
    level: 'Change',
    when: 'Make changes only',
    today: 'Warm-intro notes and feedback, investor field locks, the status of feedback on your AI Apps.',
    next: 'Your own profile, saved jobs and job alerts, event RSVPs.',
  },
  {
    level: 'Send to others',
    when: 'Make changes, and your confirm each time',
    next: 'Forum posts and replies, team news, job applications.',
  },
  {
    level: 'Stays with you',
    when: 'No agent',
    today: 'Sign-in, file uploads, legal consent, keys, and connecting agents.',
  },
];

export function AgentCapabilities() {
  return (
    <div className={tabCss.card}>
      <div className={tabCss.cardHeader}>What agents can do in LabOS</div>
      <div className={tabCss.cardContent}>
        <dl className={s.capList}>
          {ROWS.map((row) => (
            <div key={row.level} className={s.capRow}>
              <dt className={s.capLevel}>
                <span className={s.label}>{row.level}</span>
                <span className={s.meta}>{row.when}</span>
              </dt>
              <dd className={s.capText}>
                {row.today && <span>{row.today}</span>}
                {row.next && (
                  <span className={s.capNext}>
                    <span className={s.capNextLabel}>{row.today ? 'Proposed next:' : 'Proposed:'}</span> {row.next}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className={s.capFoot}>
          <a href={SPIKE_TABLE_URL} target="_blank" rel="noreferrer" className={s.textLink}>
            See all 231 actions
          </a>
          <BackendTag>Proposed in LAB-2944</BackendTag>
        </div>
      </div>
    </div>
  );
}

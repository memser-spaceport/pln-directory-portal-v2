'use client';

import clsx from 'clsx';

import type { IMember } from '@/types/members.types';

import MemberGridView from '@/components/page/members/member-grid-view';

// Production members page shell and grid, so the page tracks production.
import shell from '@/app/members/(members-page)/@content/page.module.scss';
import grid from '@/components/page/members/MemberInfiniteList/MemberInfiniteList.module.scss';
// The members prototype's toolbar (title, count, search field).
import bar from '../members/MembersPrototype.module.scss';

import { searchMembers, showsInviteCta } from './invite';
import { MOCK_DIRECTORY } from './mocks';
import s from './InvitePrototype.module.scss';

/**
 * The /members list with its search, mocked. Production renders
 * `EmptyResult` (components/core/empty-result.tsx) when a search finds
 * nobody; that copy is kept word for word here (the component itself is
 * copied, not imported, because it uses the login redirect and analytics).
 *
 * The one delta is Polina's line under it: "Can’t find them? They may not be
 * on LabOS yet. Invite them." It shows only when a search ran and found
 * nobody. Populated results get no CTA (test 1: no problem to solve there).
 */
export function MembersSearch({
  query,
  onQueryChange,
  onInvite,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onInvite: () => void;
}) {
  const results = searchMembers(MOCK_DIRECTORY, query);
  const invite = showsInviteCta(query, results);

  return (
    <div className={clsx(shell.members, s.membersPage)}>
      <div className={shell.members__right}>
        <div className={shell.members__right__content}>
          <div className={shell.members__right__toolbar}>
            <div className={s.membersToolbar}>
              <div className={bar.title}>
                <span className={bar.titleText}>Members</span>
                <span className={bar.titleCount}>({results.length})</span>
              </div>
              <div className={clsx(bar.search, s.membersSearch)}>
                <SearchIcon />
                <input
                  className={bar.searchInput}
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Search by Member Name, Team, or Project"
                  aria-label="Search members"
                />
              </div>
            </div>
          </div>

          <div className={shell.members__right__membersList} style={{ flex: 1 }}>
            {results.length === 0 ? (
              <div className={s.notFound} data-testid="members-empty">
                <p className={s.notFoundText}>
                  There are no results for your criteria. You can try to define different criteria or{' '}
                  <button type="button" className={s.inlineLink} onClick={() => onQueryChange('')}>
                    clear all the criteria.
                  </button>
                </p>
                {invite && (
                  <p className={s.notFoundText} data-testid="members-invite-cta">
                    Can’t find them? They may not be on LabOS yet.{' '}
                    <button type="button" className={s.inlineLink} onClick={onInvite}>
                      Invite them.
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <div className={grid.grid}>
                {results.map((member) => (
                  <div key={member.id} className={grid.member}>
                    <MemberGridView isUserLoggedIn member={member as unknown as IMember} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
      stroke="#94a3b8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

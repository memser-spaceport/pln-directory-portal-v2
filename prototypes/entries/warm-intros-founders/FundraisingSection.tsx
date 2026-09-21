'use client';

/**
 * "Fundraising" — the founder's door to warm intros, on THEIR team page.
 *
 * Follows the Open roles section's rules (`../team-profile/TeamOpenRolesView`):
 *  - Owner-only. A raise is not public; visitors see no section at all.
 *  - The owner sees it in both states — an empty state that holds an
 *    invitation goes to the people the invitation is for.
 *  - Two rows as a sample, then "View all N" — but unlike roles (2–8) a
 *    shortlist runs to ~20, so the rest opens as a page in the profile's
 *    place (the applicants-page move), not an in-place expander.
 *
 * No intake form. Stage and sectors are the team profile's existing fields,
 * so the section says what it matched on instead of asking again.
 *
 * Header: deliberately NOT production's `DetailsSectionHeader` (grey 14/500
 * title + link action). Per the design mock this section leads the owner's
 * page while a raise runs, so it wears a primary-ink title, a count chip and a
 * tinted asks pill. The section card itself is still `DetailsSection`.
 */

import {
  DetailsSection,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
import { HeaderActionBtn } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader/components/HeaderActionBtn';

import { InvestorPathRow, InvestorTableHead } from './InvestorPathRow';
import { investorProfileHref, type FounderInvestorRow, type IntroAsk } from './mocks';
import s from './WarmIntrosFounders.module.scss';

const ROWS_SHOWN = 2;

interface Props {
  raising: boolean;
  onStart: () => void;
  /** Stage + industry tags, already joined with " · " by the host. */
  matchedOn: string;
  rows: FounderInvestorRow[];
  askFor: (uid: string) => IntroAsk | undefined;
  openAsks: number;
  onAsk: (row: FounderInvestorRow) => void;
  onAskAlternate: (row: FounderInvestorRow) => void;
  onOpenPage: (tab: 'Investors' | 'Your asks') => void;
}

export function FundraisingSection({
  raising,
  onStart,
  matchedOn,
  rows,
  askFor,
  openAsks,
  onAsk,
  onAskAlternate,
  onOpenPage,
}: Props) {
  if (!raising) {
    return (
      <DetailsSection>
        <div className={s.head}>
          <h2 className={s.title}>Fundraising</h2>
          <HeaderActionBtn onClick={onStart}>Find investors</HeaderActionBtn>
        </div>
        <DetailsSectionGreyContentContainer>
          <NoDataBlock>Raising a round? See which investors the PL network can introduce you to.</NoDataBlock>
        </DetailsSectionGreyContentContainer>
      </DetailsSection>
    );
  }

  const tags = matchedOn.split(' · ');

  return (
    <DetailsSection>
      <div className={s.head}>
        <div className={s.headTitle}>
          <h2 className={s.title}>Fundraising</h2>
          <span className={s.count}>
            {rows.length} {rows.length === 1 ? 'investor' : 'investors'}
          </span>
        </div>
        {openAsks > 0 && (
          <button type="button" className={s.asksPill} onClick={() => onOpenPage('Your asks')}>
            <span className={s.asksDot} aria-hidden />
            {openAsks} {openAsks === 1 ? 'ask' : 'asks'} in progress
          </button>
        )}
      </div>

      {/* The claim in label grey, what it matched on in primary ink: the tags
          are the part the founder can check against the card above. */}
      <p className={s.matched}>
        Warm paths through the PL network, matched on{' '}
        {tags.map((tag, i) => (
          <span key={tag} className={s.matchedTag}>
            {i > 0 && (
              <span className={s.sep} aria-hidden>
                ·
              </span>
            )}
            {tag}
          </span>
        ))}
      </p>

      <div className={s.table}>
        <InvestorTableHead />
        {rows.slice(0, ROWS_SHOWN).map((row) => (
          <InvestorPathRow
            key={row.uid}
            row={row}
            ask={askFor(row.uid)}
            href={investorProfileHref(row.uid)}
            onAsk={() => onAsk(row)}
            onAskAlternate={() => onAskAlternate(row)}
          />
        ))}
        {rows.length > ROWS_SHOWN && (
          <button type="button" className={s.viewAll} onClick={() => onOpenPage('Investors')}>
            View all {rows.length} investors <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </DetailsSection>
  );
}

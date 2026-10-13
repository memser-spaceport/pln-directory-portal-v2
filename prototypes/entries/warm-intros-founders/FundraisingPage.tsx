'use client';

/**
 * The whole shortlist + the founder's asks, in the team profile's place — the
 * candidates-page move (`../team-profile/TeamCandidatesPage`): one press from
 * the section, Back returns to the profile as it was. Page chrome (width, back
 * button, title scale) is that page's own stylesheet.
 *
 * Two tabs, because they are two questions: "who could I be introduced to?"
 * and "where are the intros I asked for?". An asked investor stays in the
 * first list with its status in the action slot, so the list never reshuffles
 * under the founder's pointer.
 */

import clsx from 'clsx';

import { Tabs } from '@/components/ui/tabs/Tabs';
import { CaretLeftIcon } from '@/components/icons/CaretLeftIcon';
import back from '@/components/ui/BackButton/BackButton.module.scss';
import page from '../team-profile/TeamCandidatesPage.module.scss';

import { InvestorPathRow, InvestorTableHead } from './InvestorPathRow';
import { investorProfileHref, type FounderInvestorRow, type IntroAsk } from './mocks';
import s from './WarmIntrosFounders.module.scss';

export type FundraisingTab = 'Investors' | 'Your asks';

interface Props {
  teamName: string;
  matchedOn: string;
  rows: FounderInvestorRow[];
  asks: IntroAsk[];
  tab: FundraisingTab;
  onTab: (tab: FundraisingTab) => void;
  onAsk: (row: FounderInvestorRow) => void;
  onAskAlternate: (row: FounderInvestorRow) => void;
  onMarkMet: (investorUid: string) => void;
  onBack: () => void;
}

export function FundraisingPage({
  teamName,
  matchedOn,
  rows,
  asks,
  tab,
  onTab,
  onAsk,
  onAskAlternate,
  onMarkMet,
  onBack,
}: Props) {
  const askFor = (uid: string) => asks.find((a) => a.investorUid === uid);
  const asked = rows.filter((row) => askFor(row.uid));
  const visible = tab === 'Investors' ? rows : asked;

  return (
    <div className={page.page}>
      <button type="button" className={clsx(back.backBtn, page.back)} onClick={onBack}>
        <CaretLeftIcon />
        Back to {teamName}
      </button>

      <header className={page.head}>
        <h1 className={page.title}>Fundraising</h1>
        <p className={page.subtitle}>Matched on {matchedOn}</p>
      </header>

      <div className={s.card}>
        <div className={s.tabs}>
          <Tabs
            variant="secondary"
            tabs={[
              { name: 'Investors', count: rows.length },
              { name: 'Your asks', count: asked.length },
            ]}
            activeTab={tab}
            onTabClick={(name) => onTab(name as FundraisingTab)}
          />
        </div>

        {visible.length ? (
          <div className={s.table}>
            <InvestorTableHead />
            {visible.map((row) => (
              <InvestorPathRow
                key={row.uid}
                row={row}
                ask={askFor(row.uid)}
                href={investorProfileHref(row.uid)}
                onAsk={() => onAsk(row)}
                onAskAlternate={() => onAskAlternate(row)}
                onMarkMet={() => onMarkMet(row.uid)}
              />
            ))}
          </div>
        ) : (
          <p className={s.empty}>No asks yet. Ask for an intro from the Investors tab.</p>
        )}
      </div>
    </div>
  );
}

'use client';

/**
 * Warm intros for founders — the PL investor graph, read from a founder's seat.
 *
 * ── Reuse map ───────────────────────────────────────────────────────────────
 * Imported from production (never copied):
 *   page shell            @/app/teams/[id]/page.module.css
 *   section chrome        @/components/common/profile/DetailsSection (+ HeaderActionBtn, NoDataBlock)
 *   person chip           …/investors/WarmIntrosV2Workspace/PathProfileChip.module.scss
 *   modal shell           @/components/common/Modal + …/deals/SubmitDealModal/SubmitDealModal.module.scss
 *   textarea visuals      @/components/form/FormTextArea/FormTextArea.module.scss
 *   Button / Tabs / Back  @/components/common/Button, @/components/ui/tabs/Tabs, BackButton.module.scss
 * Imported from sibling prototypes:
 *   team page pieces      ../team-profile (TeamDetailsView, TeamContactView, TeamMembersView,
 *                         TeamProjectsView, layout + demo-bar classes, mocks)
 *   sub-page chrome       ../team-profile/TeamApplicantsPage.module.scss (page / back / head / title)
 *   investors, connectors,
 *   PL-history facts      ../warm-intros-v2/mocks (MOCK_PATHS, bridgeOf, plHistoryOf, relationKindOf)
 * New here (token/fallback pairs only): InvestorPathRow, FundraisingSection,
 *   FundraisingPage, AskIntroModal, ConnectorRequestView, InvestorProfilePage.
 *
 * ── Three doors, one ask ────────────────────────────────────────────────────
 * "Ask for intro" also stands on an investor's own profile (`?investor=<uid>`,
 * reached from a row's name or from AI Search) and inside AI Search answers
 * (`../ai-search`, founder seat). All three go through `useAskIntro` — one
 * modal, one sessionStorage-backed list — so one ask per investor holds across
 * them. The label stays "Ask for intro" everywhere: the founder asks, the
 * connector makes it.
 *
 * ── What is deliberately NOT carried over from Warm Intros v2 ───────────────
 * Score %, caliber, proximity codes, target lists, CSV export, the investor's
 * email, and the list of alternate connectors. Those serve "who should PL
 * approach?"; the founder's question is "who do I ask?", and it gets one named
 * person per row. (One alternate surfaces, and only after a decline — as the
 * declined row's next action, "Ask <name> instead".)
 *
 * The v2 reason line never reaches the founder either. It is written from PL's
 * seat ("Callum passed but stayed in touch", "two live email threads", "model-
 * inferred only"). The founder reads a tie from a closed vocabulary
 * (`TIE_LABEL` in mocks); the connector, whose relationship it is, reads the
 * full line on their own screen.
 *
 * ── Open, on purpose ────────────────────────────────────────────────────────
 *  - Connector fatigue: no per-person cap on open asks yet.
 *  - Round size is a constant (`ROUND`); the team profile has no field for it.
 *  - Where the connector's screen lives in production (email / notifications).
 */

import { useEffect, useState } from 'react';

import shell from '@/app/teams/[id]/page.module.css';
import { BackButton } from '@/components/ui/BackButton';

import { TeamDetailsView } from '../team-profile/TeamDetailsView';
import { TeamContactView } from '../team-profile/TeamContactView';
import { TeamMembersView } from '../team-profile/TeamMembersView';
import { TeamProjectsView } from '../team-profile/TeamProjectsView';
import { MOCK_MEMBERS, MOCK_PROJECTS } from '../team-profile/mocks';
import local from '../team-profile/TeamProfile.module.scss';

import { ConnectorRequestView } from './ConnectorRequestView';
import { FundraisingPage, type FundraisingTab } from './FundraisingPage';
import { FundraisingSection } from './FundraisingSection';
import { InvestorProfilePage } from './InvestorProfilePage';
import { useAskIntro } from './useAskIntro';
import {
  FOUNDER_TEAM,
  FOUNDER_TEAM_FACTS,
  ROUND,
  SHORTLIST,
  INVESTOR_ROWS,
  investorByUid,
  type FounderInvestorRow,
  type IntroAsk,
} from './mocks';

/** `member` is a signed-in member who isn't a founder: no fundraising anywhere. */
type Seat = 'founder' | 'connector' | 'member' | 'public';

const SELF_HREF = '/prototypes/warm-intros-founders';

export default function WarmIntrosFoundersPrototype() {
  // Reused leaf components are client-only (base-ui tooltips, tag popovers) —
  // gate on mount so SSR === first client render, as team-profile does.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [seat, setSeat] = useState<Seat>('founder');
  const [raising, setRaising] = useState(true);
  const { asks, askFor, setStatus, ask, modal } = useAskIntro();
  const [pageTab, setPageTab] = useState<FundraisingTab | null>(null);
  // `?investor=<uid>` opens that investor's profile in the page's place — a
  // real address, because AI Search answers and the rows' names link to it.
  const [investorUid, setInvestorUid] = useState<string | null>(null);
  useEffect(() => setInvestorUid(new URLSearchParams(window.location.search).get('investor')), []);

  if (!mounted) return <div className={shell.teamDetail} />;

  const team = FOUNDER_TEAM;
  const matchedOn = [team.fundingStage?.title ?? ROUND.label, ...(team.industryTags ?? []).map((t) => t.title)].join(
    ' · ',
  );

  const openAsks = asks.filter((a) => a.status === 'requested' || a.status === 'made').length;

  const askVia = (row: FounderInvestorRow) => ask(row);
  const askAlternate = (row: FounderInvestorRow) => row.alternate && ask(row, row.alternate.connector);

  // Any investor with a path can be asked now (a profile, a search answer), so
  // the connector's queue reads every row, not only the team's shortlist.
  const requests = asks
    .filter((a) => a.status === 'requested')
    .flatMap((request: IntroAsk) => {
      const row = INVESTOR_ROWS.find((r) => r.uid === request.investorUid);
      return row ? [{ ask: request, row }] : [];
    });

  const investor = investorByUid(investorUid);

  const demoSwitch = <T extends string>(label: string, value: T, options: Array<[T, string]>, set: (v: T) => void) => (
    <div className={local.demoGroup}>
      <span className={local.demoLabel}>{label}</span>
      <div className={local.demoSwitch}>
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            className={`${local.demoBtn} ${value === key ? local.demoBtnActive : ''}`}
            onClick={() => set(key)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={local.page}>
      <div className={local.demoBar}>
        {demoSwitch<Seat>(
          'View',
          seat,
          [
            ['founder', 'Founder'],
            ['connector', 'Connector'],
            ['member', 'Member'],
            ['public', 'Public'],
          ],
          (next) => {
            setSeat(next);
            setPageTab(null);
          },
        )}
        {seat === 'founder' &&
          demoSwitch<'yes' | 'no'>(
            'Raise',
            raising ? 'yes' : 'no',
            [
              ['yes', 'Raising'],
              ['no', 'Not raising'],
            ],
            (next) => setRaising(next === 'yes'),
          )}
      </div>

      {seat === 'connector' ? (
        <ConnectorRequestView requests={requests} onDecide={setStatus} />
      ) : investor ? (
        <InvestorProfilePage
          row={investor}
          canAskIntro={seat === 'founder'}
          ask={askFor(investor.uid)}
          onAsk={() => askVia(investor)}
          onAskAlternate={() => askAlternate(investor)}
          onMarkMet={() => setStatus(investor.uid, 'met')}
          backTo={SELF_HREF}
        />
      ) : seat === 'founder' && pageTab ? (
        <FundraisingPage
          teamName={team.name ?? 'the team'}
          matchedOn={matchedOn}
          rows={SHORTLIST}
          asks={asks}
          tab={pageTab}
          onTab={setPageTab}
          onAsk={askVia}
          onAskAlternate={askAlternate}
          onMarkMet={(uid) => setStatus(uid, 'met')}
          onBack={() => setPageTab(null)}
        />
      ) : (
        <div className={local.layout}>
          <div className={`${shell.teamDetail} ${local.mainCol}`}>
            <BackButton to="/prototypes/teams" />
            <div className={shell.teamDetail__container}>
              <div className={shell.teamDetail__Container__details}>
                <TeamDetailsView team={team} facts={FOUNDER_TEAM_FACTS} demoDayPlacement="none" />
              </div>

              {/* Directly under the header card: a raise is perishable and, while
                  it runs, it is the reason the founder opened their page. Owner
                  only — a visitor's page has no trace of it. */}
              {seat === 'founder' && (
                <FundraisingSection
                  raising={raising}
                  onStart={() => setRaising(true)}
                  matchedOn={matchedOn}
                  rows={SHORTLIST}
                  askFor={askFor}
                  openAsks={openAsks}
                  onAsk={askVia}
                  onAskAlternate={askAlternate}
                  onOpenPage={setPageTab}
                />
              )}

              <div className={shell.teamDetail__container__contact}>
                <TeamContactView team={team} />
              </div>

              <div className={shell.teamDetail__container__member}>
                <TeamMembersView team={team} members={MOCK_MEMBERS} />
              </div>

              <TeamProjectsView team={team} projects={MOCK_PROJECTS} />
            </div>
          </div>
        </div>
      )}

      {modal}
    </div>
  );
}

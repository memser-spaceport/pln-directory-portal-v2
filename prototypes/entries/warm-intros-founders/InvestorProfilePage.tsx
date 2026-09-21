'use client';

/**
 * An investor's member profile, as a founder meets it — and the second door to
 * "Ask for intro".
 *
 * Copy-simplify of production's `/members/[id]` for an investor-only member:
 * the header card (ProfileDetails + MemberDetailHeader classes) and the
 * Investor Details card (`InvestorProfileView`'s markup and stylesheet, with
 * the pure `InvestmentDetailsSection` imported). The view itself is not
 * imported: its prompt banner pulls a react-query mutation.
 *
 * ── Where the door goes ─────────────────────────────────────────────────────
 * Inside Investor Details, as a block of its own under the investments. That
 * card already owns "this person invests", which is the only reason a founder
 * wants the intro; a header button would put a fundraising action beside
 * Follow/office-hours on a page most readers open for other reasons.
 *
 * Founder-only, and only when the graph holds a path: a member who isn't a
 * founder, the investor themself, or a founder with no one in between sees the
 * card exactly as production draws it. Absent, not disabled — a locked door
 * with nobody who can open it is noise. The pill says the one thing the block
 * cannot show: the investor doesn't see this on their own page.
 *
 * The offer is `IntroViaLine` — the Fundraising row minus the cells that would
 * repeat this page — with the row's own action cluster, reading the same asks — so an investor asked from the team
 * page or from AI Search is already "Requested" here.
 */

import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { InvestmentDetailsSection } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/InvestmentDetailsSection';
import { BackButton } from '@/components/ui/BackButton';
import page from '@/app/members/[id]/page.module.scss';
import h from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
import profile from '@/components/page/member-details/ProfileDetails/ProfileDetails.module.scss';
import inv from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/InvestorProfileView.module.scss';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { PlTeamOnlyPill } from '../profile-shared/PlTeamOnlyPill';

import { IntroViaLine } from './IntroViaLine';
import { investorDetailsOf, type FounderInvestorRow, type IntroAsk } from './mocks';
import door from './IntroDoors.module.scss';

interface Props {
  row: FounderInvestorRow;
  /** Only a founder is offered the intro; everyone else gets production's card. */
  canAskIntro: boolean;
  ask?: IntroAsk;
  onAsk: () => void;
  onAskAlternate: () => void;
  onMarkMet: () => void;
  backTo: string;
}

export function InvestorProfilePage({ row, canAskIntro, ask, onAsk, onAskAlternate, onMarkMet, backTo }: Props) {
  const details = investorDetailsOf(row);

  return (
    <div className={page.memberDetail}>
      <div className={page.container}>
        <div className={page.content}>
          <BackButton to={backTo} />
          <div className={page.memberDetail__container}>
            <div className={profile.root}>
              <div className={h.header}>
                <div className={h.headerProfile}>
                  <img className={h.headerProfileImg} src={row.imageUrl ?? getDefaultAvatar(row.name)} alt={row.name} />
                </div>
                <div className={h.headerDetails}>
                  <div>
                    <div className={h.specificsHdr}>
                      <h1 className={h.specificsName}>{row.name}</h1>
                    </div>
                    <div className={h.roleAndLocation}>
                      {row.firm && (
                        <div className={h.teams}>
                          <p className={h.teamsName}>{row.firm}</p>
                        </div>
                      )}
                      {row.firm && row.title && <div className={h.divider} />}
                      {row.title && <p className={h.role}>{row.title}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DetailsSection>
              <div className={inv.root}>
                <DetailsSectionHeader title="Investor Details" />
                <div className={inv.content}>
                  <div className={inv.block}>
                    <div className={inv.blockTitle}>Direct Investments</div>
                    <InvestmentDetailsSection {...details} secRulesAccepted isEditable={false} />
                  </div>

                  {canAskIntro && (
                    <div className={inv.block}>
                      <div className={door.introHead}>
                        <div className={inv.blockTitle}>Warm intro</div>
                        <PlTeamOnlyPill />
                      </div>
                      <IntroViaLine
                        row={row}
                        ask={ask}
                        onAsk={onAsk}
                        onAskAlternate={onAskAlternate}
                        onMarkMet={onMarkMet}
                      />
                    </div>
                  )}
                </div>
              </div>
            </DetailsSection>
          </div>
        </div>
      </div>
    </div>
  );
}

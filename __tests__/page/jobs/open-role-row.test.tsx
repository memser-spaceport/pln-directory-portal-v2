import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

/**
 * The open-role signal (LAB-2439) — a team's standing invitation to people it
 * has no posting for.
 *
 * Two things are worth pinning here and they are different in kind.
 *
 * The first is the **Phase 1 boundary**: this ships for Protocol Labs and for
 * nobody else. That rule lives in `TeamGroupCard` rather than in each host, so
 * it is tested through the card. It is also the assertion most likely to rot —
 * a later pass that generalises the row will make the negative case fail, which
 * is exactly when someone should be made to think about it.
 *
 * The second is that the answered state is **terminal**. The signal has no
 * undo (the server has no DELETE), so the row must not offer a press that
 * cannot be honoured.
 */

jest.mock('@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags', () => ({
  useGetFocusTags: () => [],
}));

// The role rows drag in the refer modal, a member search and the analytics
// stack; none of it is what this card's open-role block does.
jest.mock('@/components/page/jobs/TeamGroupCard/component/ReferRoleRow', () => ({
  ReferRoleRow: () => <li data-testid="role-row" />,
}));

jest.mock('@/services/team-news/hooks/useTeamNewsCounts', () => ({
  useTeamNewsCount: () => undefined,
}));

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCountChipClicked: jest.fn(),
    onTeamNewsCountChipShown: jest.fn(),
  }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => null,
}));

import { TeamGroupCard } from '@/components/page/jobs/TeamGroupCard';
import {
  OPEN_ROLE_CTA_LABEL,
  OPEN_ROLE_QUESTION,
  OPEN_ROLE_SENT_LABEL,
  openRoleOffer,
  openRoleSent,
} from '@/components/page/jobs/TeamGroupCard/component/OpenRoleRow/OpenRoleRow';
import type { IJobRole, IJobTeam, IJobTeamGroup } from '@/types/jobs.types';

const PL_NAME = 'Protocol Labs';

const role: IJobRole = {
  uid: 'r1',
  roleTitle: 'Engineer',
  roleCategory: null,
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  // Old enough that isNew() is false, so the "+N new" badge stays out of the way.
  lastUpdated: '2020-01-01T00:00:00.000Z',
  postedDate: '2020-01-01T00:00:00.000Z',
  detectionDate: null,
};

const team = (over: Partial<IJobTeam> = {}): IJobTeam => ({
  uid: 'team-1',
  name: PL_NAME,
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
  ...over,
});

const groupFor = (over: Partial<IJobTeam> = {}): IJobTeamGroup => ({
  team: team(over),
  totalRoles: 1,
  roles: [role],
});

type OpenRoleProp = { onExpressInterest: (t: IJobTeam) => void; pendingTeamUid?: string | null };

const renderCard = (over: Partial<IJobTeam> = {}, openRole: OpenRoleProp = { onExpressInterest: jest.fn() }) =>
  render(<TeamGroupCard group={groupFor(over)} onRoleClick={jest.fn()} openRole={openRole} />);

/* Its own helper rather than `renderCard(…, undefined)`: a default parameter
   fires on an explicit `undefined` too, so that call would have quietly tested
   the wired card again — and passed. */
const renderCardWithoutSignal = (over: Partial<IJobTeam> = {}) =>
  render(<TeamGroupCard group={groupFor(over)} onRoleClick={jest.fn()} />);

const cta = () => screen.queryByRole('button', { name: `Tell ${PL_NAME} you're interested` });

describe('the open-role row', () => {
  it('asks the question and says what pressing does', () => {
    renderCard();

    expect(screen.getByText(OPEN_ROLE_QUESTION, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(openRoleOffer(PL_NAME))).toBeInTheDocument();
    expect(cta()).toBeEnabled();
    expect(cta()).toHaveTextContent(OPEN_ROLE_CTA_LABEL);
  });

  it('hands the team back on press', async () => {
    const onExpressInterest = jest.fn();
    renderCard({}, { onExpressInterest });

    await userEvent.click(cta()!);

    expect(onExpressInterest).toHaveBeenCalledTimes(1);
    expect(onExpressInterest.mock.calls[0][0]).toMatchObject({ uid: 'team-1', name: PL_NAME });
  });

  /* Terminal, not reversible. The server has no DELETE for this signal and the
     ATS files it on arrival, so the answered row reports rather than offers —
     the same treatment `Applied` gets, for a stronger version of the same
     reason. If an undo ever ships, this is the test that should stop you
     shipping only half of it. */
  it('reports the answered state with nothing left to press', () => {
    renderCard({ viewerIsInterestedInTeam: true });

    expect(screen.getByRole('button', { name: OPEN_ROLE_SENT_LABEL })).toBeDisabled();
    expect(cta()).not.toBeInTheDocument();
    expect(screen.getByText(openRoleSent(PL_NAME))).toBeInTheDocument();
    expect(screen.queryByText(openRoleOffer(PL_NAME))).not.toBeInTheDocument();
  });

  it('blocks a second press while one is in flight', () => {
    renderCard({}, { onExpressInterest: jest.fn(), pendingTeamUid: 'team-1' });

    expect(cta()).toBeDisabled();
  });

  it('leaves another team in flight alone', () => {
    renderCard({}, { onExpressInterest: jest.fn(), pendingTeamUid: 'someone-else' });

    expect(cta()).toBeEnabled();
  });
});

describe('who gets the row', () => {
  /* Phase 1 is Protocol Labs only — validate before any network-wide rollout
     (LAB-2439). The gate is `isProtocolLabsTeam` inside the card, so every host
     that wires the prop inherits it rather than each remembering the rule. */
  it('is withheld from every team but Protocol Labs', () => {
    renderCard({ name: 'Filecoin Foundation', uid: 'team-2' });

    expect(screen.queryByText(OPEN_ROLE_QUESTION, { exact: false })).not.toBeInTheDocument();
  });

  it('matches Protocol Labs by uid as well as by name', () => {
    // The uid the backend pins PL by; `isProtocolLabsTeam` accepts either half.
    renderCard({ uid: 'cldvnyxaf01ynu21k62uopjvg', name: 'PL' });

    expect(screen.getByText(OPEN_ROLE_QUESTION, { exact: false })).toBeInTheDocument();
  });

  /* Prop-absence is the gate, as it is for `apply`: a host that has not wired
     the signal gets the card it always had, with no dead row on it. */
  it('is withheld when the host wires no signal', () => {
    renderCardWithoutSignal();

    expect(screen.queryByText(OPEN_ROLE_QUESTION, { exact: false })).not.toBeInTheDocument();
    expect(cta()).not.toBeInTheDocument();
  });
});

describe('the copy', () => {
  /* The per-role interest banner promised a notification nothing sent (fixed in
     #3050). This one may promise outreach — the signal is pushed to the team's
     ATS and also read from a feed it polls — but the promise stays conditional,
     and neither state may suggest the signal can be taken back, because it
     cannot. */
  it('promises outreach conditionally and never implies an undo', () => {
    const both = `${openRoleOffer(PL_NAME)} ${openRoleSent(PL_NAME)}`.toLowerCase();

    expect(both).toContain('if a');
    expect(both).toContain('reach out');
    for (const forbidden of ['undo', 'cancel', 'withdraw', 'remove', 'any time', 'anytime']) {
      expect(both).not.toContain(forbidden);
    }
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The "I'm interested" banner — a light signal beside Apply, in the review step
 * between the job masthead and "About the role".
 *
 * Two halves to this file, and they test different things.
 *
 * The first renders the component directly and pins the **invariant that is
 * invisible in the DOM tree**: the action is ONE `<button>` across both states,
 * not two that replace each other. The design draws a 128x40 outlined button and
 * an underlined "Undo" link, which reads like two components — and the obvious
 * implementation, a ternary rendering two `<button>` elements, unmounts the
 * control the person just pressed and drops focus to `<body>` in the middle of a
 * thousand-pixel description. Nothing about the rendered output would look wrong.
 * The focus test below is the only thing standing between this component and
 * that regression.
 *
 * The second half renders the whole drawer with `JobDetailPane` stubbed to its
 * banner slot, because every rule about WHEN the banner appears lives in the
 * drawer, not in the banner: prop-absence is the feature flag, an existing
 * application suppresses it, and an unsettled query withholds it.
 */

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

jest.mock('@/components/form/FormSelect', () => ({ FormSelect: () => null }));

jest.mock('@/services/members/hooks/useMemberFormOptions', () => ({
  useMemberFormOptions: () => ({ data: { teams: [] } }),
}));

jest.mock('@/components/page/jobs/JobDetailPane/JobDetailPane', () => ({
  JobDetailPane: ({ banner }: { banner?: React.ReactNode }) => <>{banner}</>,
}));
jest.mock('@/components/page/jobs/JobApplicationPane/JobApplicationPane', () => ({
  JobApplicationPane: () => null,
  COVER_LETTER_MAX_LENGTH: 2000,
}));
jest.mock('@/components/page/jobs/JobProfileDrawer/JobProfileDrawer', () => ({
  JobProfilePane: () => null,
  BackIcon: () => null,
}));

jest.mock('@/services/jobs/hooks/useJobApplications', () => ({
  useSubmitJobApplication: () => ({ mutate: jest.fn(), isPending: false }),
  useRoleApplication: () => null,
}));

/* The drawer asks who this member follows to decide whether the follow tick is
   offered at all. Default: nobody — the tick is on the table. */
let mockFollowedUids = new Set<string>();
jest.mock('@/services/follow/hooks/useFollowedTeamUids', () => ({
  useFollowedTeamUids: () => ({ followedTeamUids: mockFollowedUids, isSettled: true }),
  useRememberTeamFollowed: () => jest.fn(),
}));

jest.mock('@/services/follow/follow.service', () => ({
  followTeam: jest.fn(),
}));

jest.mock('@/analytics/follow.analytics', () => ({
  useFollowAnalytics: () => ({ onTeamFollowed: jest.fn(), onTeamUnfollowed: jest.fn(), onTeamFollowFailed: jest.fn() }),
}));

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobApplySubmitted: jest.fn(),
    onJobApplyFailed: jest.fn(),
    onJobDetailOpened: jest.fn(),
    onJobApplyStepViewed: jest.fn(),
    onJobApplyFlowClosed: jest.fn(),
    onJobApplyExternalRedirected: jest.fn(),
    onJobUnlockInfoOpened: jest.fn(),
  }),
}));

import { JobApplyFlowDrawer } from '@/components/page/jobs/JobApplyFlowDrawer/JobApplyFlowDrawer';
import {
  INTEREST_CONFIRMED_TITLE,
  INTEREST_CTA_LABEL,
  INTEREST_SUBTITLE,
  INTEREST_UNDO_LABEL,
  JobInterestBanner,
  interestPromptTitle,
  teamFollowOfferLabel,
} from '@/components/page/jobs/JobInterestBanner/JobInterestBanner';
import { UNLOCK_TITLE } from '@/components/page/jobs/JobUnlock/unlockCopy';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const TEAM_NAME = 'Filecoin Foundation';

const renderBanner = (props: Partial<React.ComponentProps<typeof JobInterestBanner>> = {}) =>
  render(<JobInterestBanner teamName={TEAM_NAME} isInterested={false} error={null} onToggle={jest.fn()} {...props} />);

const action = () => screen.getByRole('button');

describe('the banner itself', () => {
  it('asks on behalf of the named team, and says what pressing costs', () => {
    renderBanner();

    expect(screen.getByText(interestPromptTitle(TEAM_NAME))).toBeInTheDocument();
    expect(screen.getByText(INTEREST_SUBTITLE)).toBeInTheDocument();
    expect(action()).toHaveAccessibleName(INTEREST_CTA_LABEL);
  });

  /* (A second case stood here, asserting a separate sentence for a signed-out
     visitor. `d5375bd05` withheld the banner from visitors entirely, so that
     state has been unreachable since — and the test went on passing, because it
     rendered the component directly rather than through the gate. The one rule
     that IS reachable is covered in `__tests__/services/jobs/job-board-viewer.test.ts`.) */

  it('confirms without a subtitle, because the title is the whole message', () => {
    renderBanner({ isInterested: true });

    expect(screen.getByText(INTEREST_CONFIRMED_TITLE)).toBeInTheDocument();
    expect(action()).toHaveAccessibleName(INTEREST_UNDO_LABEL);
    expect(screen.queryByText(INTEREST_SUBTITLE)).not.toBeInTheDocument();
  });

  it('asks for the state it is not in', () => {
    const onToggle = jest.fn();

    const { rerender } = renderBanner({ onToggle });
    fireEvent.click(action());
    expect(onToggle).toHaveBeenCalledWith(true, false, false);

    rerender(<JobInterestBanner teamName={TEAM_NAME} isInterested error={null} onToggle={onToggle} />);
    fireEvent.click(action());
    expect(onToggle).toHaveBeenLastCalledWith(false, false, false);
  });

  it('puts a refusal where the offer was, and leaves the control pressable', () => {
    const onToggle = jest.fn();
    renderBanner({ error: 'Could not save your interest', onToggle });

    expect(screen.getByText('Could not save your interest')).toBeInTheDocument();
    expect(screen.queryByText(INTEREST_SUBTITLE)).not.toBeInTheDocument();

    fireEvent.click(action());
    expect(onToggle).toHaveBeenCalledWith(true, false, false);
  });

  /* The follow offer: one row under the subtitle while the signal is unsent,
     and the tick as it stands rides the press. */
  it('carries the follow tick into the press that sends the signal', () => {
    const onToggle = jest.fn();
    renderBanner({ follow: { checked: true, onChange: jest.fn() }, onToggle });

    expect(screen.getByText(teamFollowOfferLabel(TEAM_NAME))).toBeInTheDocument();

    fireEvent.click(action());
    expect(onToggle).toHaveBeenCalledWith(true, true, true);
  });

  it('sends no follow when the tick was removed', () => {
    const onToggle = jest.fn();
    renderBanner({ follow: { checked: false, onChange: jest.fn() }, onToggle });

    fireEvent.click(action());
    expect(onToggle).toHaveBeenCalledWith(true, false, true);
  });

  /* Once the signal is in, the footer's press is Undo — and Undo is not an
     unfollow, so there is no press for the tick to ride. */
  it('withdraws the offer once the signal is in', () => {
    renderBanner({ isInterested: true, follow: { checked: true, onChange: jest.fn() } });

    expect(screen.queryByText(teamFollowOfferLabel(TEAM_NAME))).not.toBeInTheDocument();
  });

  /* The reason the two states share one `<button>`. If someone splits this into
     a conditional pair, the rendered output still looks right and this is the
     only thing that fails. */
  it('keeps focus on the control across the toggle', () => {
    const { rerender } = renderBanner();

    const before = action();
    before.focus();
    expect(document.activeElement).toBe(before);

    rerender(<JobInterestBanner teamName={TEAM_NAME} isInterested error={null} onToggle={jest.fn()} />);

    expect(action()).toBe(before);
    expect(document.activeElement).toBe(before);
    expect(document.activeElement).toHaveAccessibleName(INTEREST_UNDO_LABEL);
  });

  it('announces the change for someone who pressed with a mouse', () => {
    renderBanner();
    expect(screen.getByText(interestPromptTitle(TEAM_NAME)).closest('[aria-live]')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });
});

const role = {
  uid: 'r1',
  roleTitle: 'Protocol Engineer',
  applyUrl: 'https://example.com/apply',
} as unknown as IJobRole;
const team = { uid: 't2', name: TEAM_NAME } as unknown as IJobTeam;

const settledInterest = {
  isInterested: false,
  isSettled: true,
  error: null,
  onToggle: jest.fn(),
};

const renderDrawer = (props: Partial<React.ComponentProps<typeof JobApplyFlowDrawer>> = {}) =>
  render(
    <JobApplyFlowDrawer
      open
      onClose={jest.fn()}
      target={{ role, teamId: team.uid, teamName: team.name, team }}
      at="review"
      onStepChange={jest.fn()}
      coverLetter=""
      onCoverLetterChange={jest.fn()}
      memberUid="m1"
      member={null}
      isLoggedIn
      pendingApproval={false}
      profileComplete={false}
      applied={false}
      appliedAt={null}
      showOriginalPosting={false}
      applyGoesExternal
      onApply={jest.fn()}
      onSignUp={jest.fn().mockResolvedValue({ success: true })}
      onSignIn={jest.fn()}
      onProfileSaved={jest.fn()}
      onSubmitted={jest.fn()}
      viewerState="profile-ready"
      source="job-board"
      interest={settledInterest}
      {...props}
    />,
  );

const bannerTitle = () => screen.queryByText(interestPromptTitle(TEAM_NAME));

describe('when the drawer offers it', () => {
  beforeEach(() => {
    mockFollowedUids = new Set();
  });

  it('shows it to a member reading a role', () => {
    renderDrawer();
    expect(bannerTitle()).toBeInTheDocument();
  });

  /* The app always supplies the signal now. This covers the several suites that
     render this drawer to test something else and wire no `interest` — they must
     keep rendering a drawer, not crash on a missing prop. */
  it('renders the rest of the step when a host wires no signal', () => {
    renderDrawer({ interest: undefined });
    expect(bannerTitle()).not.toBeInTheDocument();
  });

  /* "Let them know you're interested" above a footer reading `Applied` is the
     drawer arguing with itself. */
  it('withholds it once an application exists', () => {
    renderDrawer({ applied: true, appliedAt: new Date().toISOString() });
    expect(bannerTitle()).not.toBeInTheDocument();
  });

  /* Not a spinner: the banner simply does not draw until the answer is known.
     Drawing the default state first would show an already-interested member the
     blue CTA flipping to green a beat after paint. */
  it('withholds it until the interest map has settled', () => {
    renderDrawer({ interest: { ...settledInterest, isSettled: false } });
    expect(bannerTitle()).not.toBeInTheDocument();
  });

  it('shows the confirmed state when the member already signalled', () => {
    renderDrawer({ interest: { ...settledInterest, isInterested: true } });

    expect(screen.getByText(INTEREST_CONFIRMED_TITLE)).toBeInTheDocument();
    expect(bannerTitle()).not.toBeInTheDocument();
  });

  /* A signed-out visitor gets the unlocks card and nothing above it — the
     composition the Figma draws. The drawer's markup can stack both, and a test
     here used to assert that it did, by handing the drawer an `interest` prop
     the controller never supplies without a session. Wiring none is what
     production does, so that is what this asserts. */
  it('leaves a signed-out visitor the unlocks card alone', () => {
    renderDrawer({ isLoggedIn: false, memberUid: undefined, viewerState: 'logged-out', interest: undefined });

    expect(screen.getByRole('heading', { name: UNLOCK_TITLE })).toBeInTheDocument();
    expect(bannerTitle()).not.toBeInTheDocument();
  });

  it('leaves a signed-in member the interest banner and no unlocks card', () => {
    renderDrawer();
    expect(bannerTitle()).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: UNLOCK_TITLE })).not.toBeInTheDocument();
  });

  /* The banner's follow row, decided by the drawer: offered to a member who
     does not follow the team, withheld from one who does — there is nothing
     left to offer. */
  it('offers the follow tick when the member does not follow the team', () => {
    renderDrawer();
    expect(screen.getByText(teamFollowOfferLabel(TEAM_NAME))).toBeInTheDocument();
  });

  it('withholds the follow tick when the member already follows the team', () => {
    mockFollowedUids = new Set(['t2']);
    renderDrawer();
    expect(screen.queryByText(teamFollowOfferLabel(TEAM_NAME))).not.toBeInTheDocument();
  });
});

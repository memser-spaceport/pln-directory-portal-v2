import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * "I've reviewed my profile" — the apply flow's step 2 consent.
 *
 * What goes to the hiring team is the profile, not the letter alone, so the
 * press that leaves this step is the press that decides what they read. The tick
 * is a **second** gate: role and job search status decide whether the profile can
 * be sent at all, and this decides whether you meant to send this one.
 *
 * The suite renders `JobApplyFlowDrawer` directly with the panes stubbed. That is
 * deliberate — the gate is the drawer's, not the pane's, and `profileState` is
 * seeded from the `profileComplete` prop, so a stubbed pane that never reports
 * still leaves the drawer holding the state this file is about.
 */

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

/* The three panes this file is not about. `JobApplicationPane` reaches
   `next/server` through the ReferModal hooks it borrows from `prototypes/`,
   which throws `Request is not defined` under jsdom. */
jest.mock('@/components/page/jobs/JobDetailPane/JobDetailPane', () => ({ JobDetailPane: () => null }));
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

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobApplySubmitted: jest.fn(),
    onJobApplyFailed: jest.fn(),
    onJobDetailOpened: jest.fn(),
    onJobApplyStepViewed: jest.fn(),
    onJobApplyFlowClosed: jest.fn(),
    onJobApplyExternalRedirected: jest.fn(),
  }),
}));

import { JobApplyFlowDrawer } from '@/components/page/jobs/JobApplyFlowDrawer/JobApplyFlowDrawer';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const role = { uid: 'r1', roleTitle: 'Protocol Engineer' } as unknown as IJobRole;
const PL = { uid: 'cldvnyxaf01ynu21k62uopjvg', name: 'Protocol Labs' } as unknown as IJobTeam;

const onStepChange = jest.fn();

/** Step 2 for a signed-in member. `profileComplete` seeds the drawer's own
 *  `profileState`, so it is what decides the *other* gate. */
const renderProfileStep = (props: Partial<React.ComponentProps<typeof JobApplyFlowDrawer>> = {}) =>
  render(
    <JobApplyFlowDrawer
      open
      onClose={jest.fn()}
      target={{ role, teamId: PL.uid, teamName: PL.name, team: PL }}
      at="profile"
      onStepChange={onStepChange}
      coverLetter=""
      onCoverLetterChange={jest.fn()}
      memberUid="m1"
      member={null}
      isLoggedIn
      pendingApproval={false}
      profileComplete
      applied={false}
      appliedAt={null}
      showOriginalPosting={false}
      applyGoesExternal={false}
      onApply={jest.fn()}
      onSignUp={jest.fn()}
      onSignIn={jest.fn()}
      onProfileSaved={jest.fn()}
      onSubmitted={jest.fn()}
      viewerState="profile-ready"
      source="job-board"
      {...props}
    />,
  );

const consent = () => screen.getByRole('checkbox', { name: /I've reviewed my profile/i });
const continueButton = () => screen.getByRole('button', { name: 'Continue to apply' });

describe('the profile step’s review gate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('offers the consent in the footer', () => {
    renderProfileStep();

    expect(consent()).toBeInTheDocument();
    expect(consent()).not.toBeChecked();
  });

  /* The sentence that used to hold this slot. It still runs in
     `JobProfileDrawer`, which has no application behind it and so nothing to
     consent to — here the tick is what the footer has to carry. */
  it('gives the slot up by dropping the optional-sections sentence', () => {
    renderProfileStep();

    expect(screen.queryByText(/Experience, skills and bio are optional/i)).not.toBeInTheDocument();
  });

  it('holds Continue shut until the box is ticked', () => {
    renderProfileStep();

    expect(continueButton()).toBeDisabled();

    fireEvent.click(consent());

    expect(continueButton()).toBeEnabled();
  });

  it('advances to the application once ticked and pressed', () => {
    renderProfileStep();
    fireEvent.click(consent());

    fireEvent.click(continueButton());

    expect(onStepChange).toHaveBeenCalledWith('application');
  });

  /**
   * The second gate is a second gate, not a replacement.
   *
   * An incomplete profile stays shut with the box ticked — role and job search
   * status still decide whether the profile can be sent at all. Without this the
   * consent would read as a way to skip the requirements.
   */
  it('stays shut for an incomplete profile even when ticked', () => {
    renderProfileStep({ profileComplete: false });

    fireEvent.click(consent());

    expect(continueButton()).toBeDisabled();
  });

  /**
   * A gate the rail can walk around is not a gate.
   *
   * The step rail's Application stop is a live control while step 2 sits there
   * untouched, so it obeys the same rule the footer does. `onStepChange` is the
   * observable: an unreachable stop reports nothing when pressed.
   */
  it('does not let the rail skip past the unticked consent', () => {
    renderProfileStep();

    fireEvent.click(screen.getByText('Application'));
    expect(onStepChange).not.toHaveBeenCalled();

    fireEvent.click(consent());
    fireEvent.click(screen.getByText('Application'));
    expect(onStepChange).toHaveBeenCalledWith('application');
  });
});

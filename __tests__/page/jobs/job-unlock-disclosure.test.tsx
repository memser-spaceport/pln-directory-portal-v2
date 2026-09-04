import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * "What your profile unlocks?" — the control under the apply drawer's footer, and
 * the two reasons it reveals.
 *
 * **What it replaced, and why that matters to a test.** The slot held a static
 * caption: "~2 min · team is notified you are interested". It promised a
 * notification this branch does not send, and it was wired as the primary
 * button's `aria-describedby`. Both are gone, and both are the kind of thing a
 * later pass restores by accident — a caption is easier to write than a popover,
 * and `aria-describedby` looks like an accessibility improvement right up until
 * it points at something focusable.
 *
 * **The shape is width-dependent**, which is the other reason this file exists.
 * `useIsMobile` reads `window.innerWidth` on mount, so the same trigger is a
 * popover at 1024px (jsdom's default) and a modal at 375px, and only one of those
 * gets exercised unless a test says otherwise.
 */

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

jest.mock('@/components/form/FormSelect', () => ({ FormSelect: () => null }));

jest.mock('@/services/members/hooks/useMemberFormOptions', () => ({
  useMemberFormOptions: () => ({ data: { teams: [] } }),
}));

/* `JobDetailPane` is stubbed to its banner slot rather than to null: the body
   card is one of the two surfaces this file cares about, and a null stub would
   hide it. The rest are static imports of the drawer that have nothing to do
   with the footer. */
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

const onJobUnlockInfoOpened = jest.fn();
jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobApplySubmitted: jest.fn(),
    onJobApplyFailed: jest.fn(),
    onJobDetailOpened: jest.fn(),
    onJobApplyStepViewed: jest.fn(),
    onJobApplyFlowClosed: jest.fn(),
    onJobApplyExternalRedirected: jest.fn(),
    onJobUnlockInfoOpened,
  }),
}));

import { JobApplyFlowDrawer } from '@/components/page/jobs/JobApplyFlowDrawer/JobApplyFlowDrawer';
import { UNLOCK_TITLE, UNLOCK_TRIGGER_LABEL } from '@/components/page/jobs/JobUnlock/unlockCopy';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const role = {
  uid: 'r1',
  roleTitle: 'Protocol Engineer',
  applyUrl: 'https://example.com/apply',
} as unknown as IJobRole;

const OTHER = { uid: 't2', name: 'Bluesky' } as unknown as IJobTeam;

const renderDrawer = (props: Partial<React.ComponentProps<typeof JobApplyFlowDrawer>> = {}) =>
  render(
    <JobApplyFlowDrawer
      open
      onClose={jest.fn()}
      target={{ role, teamId: OTHER.uid, teamName: OTHER.name, team: OTHER }}
      at="review"
      onStepChange={jest.fn()}
      coverLetter=""
      onCoverLetterChange={jest.fn()}
      memberUid={undefined}
      member={null}
      isLoggedIn={false}
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
      viewerState="logged-out"
      source="job-board"
      {...props}
    />,
  );

const trigger = () => screen.getByRole('button', { name: UNLOCK_TRIGGER_LABEL });

/* Every "is it revealed" assertion is scoped to the popup, never to the document.
   The body card (`JobUnlockBanner`) says the same two sentences on the same
   screen — by design, see the note on that component — so an unscoped
   `getByText` matches twice while the disclosure is open and, worse, matches
   once while it is shut. A test that passes when nothing has opened is not a
   test of a disclosure.

   Base UI gives both the popover and the modal a `dialog` role, which is why the
   same helper serves both branches. */
const revealed = () => screen.findByRole('dialog');
const isShut = () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

/* jsdom's default. Set explicitly and restored between tests because the mobile
   cases move it, and `useIsMobile` reads it once on mount — a leaked 375 would
   silently turn every later popover test into a modal test that still passes for
   the wrong reason. */
const DESKTOP_WIDTH = 1024;
const setWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
};

beforeEach(() => {
  jest.clearAllMocks();
  setWidth(DESKTOP_WIDTH);
});

describe('the footer disclosure', () => {
  it('is offered to a stranger reading an outbound role', () => {
    renderDrawer();

    expect(trigger()).toBeInTheDocument();
  });

  /* The gate is the drawer's, and it is the same one the profile press is behind.
     Someone who already has a profile is not asking what one unlocks. */
  it('is not offered to someone who already has a profile', () => {
    renderDrawer({ isLoggedIn: true, memberUid: 'm1', viewerState: 'pending-approval' });

    expect(screen.queryByRole('button', { name: UNLOCK_TRIGGER_LABEL })).not.toBeInTheDocument();
  });

  /* The in-app footer has no frame for a caption *or* a control, and inventing
     one to match the outbound branch's treatment is exactly the local copywriting
     this whole pass removed. */
  it('is not offered on a role that applies in-app', () => {
    renderDrawer({ applyGoesExternal: false });

    expect(screen.queryByRole('button', { name: UNLOCK_TRIGGER_LABEL })).not.toBeInTheDocument();
  });

  it('reveals both reasons when pressed', async () => {
    renderDrawer();
    fireEvent.click(trigger());

    const popup = within(await revealed());
    expect(popup.getByText('Get discovered')).toBeInTheDocument();
    expect(popup.getByText(/We surface your profile to founders/)).toBeInTheDocument();
    expect(popup.getByText('Signal interest')).toBeInTheDocument();
    expect(popup.getByText(/multiply your visibility/)).toBeInTheDocument();
  });

  /**
   * **The heading trap.** Base UI's `Popover.Title` and `Dialog.Title` both render
   * an `<h2>`, and `JobUnlockBanner` already puts a heading with these exact words
   * on the same screen. Using either part would give the document two headings
   * with one name — breaking the assertion in `job-account-step.test.tsx` that
   * finds the banner, and announcing the same heading twice to anyone walking the
   * page by heading. The popover names itself with `aria-labelledby` against a
   * plain `<p>` instead. This is what catches a "tidy-up" that restores the part.
   */
  it('does not add a second heading with the card’s name', async () => {
    renderDrawer();

    expect(screen.getAllByRole('heading', { name: UNLOCK_TITLE })).toHaveLength(1);

    fireEvent.click(trigger());
    const popup = within(await revealed());

    /* The popup does say the words — it just does not say them as a heading. */
    expect(popup.getByText(UNLOCK_TITLE)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: UNLOCK_TITLE })).toHaveLength(1);
  });

  it('closes on Escape', async () => {
    renderDrawer();
    fireEvent.click(trigger());
    await revealed();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    await waitFor(isShut);
  });

  /* Opening is the signal — it is the only evidence the case for a profile was
     read at all, since the card in the body renders whether or not anyone looks
     at it. Closing is not a second open, and with `openOnHover` on the desktop
     branch that distinction is the difference between a usable funnel and double
     every number in it. */
  it('reports the open, and only the open', async () => {
    renderDrawer();

    fireEvent.click(trigger());
    await revealed();

    expect(onJobUnlockInfoOpened).toHaveBeenCalledTimes(1);
    expect(onJobUnlockInfoOpened).toHaveBeenCalledWith(
      expect.objectContaining({ job_id: 'r1', team_id: 't2', viewer_state: 'logged-out', surface: 'popover' }),
    );

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    await waitFor(isShut);

    expect(onJobUnlockInfoOpened).toHaveBeenCalledTimes(1);
  });
});

/**
 * The phone. `useIsMobile` reads `window.innerWidth` on mount and its
 * `matchMedia` listener is a no-op stub under jsdom (`jest.setup.js`), so setting
 * the width *before* render is the whole recipe — no media query ever fires.
 */
describe('the footer disclosure on a phone', () => {
  beforeEach(() => setWidth(375));

  it('opens a dismissible modal rather than a popover', async () => {
    renderDrawer();
    fireEvent.click(trigger());

    const dialog = await revealed();
    expect(within(dialog).getByText(UNLOCK_TITLE)).toBeInTheDocument();
    expect(within(dialog).getByText(/We surface your profile to founders/)).toBeInTheDocument();

    /* The ✕ is the modal's, and the popover has none — which is what tells the
       two branches apart here, since Base UI gives both popups a dialog role. */
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    await waitFor(isShut);
  });

  it('reports the modal as its own surface', async () => {
    renderDrawer();
    fireEvent.click(trigger());
    await revealed();

    expect(onJobUnlockInfoOpened).toHaveBeenCalledWith(expect.objectContaining({ surface: 'modal' }));
  });
});

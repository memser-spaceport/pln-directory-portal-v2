import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Leaving the details step with a section half-edited.
 *
 * The step composes real member-profile sections that own their editing
 * privately, so the drawer's only way of knowing is the registry every edit form
 * signs into through `EditFormControls`. These tests mount the **real** flow
 * drawer over a fake pane whose sections render a **real** `EditFormControls`
 * inside a real `FormProvider` — because the thing under test is the wiring
 * between the two, and a stubbed section would make every one of these pass
 * without a guard existing at all.
 *
 * That is not hypothetical: `job-profile-drawer-footer.test.tsx` — the obvious
 * suite to have extended — stubs all five sections to `null`.
 */

/* jsdom has no ResizeObserver, and floating-ui's `autoUpdate` builds one to keep
   the popup on its anchor. */
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

jest.mock('@/components/common/Drawer', () => ({
  Drawer: ({ isOpen, children, onClose }: { isOpen: boolean; children: React.ReactNode; onClose: () => void }) =>
    isOpen ? (
      <div>
        {/* Stands in for Escape, which `Drawer` turns into exactly this call. */}
        <button type="button" onClick={onClose}>
          simulate-escape
        </button>
        {children}
      </div>
    ) : null,
}));

jest.mock('@/components/page/jobs/JobDetailPane/JobDetailPane', () => ({ JobDetailPane: () => null }));
jest.mock('@/components/page/jobs/JobApplicationPane/JobApplicationPane', () => ({
  JobApplicationPane: () => null,
  COVER_LETTER_MAX_LENGTH: 2000,
}));

/** A pane of two sections that behave like the real ones: a real form, a real
 *  `EditFormControls`, and therefore a real registration. */
jest.mock('@/components/page/jobs/JobProfileDrawer/JobProfileDrawer', () => {
  const ReactLib = require('react');
  const { FormProvider, useForm } = require('react-hook-form');
  const { EditFormControls } = require('@/components/common/profile/EditFormControls');
  const {
    EditOfficeHoursFormControls,
  } = require('@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls');

  /* Opens on a press, like the real sections — which is what makes registration
     order the order they were OPENED rather than the order they appear. The
     document-order test below depends on the two being able to differ.
     
     `header` picks between the app's TWO interchangeable controls components.
     Real forms do this too — `EditContactForm` renders the office-hours one in
     the drawer and the plain one everywhere else — which is exactly how Contact
     Details came to be ignored while Profile Details was guarded. */
  const Section = ({ label, header = 'plain' }: { label: string; header?: 'plain' | 'officeHours' }) => {
    const [open, setOpen] = ReactLib.useState(false);
    const methods = useForm({ defaultValues: { value: '' } });

    if (!open) {
      return (
        <button type="button" onClick={() => setOpen(true)}>
          Edit {label}
        </button>
      );
    }

    const Controls = header === 'officeHours' ? EditOfficeHoursFormControls : EditFormControls;

    return (
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => {})}>
          <Controls onClose={() => methods.reset()} title={label} />
          <input aria-label={`${label} field`} {...methods.register('value')} />
        </form>
      </FormProvider>
    );
  };

  return {
    JobProfilePane: () =>
      ReactLib.createElement(
        'div',
        null,
        ReactLib.createElement(Section, { label: 'Section A' }),
        ReactLib.createElement(Section, { label: 'Section B' }),
        ReactLib.createElement(Section, { label: 'Section C', header: 'officeHours' }),
      ),
    BackIcon: () => null,
  };
});

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

import { FormProvider, useForm } from 'react-hook-form';

import { JobApplyFlowDrawer } from '@/components/page/jobs/JobApplyFlowDrawer/JobApplyFlowDrawer';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const role = { uid: 'r1', roleTitle: 'Protocol Engineer' } as unknown as IJobRole;
const PL = { uid: 'cldvnyxaf01ynu21k62uopjvg', name: 'Protocol Labs' } as unknown as IJobTeam;

const onStepChange = jest.fn();
const onClose = jest.fn();

const renderProfileStep = () =>
  render(
    <JobApplyFlowDrawer
      open
      onClose={onClose}
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
    />,
  );

const continueButton = () => screen.getByRole('button', { name: 'Continue to apply' });
const popup = () => screen.queryByText(/verify and save your changes/i);

/** Consent is the drawer's *other* gate; tick it so these tests are only ever
 *  blocked by the thing they are about. */
const tickConsent = () => fireEvent.click(screen.getByRole('checkbox', { name: /I reviewed my profile/i }));

/** Open a section's editor — which is when its form mounts and registers. */
const openEditor = (label: string) => fireEvent.click(screen.getByRole('button', { name: `Edit ${label}` }));

const dirty = (label: string, value = 'typed') => {
  openEditor(label);
  fireEvent.change(screen.getByLabelText(`${label} field`), { target: { value } });
};

describe('leaving the details step with unsaved section edits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('lets Continue through when nothing has been edited', () => {
    renderProfileStep();
    tickConsent();

    fireEvent.click(continueButton());

    expect(onStepChange).toHaveBeenCalledWith('application');
    expect(popup()).not.toBeInTheDocument();
  });

  /**
   * The point of Decision 1. `EditFormControls` disables Save while the form is
   * clean, so blocking here would send someone to a button they cannot press —
   * a guard that reads as a bug.
   */
  it('lets Continue through when a section is open but untouched', () => {
    renderProfileStep();
    tickConsent();

    // The editor is genuinely open — just nothing typed into it.
    openEditor('Section A');
    expect(screen.getByLabelText('Section A field')).toBeInTheDocument();

    fireEvent.click(continueButton());

    expect(onStepChange).toHaveBeenCalledWith('application');
    expect(popup()).not.toBeInTheDocument();
  });

  it('refuses Continue while a section is dirty, and says so beside its Save', () => {
    const scrollTo = jest.spyOn(Element.prototype, 'scrollIntoView');
    renderProfileStep();
    tickConsent();
    dirty('Section A');

    fireEvent.click(continueButton());

    expect(onStepChange).not.toHaveBeenCalled();
    expect(popup()).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalled();
    scrollTo.mockRestore();
  });

  it('refuses Back by the same rule — it is the same move', () => {
    renderProfileStep();
    dirty('Section A');

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(onStepChange).not.toHaveBeenCalled();
    expect(popup()).toBeInTheDocument();
  });

  /**
   * Registration order is the order the person *opened* the sections; document
   * order is the one that makes sense to be sent to.
   */
  it('sends you to the first dirty section in document order, not the first edited', () => {
    const scrollTo = jest.spyOn(Element.prototype, 'scrollIntoView');
    renderProfileStep();
    tickConsent();

    /* B is OPENED first, so it registers first — its entry is ahead of A's in
       the map. A is above it on the page, and that is where the person should
       be sent. */
    dirty('Section B');
    dirty('Section A');

    fireEvent.click(continueButton());

    expect(onStepChange).not.toHaveBeenCalled();
    const scrolled = scrollTo.mock.instances[0] as unknown as HTMLElement;
    expect(scrolled).toHaveTextContent('Section A');
    scrollTo.mockRestore();
  });

  it('takes the popup away as soon as the section stops being dirty', () => {
    renderProfileStep();
    tickConsent();
    dirty('Section A');
    fireEvent.click(continueButton());
    expect(popup()).toBeInTheDocument();

    // Cancel resets the form; the popup is derived from "flagged AND dirty", so
    // it goes without anything having to remember to remove it.
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0]);

    expect(popup()).not.toBeInTheDocument();
  });

  /**
   * Closing — the X, and Escape.
   *
   * Held exactly like `Back to the job`, and deliberately not with a modal of
   * its own. One screen answering "you have unsaved work" in two grammars, for
   * two controls an inch apart, is two things to learn where the situation is
   * identical. (The modal that briefly stood here also rendered *under* the
   * drawer — both are `z-index: 10`.)
   */
  describe('closing the drawer', () => {
    it('is held the same way Back is, not with a modal of its own', () => {
      renderProfileStep();
      dirty('Section A');

      fireEvent.click(screen.getByRole('button', { name: 'simulate-escape' }));

      expect(onClose).not.toHaveBeenCalled();
      expect(popup()).toBeInTheDocument();
      expect(screen.queryByText(/discard changes\?/i)).not.toBeInTheDocument();
    });

    /* The way out is the one the form already had. Nothing new was invented for
       this press, and nothing holds anybody here permanently. */
    it('lets you out once the section is cancelled', () => {
      renderProfileStep();
      dirty('Section A');
      fireEvent.click(screen.getByRole('button', { name: 'simulate-escape' }));
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0]);
      fireEvent.click(screen.getByRole('button', { name: 'simulate-escape' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('closes straight away when nothing is dirty', () => {
      renderProfileStep();

      fireEvent.click(screen.getByRole('button', { name: 'simulate-escape' }));

      expect(onClose).toHaveBeenCalled();
      expect(popup()).not.toBeInTheDocument();
    });
  });

  /**
   * THE BUG THIS SUITE MISSED FIRST TIME.
   *
   * There are two interchangeable controls components, and a form can render
   * either — `EditContactForm` picks by variant. Only one of them registered, so
   * the drawer scrolled to Profile Details and walked straight past Contact
   * Details, on the same screen, with nothing on either to explain the
   * difference.
   */
  it('guards a section built from the office-hours controls too', () => {
    renderProfileStep();
    tickConsent();
    dirty('Section C');

    fireEvent.click(continueButton());

    expect(onStepChange).not.toHaveBeenCalled();
    expect(popup()).toBeInTheDocument();
  });

  /**
   * The other eleven call sites.
   *
   * `EditFormControls` is shared with team-details and demo-day, which have no
   * provider over them. Registration has to be inert there — not merely
   * harmless, but invisible.
   */
  it('is unchanged where no drawer is listening', () => {
    const Standalone = () => {
      const methods = useForm({ defaultValues: { value: '' } });
      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(() => {})}>
            <EditFormControls onClose={jest.fn()} title="Edit Team Details" />
            <input aria-label="field" {...methods.register('value')} />
          </form>
        </FormProvider>
      );
    };

    render(<Standalone />);

    expect(screen.getByText('Edit Team Details')).toBeInTheDocument();
    /* The submit button still tracks dirtiness exactly as before — clean it
       reads "No Changes" and is disabled, dirty it becomes a pressable Save —
       and nothing new is drawn beside it. */
    expect(screen.getByRole('button', { name: 'No Changes' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('field'), { target: { value: 'x' } });

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(popup()).not.toBeInTheDocument();
  });
});

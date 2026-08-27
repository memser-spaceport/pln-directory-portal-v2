import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/components/common/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

// react-select in a form nobody drives through the company picker is noise. The
// field stays out of the tree; `company` keeps its `null` default, which is what
// a skipped select submits anyway.
jest.mock('@/components/form/FormSelect', () => ({ FormSelect: () => null }));

jest.mock('@/services/members/hooks/useMemberFormOptions', () => ({
  useMemberFormOptions: () => ({ data: { teams: [{ teamUid: 't1', teamTitle: 'Acme' }] } }),
}));

import { JobSignUpModal } from '@/components/page/jobs/JobSignUpModal/JobSignUpModal';
import type { IJobRole } from '@/types/jobs.types';

/**
 * The board's sign-up dialog — the one door a logged-out visitor has.
 *
 * Two things here are worth guarding above the rest. The optional fields carry
 * hand-rolled labels, because `FormField`'s `label` prop is a `string` and a
 * styled `(Optional)` can't go through it — which means the label/input
 * association is ours to get right rather than the component's, and it breaks
 * silently. And `serverError` is the one branch the prototype this was ported
 * from deleted outright, because a mock has no server to refuse it.
 */

const baseProps = {
  open: true,
  onClose: jest.fn(),
  role: null,
  teamName: '',
  onSignUp: jest.fn().mockResolvedValue({ success: true }),
  onSignIn: jest.fn(),
};

const renderModal = (overrides: Partial<React.ComponentProps<typeof JobSignUpModal>> = {}) =>
  render(<JobSignUpModal {...baseProps} {...overrides} />);

/** Picks one of the three job search statuses by its visible label. The
 *  accessible name comes from the wrapping `<label>`, so it carries the option's
 *  hint too — hence a substring match rather than an exact one. */
const chooseStatus = (label: RegExp = /Actively looking/) =>
  fireEvent.click(screen.getByRole('radio', { name: label }));

/**
 * Fills the four fields the schema actually requires.
 *
 * The status belongs in here rather than in the tests that care about it: it
 * gates submission, so leaving it out would turn every `submitting` case below
 * into a test of the gate instead of a test of what it claims to check — green
 * for the wrong reason if the assertion is on `onSignUp` *not* firing, and a
 * confusing failure otherwise.
 */
const fillRequired = () => {
  fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Polina Bublii' } });
  fireEvent.change(screen.getByLabelText(/LinkedIn profile/), { target: { value: 'polina-bublii' } });
  chooseStatus();
};

describe('the job board sign-up modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    baseProps.onSignUp.mockResolvedValue({ success: true });
  });

  describe('the fields', () => {
    it('marks current role optional and leaves LinkedIn required', () => {
      renderModal();

      expect(screen.getByText(/Current role & company/).textContent).toContain('Optional');

      expect(screen.getByText('LinkedIn profile').textContent).not.toContain('Optional');
      expect(screen.getByText('Email address').textContent).not.toContain('Optional');
      expect(screen.getByText('Full name').textContent).not.toContain('Optional');
      expect(screen.queryByText('Team email')).not.toBeInTheDocument();
    });

    it('associates LinkedIn with its input', () => {
      renderModal();

      expect(screen.getByLabelText(/LinkedIn profile/)).toHaveAttribute('id', 'linkedin');
    });

    it('asks for a work address in the placeholder, where everyone meets it', () => {
      renderModal();

      expect(screen.getByLabelText(/Email address/)).toHaveAttribute('placeholder', 'you@company.com');
    });
  });

  /**
   * The one question on this form that is not about the account.
   *
   * Asked here so the account arrives with a job-search answer. Role is optional
   * on this form, so they still land on the profile step after sign-in to finish
   * it — this gate is so the status is not also owed there.
   */
  describe('the job search status', () => {
    it('offers Actively looking and Open to the right role, not Not looking', () => {
      renderModal();

      const group = screen.getByRole('radiogroup', { name: 'Job search status' });
      expect(group).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(2);
      expect(screen.getByRole('radio', { name: /Open to the right role/ })).toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: /Not looking/ })).not.toBeInTheDocument();
    });

    /* Required in the same way `Email address` is, and marked the same way. A
       form that refuses to submit without a field it has not marked required is
       worse than one with no marking system at all. */
    it('carries the required mark rather than the optional one', () => {
      renderModal();

      const label = screen.getByText('Job search status');
      expect(label.textContent).not.toContain('Optional');
      expect(label).toHaveClass('required');
    });

    it('refuses to submit until one is chosen, and says why', async () => {
      renderModal();
      // Everything except the status.
      fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });
      fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Polina Bublii' } });
      fireEvent.change(screen.getByLabelText(/LinkedIn profile/), { target: { value: 'polina-bublii' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(screen.getByText('Select where you are with job hunting')).toBeInTheDocument());
      expect(baseProps.onSignUp).not.toHaveBeenCalled();
    });

    it('reports the chosen status on the way out', async () => {
      renderModal();
      fillRequired();
      chooseStatus(/Open to the right role/);

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ jobSearchStatus: 'open-to-right-role' }),
      );
    });
  });

  describe('submitting', () => {
    it('submits with every optional field blank', async () => {
      renderModal();
      fillRequired();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ linkedin: 'polina-bublii', role: '', teamUid: null }),
      );
    });

    it('refuses to submit without LinkedIn', async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });
      fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Polina Bublii' } });
      chooseStatus();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(screen.getByText('LinkedIn is required')).toBeInTheDocument());
      expect(baseProps.onSignUp).not.toHaveBeenCalled();
    });

    /* The branch the prototype deleted along with its server. Losing it would
       leave someone who already has an account with a form that simply does
       nothing when they press the button. */
    it('names an email that already has an account', async () => {
      baseProps.onSignUp.mockResolvedValue({ success: false, emailTaken: true });
      renderModal();
      fillRequired();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(screen.getByText(/This email already has an account/)).toBeInTheDocument());
    });

    it('falls back to a retry message on any other refusal', async () => {
      baseProps.onSignUp.mockResolvedValue({ success: false });
      renderModal();
      fillRequired();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(screen.getByText(/couldn’t create your account just now/)).toBeInTheDocument());
    });
  });

  describe('the copy and the doors', () => {
    /* The prototype's line says a new account can browse *and apply* while the
       review runs. That is true only after the flow change this pass deferred;
       here approval still gates applying, and the endpoint still answers 403. */
    it('says approval gates applying, which is what the board actually does', () => {
      renderModal();

      expect(screen.getByText(/applying opens up once you're approved/)).toBeInTheDocument();
    });

    it('offers the sign-in escape', () => {
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      expect(baseProps.onSignIn).toHaveBeenCalled();
    });

    /* The role-carrying door belongs to the deferred pass. Until then the modal
       still names the job someone pressed Apply on, because the form is the
       continuation of that click. */
    it('still names the role when it was opened from one', () => {
      renderModal({ role: { roleTitle: 'Senior Distributed Systems Engineer' } as IJobRole, teamName: 'Acme' });

      expect(screen.getByText('Apply for Senior Distributed Systems Engineer')).toBeInTheDocument();
    });

    it('goes generic when there is no role to name', () => {
      renderModal();

      expect(screen.getByText('Sign up to apply')).toBeInTheDocument();
    });
  });
});

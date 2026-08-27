import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/components/common/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => (isOpen ? <div>{children}</div> : null),
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

/** Fills the three fields the schema actually requires. */
const fillRequired = () => {
  fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Polina Bublii' } });
  fireEvent.change(screen.getByPlaceholderText('Enter your current role'), {
    target: { value: 'Senior Protocol Engineer' },
  });
};

describe('the job board sign-up modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    baseProps.onSignUp.mockResolvedValue({ success: true });
  });

  describe('the fields', () => {
    it('marks the two blankable fields optional and leaves the required pair unmarked', () => {
      renderModal();

      // The mark is a system, not an exception: required carries `*`, optional
      // carries the words. A form with one marked field would make LinkedIn the
      // one input whose state you deduce from an absent asterisk.
      expect(screen.getByText('Team email').textContent).toContain('Optional');
      expect(screen.getByText('LinkedIn profile').textContent).toContain('Optional');

      expect(screen.getByText('Email address').textContent).not.toContain('Optional');
      expect(screen.getByText('Full name').textContent).not.toContain('Optional');
    });

    /* `FormField` renders its input with `id={name}`, which is the whole reason a
       hand-rolled `<label htmlFor>` associates at all. If that ever changes these
       labels become decoration and clicking one focuses nothing — with no visual
       symptom. */
    it('associates the hand-rolled labels with their inputs', () => {
      renderModal();

      expect(screen.getByLabelText(/Team email/)).toHaveAttribute('id', 'teamEmail');
      expect(screen.getByLabelText(/LinkedIn profile/)).toHaveAttribute('id', 'linkedin');
    });

    it('asks for a work address in the placeholder, where everyone meets it', () => {
      renderModal();

      expect(screen.getByLabelText(/Email address/)).toHaveAttribute('placeholder', 'you@company.com');
    });
  });

  describe('the personal-domain note', () => {
    it('says nothing until a personal domain is finished', async () => {
      renderModal();

      expect(screen.queryByText(/Add your team email below/)).not.toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });
      await waitFor(() => expect(screen.queryByText(/Add your team email below/)).not.toBeInTheDocument());

      fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@gmail.com' } });
      await waitFor(() => expect(screen.getByText(/Add your team email below/)).toBeInTheDocument());
    });

    /* `FormField` renders `description` only when the field has no error. A
       malformed address is a problem and a personal one is a preference; only one
       of them should be talking at a time. */
    it('yields to a real validation error', async () => {
      renderModal();

      const email = screen.getByLabelText(/Email address/);
      fireEvent.change(email, { target: { value: 'polina doe@gmail.com' } });
      fireEvent.blur(email);

      await waitFor(() => expect(screen.getByText('Must be a valid email')).toBeInTheDocument());
      expect(screen.queryByText(/Add your team email below/)).not.toBeInTheDocument();
    });
  });

  describe('submitting', () => {
    it('reports the team email, trimmed', async () => {
      renderModal();
      fillRequired();
      fireEvent.change(screen.getByLabelText(/Team email/), { target: { value: '  polina@newco.xyz  ' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp).toHaveBeenCalledWith(expect.objectContaining({ teamEmail: 'polina@newco.xyz' }));
    });

    it('submits with every optional field blank', async () => {
      renderModal();
      fillRequired();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ teamEmail: '', linkedin: '', teamUid: null }),
      );
    });

    it('refuses a malformed team email', async () => {
      renderModal();
      fillRequired();
      fireEvent.change(screen.getByLabelText(/Team email/), { target: { value: 'not-an-address' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(screen.getByText('Must be a valid email')).toBeInTheDocument());
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

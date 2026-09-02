import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/components/common/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

/**
 * A native `<select>` standing in for react-select.
 *
 * It used to render `null`, on the reasoning that a form nobody drives through
 * the company picker is noise. That stopped being true when the PL-team tick
 * made the team an answer the form refuses to submit without: with the field out
 * of the tree there is no way to give the answer, so every ticked case would
 * test the gate instead of what it claims to check.
 *
 * Three behaviours have to survive the stand-in. It writes the whole option
 * object into form state, not the uid (`FormSelect` does this via `setValue`, and
 * `toAccountDetails` is what flattens it later) — and it renders its own field
 * error, which is the only way anyone learns the team is missing. A mock that
 * swallowed the message would let "the form refuses silently" pass as green.
 *
 * The third is newer: it takes its accessible name from `aria-label` and falls
 * back to the placeholder, which is what the real component does. It used to
 * hardcode the placeholder, and that was harmless only while no caller passed a
 * name — this one now does, and a mock that ignored it would report an
 * accessible name the real select does not have.
 *
 * `requireActual` inside the factory because `jest.mock` is hoisted above the
 * imports.
 */
jest.mock('@/components/form/FormSelect', () => {
  const { useFormContext } = jest.requireActual('react-hook-form');
  type Option = { label: string; value: string };

  return {
    FormSelect: ({
      name,
      placeholder,
      options,
      'aria-label': ariaLabel,
    }: {
      name: string;
      placeholder: string;
      options: Option[];
      'aria-label'?: string;
    }) => {
      const {
        setValue,
        watch,
        formState: { errors },
      } = useFormContext();
      const selected = watch(name) as Option | null;
      const error = errors[name]?.message as string | undefined;

      return (
        <>
          <select
            aria-label={ariaLabel ?? placeholder}
            value={selected?.value ?? ''}
            onChange={(e) =>
              setValue(name, options.find((o) => o.value === e.target.value) ?? null, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            <option value="">{placeholder}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {error && <p>{error}</p>}
        </>
      );
    },
  };
});

jest.mock('@/services/members/hooks/useMemberFormOptions', () => ({
  useMemberFormOptions: () => ({ data: { teams: [{ teamUid: 't1', teamTitle: 'Acme' }] } }),
}));

import { JobSignUpModal } from '@/components/page/jobs/JobSignUpModal/JobSignUpModal';
import type { IJobRole } from '@/types/jobs.types';

/**
 * The board's sign-up dialog — the one door a logged-out visitor has.
 *
 * Two things here are worth guarding above the rest. The role/team row carries a
 * hand-rolled label, because `FormField`'s `label` prop is a `string` and the
 * styled required mark can't go through it — so that `div` names neither input,
 * and the two accessible names come from `aria-label` instead. That is ours to
 * get right rather than the component's, and it breaks silently, which is why
 * there is a test for the names themselves. And `serverError` is the one branch
 * the prototype this was ported from deleted outright, because a mock has no
 * server to refuse it.
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
};

/**
 * Ticks the PL-team box and answers both fields it makes required.
 *
 * Separate from `fillRequired` because the tick is not part of the baseline
 * form — most of this suite signs up as someone with no network team, which is
 * the commoner case and the one the short form is shaped for.
 */
const claimPlTeam = () => {
  fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));
  /* By accessible name. The row's visible label is a hand-rolled `div` associated
     with neither input, so each half carries its own `aria-label` — see the note
     at the top of this file, and `the row's two inputs` below for the test that
     guards the names these queries depend on. */
  fireEvent.change(screen.getByLabelText('Current role'), {
    target: { value: 'Protocol Engineer' },
  });
  fireEvent.change(screen.getByLabelText('PL network team'), { target: { value: 't1' } });
};

describe('the job board sign-up modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    baseProps.onSignUp.mockResolvedValue({ success: true });
  });

  describe('the fields', () => {
    /**
     * Nothing on this form is marked optional, and the role — the one field that
     * *is* optional until the tick — is the reason that reads as a choice rather
     * than an omission.
     *
     * The design marks the row `Current role` in both states. Unmarked-and-optional
     * costs a reader nothing; unmarked-and-required is a form refusing to submit
     * over a field it never flagged, which is why the asterisks below stay and
     * why the tick still brings one (see the next two tests).
     */
    it('marks nothing optional, and leaves the required fields required', () => {
      renderModal();

      expect(screen.getByText(/^Current role/).textContent).not.toContain('Optional');

      expect(screen.getByText('LinkedIn profile').textContent).not.toContain('Optional');
      expect(screen.getByText('Email address').textContent).not.toContain('Optional');
      expect(screen.getByText('Full name').textContent).not.toContain('Optional');
      expect(screen.queryByText('Team email')).not.toBeInTheDocument();
    });

    /**
     * The row's two inputs each have a name of their own.
     *
     * Guarded because nothing else would notice it break. The visible label is a
     * `div` associated with neither input, so without these `aria-label`s the
     * role box and the team select are unnamed to a screen reader — and they were,
     * until the label stopped naming both of them at once. `claimPlTeam` reaches
     * for exactly these names, so a regression here also takes half this suite
     * with it, which is the second reason to state it as its own assertion.
     */
    it('names the row’s two inputs, which its label does not', () => {
      renderModal();

      expect(screen.getByLabelText('Current role')).toBeInTheDocument();
      expect(screen.queryByLabelText('PL network team')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));

      expect(screen.getByLabelText('Current role')).toBeInTheDocument();
      expect(screen.getByLabelText('PL network team')).toBeInTheDocument();
    });

    /**
     * The PL-team switch.
     *
     * The row used to put the team select in front of everyone, and for almost
     * every visitor the only correct answer was to leave it alone. The default
     * form is now the short one; ticking is what asks for the select.
     */
    it('asks for a team only once you say you are on one', () => {
      renderModal();

      /* On the select itself, not on the label. This used to key on the label
         growing a second noun ("Current role & PL network team"), which was the
         only readable difference between the two states at the time. The label is
         constant now, so the discriminator is the thing that actually appears:
         the select and the `@` that punctuates it. */
      expect(screen.queryByLabelText('PL network team')).not.toBeInTheDocument();
      expect(screen.queryByText('@')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));

      expect(screen.getByLabelText('PL network team')).toBeInTheDocument();
      expect(screen.getByText('@')).toBeInTheDocument();
    });

    /* The mark has to arrive with the rule. A form that refuses to submit over a
       field it never flagged is worse than one with no marking system at all —
       which is the whole reason `JobSearchStatusField` carries the asterisk
       `Email address` does. The label itself does not change; only the mark. */
    it('marks the row required when the box is ticked', () => {
      renderModal();

      expect(screen.getByText(/^Current role/).textContent).not.toContain('*');

      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));

      const label = screen.getByText(/^Current role/);
      expect(label.textContent).toContain('*');
      expect(label.textContent).not.toContain('Optional');
    });

    /* Unticking clears the team rather than merely hiding it. A hidden select
       still holding a team would submit an employer the person has just told the
       form they don't have — invisible, kept, and wrong. */
    it('submits no team after the box is unticked', async () => {
      renderModal();
      fillRequired();

      const box = screen.getByRole('checkbox', { name: /I work at a PL network startup/i });
      fireEvent.click(box);
      fireEvent.click(box);

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp).toHaveBeenCalledWith(expect.objectContaining({ teamUid: null }));
    });

    /* `onPlTeam` is a switch for this form and nothing the endpoint has heard of.
       The sign-up payload is validated strictly, so an extra key is a refusal
       rather than an ignored extra — this is the test that would catch it
       leaking into `toAccountDetails`. */
    it('keeps the switch out of the submitted payload', async () => {
      renderModal();
      fillRequired();
      claimPlTeam();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp.mock.calls[0][0]).not.toHaveProperty('onPlTeam');
    });

    /**
     * The tick is a claim, and the claim has to arrive with its answers.
     *
     * This is what the requirement is *for*: the backend files a sign-up as a
     * Job Aspirant — apply-only, never reviewed, no "profile under review"
     * banner — whenever no team comes with it. A tick with an empty select was
     * not a softer claim, it was the claim being dropped at exactly the point
     * where it was supposed to put the account in front of a human.
     */
    it('refuses a PL-team claim with no team behind it', async () => {
      renderModal();
      fillRequired();
      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));
      /* The role only — the team is the answer this case withholds. */
      fireEvent.change(screen.getByLabelText('Current role'), {
        target: { value: 'Protocol Engineer' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      expect(await screen.findByText('Select your PL network team')).toBeInTheDocument();
      expect(baseProps.onSignUp).not.toHaveBeenCalled();
    });

    /* The other half of the same rule. Both fields sit under one label and the
       tick makes them required together, so the role is guarded here too. */
    it('refuses a PL-team claim with no current role', async () => {
      renderModal();
      fillRequired();
      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));
      fireEvent.change(screen.getByLabelText('PL network team'), { target: { value: 't1' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      expect(await screen.findByText('Current role is required')).toBeInTheDocument();
      expect(baseProps.onSignUp).not.toHaveBeenCalled();
    });

    /* Answered, it goes through — and the team reaches the payload as the uid
       the endpoint takes, which is what makes the backend treat this account as
       a network member rather than an aspirant. */
    it('submits the team once the claim is answered', async () => {
      renderModal();
      fillRequired();
      claimPlTeam();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ teamUid: 't1', role: 'Protocol Engineer' }),
      );
    });

    /**
     * Unticking has to take the verdict with it.
     *
     * `mode: 'onBlur'` plus a failed submit leaves a live error on `role`, and
     * the rule that produced it is gone the moment the box is cleared. Without
     * the re-run in `toggleOnPlTeam` the message outlives its requirement and
     * the form reads as broken — an error on a field that is now optional.
     */
    it('clears the required errors when the claim is withdrawn', async () => {
      renderModal();
      fillRequired();
      const box = screen.getByRole('checkbox', { name: /I work at a PL network startup/i });

      fireEvent.click(box);
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      expect(await screen.findByText('Current role is required')).toBeInTheDocument();

      fireEvent.click(box);

      await waitFor(() => expect(screen.queryByText('Current role is required')).not.toBeInTheDocument());
      expect(screen.queryByText('Select your PL network team')).not.toBeInTheDocument();
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
  /**
   * This door does not ask where you are with job hunting.
   *
   * The drawer's step 2 does, and still refuses to submit without it — see
   * `job-account-step.test.tsx`. The split is the point: that door is reached by
   * pressing Apply, so an application is waiting on the answer; this one is
   * reached from a banner naming no job, and asks the shortest question it can.
   */
  describe('the job search status it does not ask for', () => {
    it('offers no status field at all', () => {
      renderModal();

      expect(screen.queryByRole('radiogroup', { name: 'Job search status' })).not.toBeInTheDocument();
      expect(screen.queryByText('Job search status')).not.toBeInTheDocument();
      expect(screen.queryAllByRole('radio')).toHaveLength(0);
    });

    /* The rule has to come off with the field. A required answer with nothing
       on screen to give it is a Create account button that does nothing and
       says nothing — the worst of the three outcomes, and exactly what removing
       the field without the schema would have produced. */
    it('does not hold the form shut over the answer it never requested', async () => {
      renderModal();
      fillRequired();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(screen.queryByText('Select where you are with job hunting')).not.toBeInTheDocument();
    });

    /* Null, not a guess. `toAccountDetails` used to fall back to
       `open-to-right-role`, which was unreachable while every door asked and
       would now file a claim about someone's job hunt that they never made —
       and it is the one answer the product later shows back to them as theirs.
       The controller omits the key entirely when this is null. */
    it('reports no status rather than inventing one', async () => {
      renderModal();
      fillRequired();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp).toHaveBeenCalledWith(expect.objectContaining({ jobSearchStatus: null }));
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
    /**
     * The note under the form, and the claim it must not make again.
     *
     * It used to tell every reader "The PL team reviews new accounts first —
     * you can browse every role while you wait, and applying opens up once
     * you're approved." Both clauses were false for the commoner reader: a
     * sign-up with no network team is filed as a Job Aspirant, whom no admin
     * reviews, and approval stopped gating applying when the board dropped that
     * rule. It was also the likeliest reason someone would go looking for a
     * review banner that is deliberately absent for them.
     *
     * Asserted as the absence of the promise rather than the presence of one
     * phrasing, so a later reword can't quietly reintroduce it.
     */
    it('promises no review and no approval gate to a sign-up with no team', () => {
      renderModal();

      expect(screen.getByText(/sends nothing to a hiring team/)).toBeInTheDocument();
      expect(screen.queryByText(/approved/)).not.toBeInTheDocument();
      expect(screen.queryByText(/review/i)).not.toBeInTheDocument();
    });

    /* Ticked, the review sentence is true — the backend files a sign-up naming a
       network team as a regular member, and an admin does review it. The second
       clause matches the pending banner they will meet on the board, so the two
       surfaces agree about what the review holds up: nothing. */
    it('names the review once the sign-up claims a network team', () => {
      renderModal();
      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));

      expect(screen.getByText(/The PL team reviews network-team accounts/)).toBeInTheDocument();
      expect(screen.getByText(/applying never waits on that/)).toBeInTheDocument();
    });

    /* The reassurance the note exists for survives both branches: this press
       files no application. It is the flow's pending-never-claims-applied rule
       at the moment trust is being asked for. */
    it('says nothing is sent to a hiring team either way', () => {
      renderModal();
      expect(screen.getByText(/sends nothing to a hiring team/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));
      expect(screen.getByText(/sends nothing to a hiring team/)).toBeInTheDocument();
    });

    it('offers the sign-in escape', () => {
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      expect(baseProps.onSignIn).toHaveBeenCalled();
    });

    /* One header for both doors in, and the role is deliberately not one of
       them any more.

       It used to fork: "Apply for {roleTitle}" when opened from a posting, a
       generic line otherwise — the argument being that the form is the
       continuation of that click. What it also did was say "Apply for…" above a
       form that applies for nothing; this press creates an account and files no
       application, which is the one claim the rest of this modal works to avoid.

       Asserted for both entry paths in one test on purpose. Two tests would
       suggest two behaviours, and the behaviour under test is that there is only
       one. */
    it.each([
      [
        'opened from a role',
        { role: { roleTitle: 'Senior Distributed Systems Engineer' } as IJobRole, teamName: 'Acme' },
      ],
      ['opened with no role', {}],
    ])('names what the press creates, not the job — %s', (_label, overrides) => {
      renderModal(overrides);

      expect(screen.getByText('Create PL network Job profile')).toBeInTheDocument();
      expect(
        screen.getByText('Discover open roles across the network — and let founders reach out.'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/^Apply for /)).not.toBeInTheDocument();
    });
  });
});

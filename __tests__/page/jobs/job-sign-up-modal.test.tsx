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
 * Fills the four fields the schema requires of everyone, plus the role.
 *
 * The status belongs in here rather than in the tests that care about it: it
 * gates submission, so leaving it out would turn every `submitting` case below
 * into a test of the gate instead of a test of what it claims to check — green
 * for the wrong reason if the assertion is on `onSignUp` *not* firing, and a
 * confusing failure otherwise.
 *
 * The role is here for a weaker reason and is worth naming as such: it is
 * optional until the PL-team box is ticked, so filling it is not what makes
 * these submits go through. It is filled because most cases below assert on the
 * payload, and a payload carrying the role is the one the product actually
 * sends. The two tests that turn on the rule itself set it themselves — see
 * `submits with no role when no PL-team claim is made` and `refuses a PL-team
 * claim with no current role`.
 */
/** Everything `fillRequired` does except pick a status — so the one test that
 *  needs the status *missing* and nothing else missing can say exactly that,
 *  rather than re-listing four fields and drifting from this one. */
const fillRequiredExceptStatus = () => {
  fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'polina@protocol.ai' } });
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Polina Bublii' } });
  fireEvent.change(screen.getByLabelText(/LinkedIn profile/), { target: { value: 'polina-bublii' } });
  /* By accessible name. The row's visible label is a hand-rolled `div` associated
     with neither input, so each half carries its own `aria-label` — see the note
     at the top of this file, and `the row's two inputs` below for the test that
     guards the names these queries depend on. */
  fireEvent.change(screen.getByLabelText('Current role'), { target: { value: 'Protocol Engineer' } });
};

const fillRequired = () => {
  fillRequiredExceptStatus();
  /* Matched on the label alone, not the whole accessible name. Each option's
     name is its label *plus* its hint sentence, and the hints carry typographic
     apostrophes — a full-string matcher would be comparing against characters
     that print identically to the ones you would type. */
  fireEvent.click(screen.getByRole('radio', { name: /Actively looking/ }));
};

/**
 * Ticks the PL-team box and answers the one extra field it makes required.
 *
 * Separate from `fillRequired` because the tick is not part of the baseline
 * form — most of this suite signs up as someone with no network team, which is
 * the commoner case.
 *
 * The role it makes required is set by `fillRequired` rather than here, so the
 * two tests that withhold one can do so by blanking a filled field — an
 * explicit `''` reads as the answer being withheld, where an omission reads as
 * the helper having forgotten it.
 */
const claimPlTeam = () => {
  fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));
  fireEvent.change(screen.getByLabelText('PL network team'), { target: { value: 't1' } });
};

describe('the job board sign-up modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    baseProps.onSignUp.mockResolvedValue({ success: true });
  });

  describe('the fields', () => {
    /**
     * Nothing on this form is *marked* optional, the role included.
     *
     * The role is the one field whose requirement moves with the PL-team tick,
     * and in the untied state it carries no mark of either kind — per the
     * design, and see the note on the label in `accountFields`:
     * unmarked-and-optional costs nothing, unmarked-and-required does not. So
     * the absence of `(Optional)` here is a choice rather than an omission, and
     * `marks the role row required only once the box is ticked` is the other
     * half of it.
     */
    it('marks nothing optional, and leaves the required fields required', () => {
      renderModal();

      expect(screen.getByText(/^Current role/).textContent).not.toContain('Optional');

      expect(screen.getByText('LinkedIn profile').textContent).not.toContain('Optional');
      expect(screen.getByText('Email address').textContent).not.toContain('Optional');
      expect(screen.getByText('Full name').textContent).not.toContain('Optional');
      expect(screen.getByText('Job search status').textContent).not.toContain('Optional');
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

    /* The mark has to match the rule, and the rule moves with the tick.
       Ticking is what makes the role required (see the schema's note on `role`),
       so the `*` arrives with it and is absent before — a mark on a field the
       form will happily accept empty is the same lie as a missing mark on one it
       won't, told the other way round. */
    it('marks the role row required only once the box is ticked', () => {
      renderModal();

      expect(screen.getByText(/^Current role/).textContent).not.toContain('*');

      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));

      const label = screen.getByText(/^Current role/);
      expect(label.textContent).toContain('*');
      expect(label.textContent).not.toContain('Optional');
    });

    /* The rule behind the mark above, in the state nearly everyone is in. No
       tick, no team, and a blank role — which is not a reason to refuse. The
       profile step they meet when they eventually apply is where an unfinished
       profile gets finished; the door does not hold them for it. */
    it('submits with no role when no PL-team claim is made', async () => {
      renderModal();
      fillRequired();
      fireEvent.change(screen.getByLabelText('Current role'), { target: { value: '   ' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(screen.queryByText('Current role is required')).not.toBeInTheDocument();
      /* Trimmed to empty on the way out, which is what the controller's
         `...(details.role ? …)` guard reads: the wire schema is `min(1)`, so an
         empty string would be rejected by `parse()` where an absent key is
         accepted. */
      expect(baseProps.onSignUp).toHaveBeenCalledWith(expect.objectContaining({ role: '' }));
    });

    /**
     * A role past the wire schema's cap fails as a field error, not as a server one.
     *
     * `jobBoardSignUpInputSchema` caps role at 200 and `signUpToJobBoard` runs
     * `parse()` synchronously, so without a matching yup rule an over-long role
     * throws inside the mutation and returns through the controller's generic
     * catch — "We couldn't create your account just now. Please try again."
     * That message names no field and invites a retry that cannot work.
     *
     * The cap is unconditional, unlike the requirement above it: the input is on
     * screen in both states of the tick, so an over-long value is reachable
     * whether or not a role is being asked for.
     */
    it('refuses a role longer than the wire schema accepts', async () => {
      renderModal();
      fillRequired();
      fireEvent.change(screen.getByLabelText('Current role'), { target: { value: 'a'.repeat(201) } });

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      expect(await screen.findByText('Current role must be 200 characters or fewer')).toBeInTheDocument();
      expect(baseProps.onSignUp).not.toHaveBeenCalled();
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

    /* The role, under the same label, on the ticked side — the other half of the
       tick's rule, and the half the mark is for. A claim about an employer that
       names no role is the half-answer the requirement exists to refuse; see
       `submits with no role when no PL-team claim is made` for the state nearly
       everyone is in. The role is blanked explicitly, since `fillRequired`
       supplies one. */
    it('refuses a PL-team claim with no current role', async () => {
      renderModal();
      fillRequired();
      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));
      fireEvent.change(screen.getByLabelText('PL network team'), { target: { value: 't1' } });
      fireEvent.change(screen.getByLabelText('Current role'), { target: { value: '' } });

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
     * Unticking has to take the team verdict with it.
     *
     * `mode: 'onBlur'` plus a failed submit leaves a live error on `company`, and
     * the rule that produced it is gone the moment the box is cleared. Without
     * the re-run in `toggleOnPlTeam` the message outlives its requirement and
     * the form reads as broken — an error on a field that is no longer even on
     * screen.
     *
     * The sibling below asserts the same of `role`, which the same `trigger` call
     * covers: both rules move with the tick, so both verdicts have to be re-run
     * when it changes.
     */
    it('clears the team error when the claim is withdrawn', async () => {
      renderModal();
      fillRequired();
      const box = screen.getByRole('checkbox', { name: /I work at a PL network startup/i });

      fireEvent.click(box);
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      expect(await screen.findByText('Select your PL network team')).toBeInTheDocument();

      fireEvent.click(box);

      await waitFor(() => expect(screen.queryByText('Select your PL network team')).not.toBeInTheDocument());
    });

    /**
     * ...and the role error has to go with it.
     *
     * The mirror of the test above. Unticking makes a blank role legal again, so
     * an error left on screen would be describing a rule that no longer applies
     * — and the button it appears to block would in fact submit, which is the
     * worst version of a stale verdict.
     */
    it('clears the role error when the claim is withdrawn', async () => {
      renderModal();
      fillRequired();
      fireEvent.change(screen.getByLabelText('Current role'), { target: { value: '' } });
      const box = screen.getByRole('checkbox', { name: /I work at a PL network startup/i });

      fireEvent.click(box);
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      expect(await screen.findByText('Current role is required')).toBeInTheDocument();

      fireEvent.click(box);

      await waitFor(() => expect(screen.queryByText('Current role is required')).not.toBeInTheDocument());
      /* Gone, and gone because the rule is gone — asserted by pressing again
         rather than only by the message, so this cannot pass on a form that is
         still refusing silently. */
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
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
   * This door spent a while not asking it, on the argument that a banner naming
   * no job has nothing waiting on the answer. The design reversed that, and the
   * reversal is what these tests now guard: the answer is part of the *profile*,
   * not of a particular press, so it is collected once at the door rather than
   * owed later at the moment someone is trying to apply.
   *
   * What it does not buy is skipping the apply flow's profile step — that skip
   * was removed on purpose (`useJobApplyFlow`), because the step also asks "I
   * reviewed my profile". It buys a step with nothing blocking on it.
   */
  describe('the job search status', () => {
    it('offers the field, with only the two statuses this door allows', () => {
      renderModal();

      expect(screen.getByRole('radiogroup', { name: 'Job search status' })).toBeInTheDocument();
      expect(screen.getByText('Job search status')).toBeInTheDocument();

      /* Two, not three. `not-looking` is hidden here and on the apply flow's
         step 2 — "don't tell me about roles" is not an answer anyone gives while
         signing up for a job board — but it stays offered on the member
         profile-edit surface, where it is a real thing to want to say. */
      expect(screen.getAllByRole('radio')).toHaveLength(2);
      expect(screen.getByRole('radio', { name: /Actively looking/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Open to the right role/ })).toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: /Not looking/ })).not.toBeInTheDocument();
    });

    /**
     * The privacy pill, beside the label rather than under it.
     *
     * It answers the first question anyone asks of a field about their own job
     * hunt, and it has to be answered next to the question: read as a footnote,
     * it arrives after the decision whether to answer honestly is already made.
     * The apply flow's step 2 puts the same mark on the same question, so a
     * stranger and a member are shown one promise rather than two.
     */
    it('marks the field as private, beside its label', () => {
      renderModal();

      expect(screen.getByText(/Only visible to you/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Used to decide whether to surface your profile to founders who are hiring/i),
      ).toBeInTheDocument();
    });

    /* The rule arrives with the field. A required answer with nothing on screen
       to give it is a Create account button that does nothing and says nothing;
       a field on screen with no rule behind it is a question nobody has to
       answer. This is the third state, and the only correct one. */
    it('holds the form shut until the question is answered', async () => {
      renderModal();
      /* Every other required answer given, so the only thing standing between
         this and a submit is the status — which is what makes the failure below
         attributable to the status gate rather than to whatever else was blank. */
      fillRequiredExceptStatus();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      expect(await screen.findByText('Select where you are with job hunting')).toBeInTheDocument();
      expect(baseProps.onSignUp).not.toHaveBeenCalled();
    });

    /* The chosen answer reaches the caller as itself. `toAccountDetails`
       narrows rather than asserts, and its `null` branch is unreachable from
       both doors now — a fabricated status is a claim about someone's job hunt
       that they never made, and it is the one answer the product later shows
       back to them as theirs. */
    it('reports the status that was chosen', async () => {
      renderModal();
      fillRequired();
      fireEvent.click(screen.getByRole('radio', { name: /Open to the right role/ }));

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ jobSearchStatus: 'open-to-right-role' }),
      );
    });
  });

  describe('submitting', () => {
    /* The shortest journey through this form: every required answer given, the
       PL-team box left alone. `role` used to come through as `''` here, which is
       what "every optional field blank" meant when role was one of them — it is
       required now, so the blank one left is the team. */
    it('submits with the only optional field blank', async () => {
      renderModal();
      fillRequired();

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => expect(baseProps.onSignUp).toHaveBeenCalled());
      expect(baseProps.onSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          linkedin: 'polina-bublii',
          role: 'Protocol Engineer',
          jobSearchStatus: 'actively-looking',
          teamUid: null,
        }),
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
    /* (Three tests stood here, on `SignUpReviewNote` — that the note promised no
       review to an aspirant, named one for a network-team claim, and said either
       way that nothing reaches a hiring team. The modal no longer renders it.) */

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

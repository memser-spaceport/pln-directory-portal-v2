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
 * Fills the five fields the schema actually requires.
 *
 * Role and the status belong in here rather than in the tests that care about
 * them: both gate submission, so leaving either out would turn every
 * `submitting` case below into a test of the gate instead of a test of what it
 * claims to check — green for the wrong reason if the assertion is on `onSignUp`
 * *not* firing, and a confusing failure otherwise.
 *
 * This is the single point the "role is now required on both doors" change lands
 * on. It has eleven call sites; every one of them would otherwise fail, and all
 * of them for the same uninteresting reason.
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
 * It used to set the role too. That moved to `fillRequired` when role stopped
 * being conditional on the tick: leaving it here would have said the tick is
 * what makes a role necessary, which is the exact belief this change removes.
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
     * Nothing on this form is optional, and nothing is marked optional.
     *
     * That is a simpler claim than it used to be: role was the one field that
     * was optional until the tick, so "unmarked" had to be read as a choice
     * rather than an omission. It is required in both states now, so every
     * field here is required and every one carries the mark.
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

    /* The mark has to match the rule, and the rule no longer moves.
       This used to assert the opposite in the unticked state — no `*` until the
       box was ticked — which was right while the requirement itself was
       conditional. Role is required either way now, so a mark that came and went
       would be describing a rule that does not exist. A form refusing to submit
       over a field it never flagged is worse than one with no marking system at
       all, and the unticked state is where nearly everyone meets this row. */
    it('marks the role row required in both states of the tick', () => {
      renderModal();

      expect(screen.getByText(/^Current role/).textContent).toContain('*');

      fireEvent.click(screen.getByRole('checkbox', { name: /I work at a PL network startup/i }));

      const label = screen.getByText(/^Current role/);
      expect(label.textContent).toContain('*');
      expect(label.textContent).not.toContain('Optional');
    });

    /* The rule behind the mark above, on the door where it is new. No tick, no
       team, nothing else missing — just an empty role. */
    it('refuses to submit without a role, with no PL-team claim', async () => {
      renderModal();
      fillRequired();
      fireEvent.change(screen.getByLabelText('Current role'), { target: { value: '   ' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      expect(await screen.findByText('Current role is required')).toBeInTheDocument();
      expect(baseProps.onSignUp).not.toHaveBeenCalled();
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
     * The cap has always been there; it only became reachable from this door
     * when role stopped being optional here, which is why the guard arrives with
     * that change.
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

    /* The role, under the same label, on the ticked side.
       This used to be the *only* place role was required, so it read as the
       other half of the tick's rule. Role is unconditional now — see
       `refuses to submit without a role, with no PL-team claim` for the state
       nearly everyone is in — and this stays because the two inputs share a
       label and a mark, which makes "does the row still guard both halves?" a
       question worth keeping an answer to. The role is blanked explicitly,
       since `fillRequired` supplies one. */
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
     * This used to assert the same of `role`, back when the tick was what made a
     * role required. It isn't any more, so `trigger` was narrowed to `company`
     * alone — and the test narrowed with it. See the sibling below for the other
     * half of that change, which is the more important one: the role error must
     * now *survive* the untick.
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
     * ...and the role error has to outlive it.
     *
     * The mirror of the test above, and the one that would catch a lazy revert.
     * Unticking used to make a blank role legal, so clearing its error was
     * correct. It doesn't any more: the field is still required, still blank,
     * and still the reason the button will not move. An error that vanished here
     * would be the form quietly dropping a rule it is about to enforce again.
     */
    it('keeps the role error when the claim is withdrawn', async () => {
      renderModal();
      fillRequired();
      fireEvent.change(screen.getByLabelText('Current role'), { target: { value: '' } });
      const box = screen.getByRole('checkbox', { name: /I work at a PL network startup/i });

      fireEvent.click(box);
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      expect(await screen.findByText('Current role is required')).toBeInTheDocument();

      fireEvent.click(box);

      /* Still there, and still blocking — asserted by pressing again rather than
         only by the message, so this cannot pass on a stale node. */
      expect(screen.getByText('Current role is required')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      await waitFor(() => expect(screen.getByText('Current role is required')).toBeInTheDocument());
      expect(baseProps.onSignUp).not.toHaveBeenCalled();
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

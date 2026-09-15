'use client';

import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import clsx from 'clsx';

import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { ProfileReadback } from './ProfileReadback';
import type { MemberProfile } from './viewerState';
import { formatRelativeDays } from '@/utils/jobs.utils';

// The flow's shared chrome: the step title and the lede every step opens with.
import fd from './JobApplyFlowDrawer.module.scss';
// The application step's labelled-block idiom, so the two "write to the team"
// steps in this drawer are one shape.
import ap from './JobApplicationPane.module.scss';
import s from './JobInterestPane.module.scss';

import type { OpenInterest } from './openRoles';

const NOTE_MAX = 1000;

interface InterestFormData {
  note: string;
}

interface JobInterestPaneProps {
  teamName: string;
  /** The profile that goes with the signal — quoted above the field, as the
   *  application step quotes it above the note. */
  profile: MemberProfile;
  /** The signal already on record, if there is one — the step is then a
   *  read-back rather than a form. */
  sent?: OpenInterest;
  /** The message, held by the flow drawer so its footer Send can read it and so
   *  stepping back to the profile and returning doesn't cost what was typed. */
  note: string;
  onNoteChange: (value: string) => void;
  /** Steps back to the profile step. Nothing is carried out: the note lives in
   *  the flow drawer, not in this pane. */
  onEditProfile: () => void;
}

/**
 * The open role's step: what a person says to a team that has no posting for
 * them.
 *
 * **This used to be `OpenRoleModal`** — a centred dialog over the board, with
 * the same argument the apply modal once made for itself: no description to
 * read and one text box, so a drawer would be drawing a journey to justify a
 * component. That held while interest was one press. It stopped holding when
 * the route grew a profile review in front of the message — the person sees
 * what the team is about to read, then writes to them — which is the apply
 * flow's own last two steps, and it was crossing two containers to do it: the
 * drawer closed, the modal opened, `Edit profile` tore the modal down and
 * rebuilt the drawer, and the board stashed the half-typed note and the team
 * uid to survive each hop. In one container that round trip is a step change,
 * and nothing unmounts that is holding anything.
 *
 * **One field.** It was two: a required pick from the team's role categories
 * above the message, on the argument that a speculative application with no
 * direction cannot be routed. Cut. Routing is the product's convenience, and it
 * was buying it by making someone answer *what are you looking for?* twice —
 * once in a taxonomy the team maintains, once in their own words.
 *
 * What is left is the only question the profile cannot already answer.
 * Everything a hiring team needs to judge somebody — name, current role,
 * experience, skills, the CV — is on the profile, and the profile goes with the
 * signal. **So the profile is quoted above the field**, the same `ProfileReadback`
 * the application step draws above its note: the two "write to the team" steps
 * send the same two halves, and this one used to *say* so in a sentence with an
 * `Edit profile` link while the other *showed* it. Now both show it, and the
 * block's own `Edit profile` is the way back to the step that owns it.
 *
 * **The field is required.** It was optional, on the argument that the press is
 * the signal; the team wants the words, so Send waits for them.
 *
 * **Reopening shows the answer back, not the form.** The two questions someone
 * has after sending are *what did I say* and *can I take it back*, and neither
 * is answered by an editable copy. The footer holds the withdraw.
 */
export function JobInterestPane(props: JobInterestPaneProps) {
  const { teamName, profile, sent, note, onNoteChange, onEditProfile } = props;

  const methods = useForm<InterestFormData>({
    defaultValues: { note },
    mode: 'onChange',
  });
  const { control } = methods;
  const typed = useWatch({ control, name: 'note' }) ?? '';

  /* Same arrangement as the application pane's letter: the field is RHF-bound,
     the button that sends it is the drawer's footer outside this subtree, and
     the pane unmounts on a step change — so the string lives up in the drawer,
     seeds the field on mount, and every keystroke is reported back. Seeded on
     mount only; reacting to the prop this pane is itself writing would fight
     the person typing. */
  useEffect(() => {
    onNoteChange(typed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);

  if (sent) {
    return (
      <>
        <div className={fd.stepIntro}>
          <h2 className={fd.stepTitle}>Your interest in {teamName}</h2>
          {/* The receipt says the same thing the form promised — the team was
              notified, and your profile went with it — because a confirmation
              that rewords the promise is a second promise to keep in agreement.
              Only the tense and the date differ. */}
          <p className={clsx(fd.lede, s.stepLede)}>
            Sent {formatRelativeDays(sent.sentAt)}. {teamName} has your profile and CV with it.
          </p>
        </div>

        {/* Only when there is something to quote — the whole block goes with an
            empty message rather than a label standing over its own absence. */}
        {sent.note && (
          <div className={s.sentBlock}>
            {/* The label the field carried, in the past tense — so what is
                quoted is plainly the answer to the question that was asked. */}
            <p className={s.sentLabel}>What you told {teamName} you&apos;re interested in</p>
            <p className={s.sentValue}>{sent.note}</p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* The row's own line, with the team named — so arriving here is
          recognised as the thing that was pressed. The team's blurb is not
          rendered (it never was on the modal either); see `OpenRole.blurb`. */}
      <div className={fd.stepIntro}>
        <h2 className={fd.stepTitle}>Didn&apos;t find your role at {teamName}?</h2>
        <p className={clsx(fd.lede, s.stepLede)}>Let {teamName} know what you&apos;re looking for.</p>
      </div>

      <FormProvider {...methods}>
        {/* No <form>: the control that submits this is the drawer's footer
            button, outside this subtree. See the application pane. */}
        <div className={ap.body}>
          <ProfileReadback profile={profile} onEditProfile={onEditProfile} />

          <div className={ap.block}>
            <FormTextArea
              name="note"
              label="Express what you're interested in"
              isRequired
              placeholder={`A few lines on what you'd like to do and why ${teamName}.`}
              rows={8}
              maxLength={NOTE_MAX}
              showCharCount
            />
          </div>
        </div>
      </FormProvider>
    </>
  );
}

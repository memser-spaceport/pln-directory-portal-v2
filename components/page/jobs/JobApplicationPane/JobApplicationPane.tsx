'use client';

import { useEffect, useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import clsx from 'clsx';

import type { IJobRole } from '@/types/jobs.types';
import { isProtocolLabsTeam } from '@/services/jobs/protocol-labs-team';

import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { DetailsSectionGreyContentContainer } from '@/components/common/profile/DetailsSection/components/DetailsSectionGreyContentContainer';
import { Tag } from '@/components/ui/Tag';
import { useMemberExperience, FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import type { IMember } from '@/types/members.types';

// The same two pieces ReferModal uses to draw the hiring team — one source for
// "who is on the other end of this", so the referral modal and the apply modal
// can't end up naming different people. (Prototype-tree import: the same
// existing debt path production ReferRoleRow already takes for ReferModal.)
import { useTeamMembers } from '@/prototypes/entries/job-board/components/ReferModal/hooks/useTeamMembers';
import { MemberAvatar } from '@/prototypes/entries/job-board/components/ReferModal/components/MemberAvatar';
import type { DirectoryMember } from '@/prototypes/entries/job-board/components/ReferModal/types';

// Demo Day's "Make an intro" modal chrome, the same way ReferModal takes it.
import intro from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal/ReferCompanyModal.module.scss';
// The profile step's lede, so steps 2 and 3 open in the same voice and the same
// slot rather than one leading with a sentence and the other with a heading.
import pd from '@/components/page/jobs/JobProfileDrawer/JobProfileDrawer.module.scss';
import s from './JobApplicationPane.module.scss';

// 2000 as a validation target, NOT a maxLength attribute: maxLength silently
// truncates pasted text, so the counter goes negative and validation blocks
// the submit instead.
export const COVER_LETTER_MAX_LENGTH = 2000;

const memberHref = (uid: string): string => `/members/${uid}`;

function LeadNames({ shown, total }: { shown: DirectoryMember[]; total: number }) {
  const extra = Math.max(0, total - shown.length);

  const links = shown.map((member) => (
    <a key={member.uid} className={s.leadLink} href={memberHref(member.uid)} target="_blank" rel="noreferrer">
      {member.name.trim().replace(/\s+/g, ' ')}
    </a>
  ));

  const parts: React.ReactNode[] = [];
  links.forEach((link, i) => {
    if (i > 0) parts.push(extra > 0 || i < links.length - 1 ? ', ' : ' and ');
    parts.push(link);
  });
  if (extra > 0) parts.push(` and ${extra} ${extra === 1 ? 'other' : 'others'}`);

  return <>{parts}</>;
}

/** "March 2021 — Present", off the ISO dates the experience API returns. */
function formatExperienceDates(entry: FormattedMemberExperience): string {
  const pretty = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  const start = pretty(entry.startDate);
  const end = entry.isCurrent ? 'Present' : pretty(entry.endDate);
  return [start, end].filter(Boolean).join(' — ');
}

export interface JobApplicationPaneProps {
  role: IJobRole;
  teamId: string;
  teamName: string;
  /** The member whose profile goes with the application. */
  member: Pick<IMember, 'id' | 'name' | 'role' | 'mainTeam' | 'skills' | 'currentCompany'> | null;
  memberUid: string | undefined;
  /**
   * The letter, owned by the flow rather than by this pane.
   *
   * It has to outlive the pane: stepping back to re-read the posting or to fix
   * the profile unmounts this, and a draft that died on a step change would make
   * the rail a trap. Seeded on mount, reported on every keystroke.
   */
  coverLetter: string;
  onCoverLetterChange: (value: string) => void;
  /** Steps back to the profile — the rail's middle stop, not a modal round trip. */
  onEditProfile: () => void;
  /** The server's refusal, if the last send was refused. Owned by the flow,
   *  because the button that sends is the flow's footer. */
  submitError: string | null;
}

type ApplyFormData = {
  coverLetter: string;
};

/**
 * Step 3: your profile, plus the one thing a profile can't say.
 *
 * **This was a centred modal.** It opened over the drawer that collected the
 * profile it quotes, and `Edit profile` meant tearing this down, rebuilding that
 * drawer, saving, tearing it down and rebuilding this — with the half-written
 * letter shuttled through the board's state to survive the round trip. It is the
 * last stop on a rail now: Edit profile is a step backwards, the letter lives in
 * the flow, and coming back is arriving where you were.
 *
 * What it lost with the chrome: `open`/`onClose`, the mutation, the analytics
 * and the toast. The button that sends is the flow's footer, so everything that
 * happens when it is pressed belongs there too. This collects.
 *
 * `jobSearchStatus` is NEVER rendered here, in any form. It is PL-Team-only by
 * design and does not travel with an application — it is not an oversight and
 * not a missing field; do not "complete" the panel by adding it.
 */
export function JobApplicationPane(props: JobApplicationPaneProps) {
  const { role, teamId, teamName, member, memberUid, coverLetter, onCoverLetterChange, onEditProfile, submitError } =
    props;

  // Protocol Labs applications go to the team job-refer email, not team leads —
  // naming a lead here would be a lie. Skip the lookup too: nothing on this
  // step reads the roster for that team.
  const hideHiringLeads = isProtocolLabsTeam({ uid: teamId, name: teamName });
  const { defaultRecipients } = useTeamMembers(teamName, !hideHiringLeads);
  const leads = hideHiringLeads ? [] : defaultRecipients.slice(0, 3);

  const experienceQuery = useMemberExperience(memberUid ?? '');
  const primary = useMemo(() => {
    const experiences: FormattedMemberExperience[] = Array.isArray(experienceQuery.data) ? experienceQuery.data : [];
    if (!experiences.length) return null;
    return (
      experiences.find((entry) => entry.isCurrent) ??
      [...experiences].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0]
    );
  }, [experienceQuery.data]);

  const methods = useForm<ApplyFormData>({
    defaultValues: { coverLetter },
    mode: 'onChange',
  });
  const { control, reset } = methods;

  const typed = useWatch({ control, name: 'coverLetter' }) ?? '';

  /* Seeded once per mount from the flow's copy. Stepping away and back remounts
     this pane, and the seed is what makes the letter still be there. */
  useEffect(() => {
    reset({ coverLetter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  /* Reported up on every keystroke, because the flow is where it has to live to
     survive this pane unmounting. */
  useEffect(() => {
    onCoverLetterChange(typed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);

  if (!member) return null;

  /* The read-back: the profile's own headline, quoted the way the profile
     displays itself — current role (header precedence), plus the company and
     dates the primary experience entry is the authority for. */
  const roleLine = (member.mainTeam?.role ?? '').trim() || (member.role ?? '').trim();
  /* Same precedence the server uses to compose the application snapshot —
     `currentCompany`, else the main team. A read-back exists to show what is
     being sent, so quoting the experience entry instead (which the server
     never looks at) could name a different company than the email carries. */
  const company = (member.currentCompany ?? '').trim() || (member.mainTeam?.name ?? '').trim();
  const summary = roleLine && company ? `${roleLine} at ${company}` : roleLine || company;
  const skills = (member.skills ?? []).map((skill: { title: string } | string) =>
    typeof skill === 'string' ? skill : skill.title,
  );

  const remaining = COVER_LETTER_MAX_LENGTH - typed.length;
  const overLimit = remaining < 0;

  return (
    /* Plainly a column, not a card. `intro.modal` used to be here — the
       centred dialog shell this was before it became a step — and it brought a
       24px radius, a drop shadow, `margin: auto` and a 440px cap into a 720px
       drawer column, so the letter step rendered visibly narrower than the two
       steps either side of it. Worse, it carried `max-height: 100dvh - 48px`
       with `overflow: hidden`, which is right for a floating dialog that scrolls
       inside itself and wrong here: the drawer is the scroller, so the cap
       clipped the pane's own content and put the bottom of a long letter
       somewhere nothing could reach. */
    <div className={s.pane}>
      {/* One sentence at the top of the step, in the same slot and the same voice
          as the profile step's lede. Names both halves of what is leaving, in
          the order the pane shows them: "they receive your profile and this
          note" is the whole contract.

          **It names the role**, which the modal this replaced didn't have to —
          that card was titled "Apply for <role>" with "<team> receives your
          profile and this note" underneath. Inside the flow the title belongs to
          step 1, and by step 3 the only things on screen are a rail reading
          "Application" and a Back control. Asking someone to write a paragraph
          about a job the screen won't name is the one thing this step cannot
          do. */}
      <p className={pd.lede}>
        Applying to {role.roleTitle} at {teamName} — they receive your profile and this note.
      </p>

      {leads.length > 0 && (
        <p className={s.leads}>
          <span className={s.leadAvatars}>
            {leads.map((lead) => (
              <a
                key={lead.uid}
                className={s.leadAvatarLink}
                href={memberHref(lead.uid)}
                target="_blank"
                rel="noreferrer"
                aria-hidden="true"
                tabIndex={-1}
              >
                <MemberAvatar name={lead.name} image={lead.image} size={24} className={s.leadAvatar} />
              </a>
            ))}
          </span>
          <span>
            Reviewed by <LeadNames shown={leads} total={defaultRecipients.length} />
          </span>
        </p>
      )}

      <FormProvider {...methods}>
        <form className={`${intro.form} ${s.form}`} onSubmit={(e) => e.preventDefault()}>
          <div className={s.body}>
            <div className={s.block}>
              <div className={s.blockLabelRow}>
                <span className={s.blockLabel}>Your profile</span>
                <button type="button" className={s.editLink} onClick={onEditProfile}>
                  Edit profile
                </button>
              </div>

              {/* Grey, not a white card with a border. The step is already a
                  column of white on white — a bordered box inside it reads as a
                  form field rather than as a quotation of something that exists
                  elsewhere. */}
              <DetailsSectionGreyContentContainer className={s.profileCard}>
                <p className={s.profileName}>{member.name}</p>
                <p className={s.profileSummary}>{summary}</p>
                {primary && <p className={s.profileDates}>{formatExperienceDates(primary)}</p>}
                {skills.length > 0 && (
                  <div className={s.skills}>
                    {skills.map((skill: string) => (
                      /* White, because the panel behind it went grey. `Tag`
                         fills from `--tag-color` (slate-100) against a slate-50
                         card, and one step apart is a chip you cannot see. It
                         has to be the `color` prop — the fill is read from the
                         element's own custom property, not inherited. */
                      <Tag
                        key={skill}
                        value={skill}
                        variant="default"
                        color="var(--background-base-white, #fff)"
                        className={s.skillTag}
                      />
                    ))}
                  </div>
                )}
              </DetailsSectionGreyContentContainer>
            </div>

            <div className={s.block}>
              <div className={s.blockLabelRow}>
                <span className={s.blockLabel}>Cover letter (message for the team)</span>
              </div>
              <FormTextArea name="coverLetter" rows={6} placeholder="Why this role, and what you’d bring to it." />
              {/* `1200 / 2000`, which is `FormTextArea`'s own counter format and
                  what the design asks for — "2000 characters left" was this
                  panel inventing a second way to say the same thing.

                  Still hand-rolled rather than `showCharCount`, because that
                  prop only renders alongside a real `maxLength` attribute, and
                  `maxLength` silently truncates pasted text. Someone pasting a
                  2400-character letter should see the count go red and be told
                  to shorten it, not quietly lose 400 characters. Same numbers,
                  no data loss. */}
              <p className={clsx(s.counter, overLimit && s.counterOver)} aria-hidden="true">
                {typed.length} / {COVER_LETTER_MAX_LENGTH}
              </p>
              <p className={s.visuallyHidden} role="status">
                {overLimit
                  ? `Your message is ${-remaining} characters over the ${COVER_LETTER_MAX_LENGTH} character limit.`
                  : ''}
              </p>
            </div>
          </div>

          {/* (A copy of the footer's sentence used to sit here, so the step
              showed "Add what you did in previous roles…" twice — once under the
              field and once in the bar below it. The footer's is the one that
              stays: it sits beside the button it is advice about, and it changes
              with what that button will do. The over-limit case goes with it for
              the same reason — the counter above already turns red, and the
              instruction belongs next to the control it unblocks.) */}

          {submitError && <p className={s.submitError}>{submitError}</p>}
        </form>
      </FormProvider>
    </div>
  );
}

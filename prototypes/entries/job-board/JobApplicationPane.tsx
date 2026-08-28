'use client';

import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';

import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { Tag } from '@/components/ui/Tag';
// Production's grey read-only panel for a block inside a `DetailsSection` — the
// same one `RelationshipDetails` and the team-details read views wear. Imported
// rather than re-tinted by hand: it supplies the fill, the 16px padding and the
// 12px radius, and this pane adds only the flex column. See `.profileCard`.
import { DetailsSectionGreyContentContainer } from '@/components/common/profile/DetailsSection';

// The same two pieces ReferModal uses to draw the hiring team: the production
// member lookup behind the board's team name, and the round avatar its pickers
// render. One source for "who is on the other end of this", so the referral
// modal and the application step can't end up naming different people.
import { useTeamMembers } from './components/ReferModal/hooks/useTeamMembers';
import { MemberAvatar } from './components/ReferModal/components/MemberAvatar';
import type { DirectoryMember } from './components/ReferModal/types';

// The section title every other card in this drawer wears. Imported for its one
// `.title` class so this pane's two block labels are the same object as
// "Your account", "Job search status" and "About the role" rather than a
// same-sized lookalike in a different grey — see the note in the stylesheet.
import dsh from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader/DetailsSectionHeader.module.scss';

import { VIEWER_NAME } from './profile/viewerIdentity';
import { formatExperienceDates, primaryExperience, summariseProfile, type MemberProfile } from './viewerState';
// The flow's one lede idiom — the sentence each step opens with, saying what the
// step is for. Imported rather than restated so the three steps sound like one
// screen.
import pd from './JobApplyFlowDrawer.module.scss';
import s from './JobApplicationPane.module.scss';

// 2000, against ReferModal's 5000. That field carries an intro email someone else
// forwards; this one is the part of an application a hiring team reads first, and
// a box inviting three pages of it does the applicant no favours. Long enough that
// nobody writing honestly hits it.
const COVER_LETTER_MAX_LENGTH = 2000;

/**
 * "Clara Tsao, Hunter Treseder and Marta Belcher" — the faces beside it, said in
 * words.
 *
 * **Full names.** This was first names, on the argument that the line is a
 * greeting and shorter reads warmer. Wrong register: these people are about to
 * read an application, and a surname is what turns a friendly first name into
 * someone you could look up — which is the whole point of naming them at all,
 * since the reason they're here is to make "Filecoin Foundation" concrete. It
 * also removes a real ambiguity on a network this size, where one Clara is not
 * necessarily the Clara.
 *
 * Serial "and" without the Oxford comma, matching the rest of this prototype's
 * prose. Overflow is counted rather than truncated silently — "and 4 others"
 * says the team is bigger, where three names and a full stop would claim it
 * isn't. The count is not a link: it stands for people this pane never named, so
 * there is no one profile for it to open.
 *
 * **Each name opens that member's profile.** Which is the payoff of having
 * spelled the surnames out — a full name is identifying, and the obvious next
 * question after "who will read this" is "who are they", which the directory
 * already answers. Rendering the sentence as JSX rather than returning a string
 * is what that costs.
 */
/** Production's member page. The uids are the directory's own — `useTeamMembers`
 *  resolves the board's team name to a real team and reads its real members — so
 *  these land on actual profiles rather than on a prototype route. */
const memberHref = (uid: string): string => `/members/${uid}`;

function LeadNames({ shown, total }: { shown: DirectoryMember[]; total: number }) {
  const extra = Math.max(0, total - shown.length);

  const links = shown.map((member) => (
    /* New tab. `Edit profile` next door does *not* open one — it steps back to
       the profile step of this same flow, which comes back. A member's profile
       is not part of the flow: it is a detour to somewhere else in the product,
       with nothing to bring back and no reason to end the application to take
       it. So this one leaves the drawer alone, and the half-written letter is
       still there when the tab is closed. */
    <a key={member.uid} className={s.leadLink} href={memberHref(member.uid)} target="_blank" rel="noreferrer">
      {/* Non-breaking space *inside* the name, so a wrap breaks between people
          rather than through one. Left alone, "Marta Belcher" split across the
          wrap and the second line opened on a bare surname — which reads as a
          fourth person for exactly as long as it takes to notice it isn't. The
          separators below are ordinary spaces, so the line keeps plenty of legal
          break points. */}
      {member.name.trim().replace(/\s+/g, '\u00A0')}
    </a>
  ));

  /* "A, B and C" — but "A, B, C and 1 other" once there's a tail, because the
     serial "and" belongs to whatever ends the list, and with an overflow count
     that is the count rather than the last name. */
  const parts: React.ReactNode[] = [];
  links.forEach((link, i) => {
    if (i > 0) parts.push(extra > 0 || i < links.length - 1 ? ', ' : ' and ');
    parts.push(link);
  });
  if (extra > 0) parts.push(` and ${extra} ${extra === 1 ? 'other' : 'others'}`);

  return <>{parts}</>;
}

interface JobApplicationPaneProps {
  role: IJobRole;
  teamName: string;
  /** The profile that gets sent with the application. Always complete when this
   *  step is reachable. */
  profile: MemberProfile;
  /**
   * Who is applying, when that isn't the board's own signed-in viewer.
   *
   * `VIEWER_NAME` is a fixed mock member — right for every signed-in state,
   * wrong for the one person who typed their own name two steps ago. A visitor
   * with no account reaches this pane having filled in an account form, and a
   * read-back that greeted them as somebody else would be quoting an application
   * that isn't theirs.
   */
  applicantName?: string;
  /**
   * What the escape back to step 2 is called.
   *
   * It is "Edit profile" for a member, whose step 2 is their profile. For a
   * visitor with no account that step is called "Your details" — in the rail and
   * on the Back control — so a link still saying "profile" would name something
   * other than where it lands. Same rule those two follow.
   */
  editLabel?: string;
  /** Steps back to the profile step — which, for a profile that was already
   *  finished, is the pre-checked one in the rail. Nothing is carried out: the
   *  letter lives in the flow drawer, not in this pane. */
  onEditProfile: () => void;
  /** What is in the letter, and how to change it. Held by the flow drawer so its
   *  footer Apply can read it, and so stepping back to the profile and returning
   *  doesn't cost what was typed. */
  coverLetter: string;
  onCoverLetterChange: (value: string) => void;
}

type ApplyFormData = {
  coverLetter: string;
};

/**
 * Step 3: your profile, plus the one thing a profile can't say.
 *
 * **This used to be `JobApplyModal`** — a centred dialog that opened over the
 * board once the drawer behind it had closed. It is now the last pane of the one
 * drawer, which is what removes the flow's worst seam. An application used to
 * start in a drawer, leave it for a modal, then tear the modal down and rebuild
 * the drawer if you pressed `Edit profile` — with a half-written letter lifted
 * out through a callback and handed back by the board so it could survive the
 * trip. In one container that round trip is a step change: the rail marks the
 * profile current, the footer offers the way back, and nothing unmounts that is
 * holding anything.
 *
 * **Why there's a letter at all.** The point of the profile gate is that a hiring
 * team receives who you are without you retyping it — so the obvious next move is
 * a single Apply button, and it's the wrong one. A board this size means one
 * person can fire thirteen applications in a minute, all identical, and the teams
 * receiving them learn nothing except that someone clicked thirteen times. The
 * profile is the **reusable** half of an application and the letter is the
 * **per-role** half; making the reusable half free and the per-role half required
 * is what keeps "one-click apply" from meaning "one-click noise". It is also the
 * only friction the person on the other end can actually read: a paragraph naming
 * this role is the cheapest possible proof that someone meant it. Hence required,
 * and hence the flow's Apply button stays dead until it holds non-whitespace.
 *
 * **Why the profile is read-only here, with an Edit escape into step 2.** The
 * block exists because you should see what you are about to send — that is the
 * entire reason applying isn't a button on the row. But showing it and letting it
 * be *retyped inline* are different things. Editing it here would either write to
 * the profile silently from inside a pane about a different subject, or fork a
 * per-application copy — and then two answers to "what do you do" drift apart
 * with no way to tell which one a team received. So: one copy, shown as it will
 * arrive, and `Edit profile` goes to the step that owns it. The read-back is
 * `summariseProfile` — the same sentence the hiring team gets, not a prettier
 * rendering of it, because a read-back that differs from the thing it reads back
 * isn't one.
 *
 * **What the read-back shows, and what it deliberately leaves out.** Since the
 * profile became production's Experience list, "your profile" is potentially a
 * résumé, and a pane about sending one paragraph cannot become one. What is
 * quoted here is identity — the name, the current-role line, its dates, and
 * skills — because that is the part a hiring team reads first and the part
 * someone would want to correct before sending.
 *
 * The name and the role are always there: both are required
 * (`isProfileComplete`), so this panel has no empty state and shouldn't pretend
 * to one. It briefly had an apology — "No experience added yet" — from the window
 * when the role wasn't required and the line was quoted off an optional
 * Experience entry. Quoting the *entry* was the mistake underneath: the profile's
 * own header card leads with `role`, so a read-back sourced from somewhere else
 * could show a different headline than the profile it claims to be reading back.
 * It now reads the role, and the entry supplies only the company and the dates it
 * is the authority for.
 *
 * `profile.bio` is considered and rejected. It is a paragraph, it sits directly
 * above a paragraph the person is being asked to write, and two blocks of prose
 * in one column make the required one look optional — the one thing this pane
 * cannot afford. It still goes with the application; it just isn't quoted here.
 *
 * `profile.jobSearchStatus` is **never rendered in this pane, in any form.** It
 * is private by design (see `JobSearchStatus` in viewerState) and does not travel
 * with an application. The field asks one of two things — searching now, or open
 * to the right conversation — and either, shown on the card that goes to the
 * team being applied to, stops being an answer and becomes a negotiating
 * position. The privacy is what makes it honest. It is not an oversight and it
 * is not a missing field — do not "complete" the panel by adding it.
 *
 * **There is no fourth step confirming the send.** A referral disappears into an
 * inbox, so `ReferModal` has to say it left; an application changes the board —
 * the row behind this flow switches to "Applied" the moment the parent records
 * it, and the flow closes onto it. A confirmation pane would restate what this
 * one already has on screen, and put a "Done" button between the person and the
 * board. The rail's third step is where applying happens, not a stop before it.
 *
 * Mocked end to end: no network, no auth. Both fields are production components.
 */
export function JobApplicationPane(props: JobApplicationPaneProps) {
  const { role, teamName, profile, applicantName, editLabel, onEditProfile, coverLetter, onCoverLetterChange } = props;

  /* Who actually reads this. Same production lookup ReferModal makes — the
     board's team name → the directory team → its members — and the same
     preference for the leads, which is who a hiring team's applications land
     with. This pane is only mounted while its step is showing, so the other two
     steps fire nothing. Empty on error or while loading, and the row simply
     isn't drawn: a name that isn't there yet is worse than no name, and nothing
     below it depends on the answer. */
  const { defaultRecipients } = useTeamMembers(teamName, true);
  const leads = defaultRecipients.slice(0, 3);

  const methods = useForm<ApplyFormData>({
    defaultValues: { coverLetter },
    mode: 'onChange',
  });
  const { control } = methods;

  const typed = useWatch({ control, name: 'coverLetter' }) ?? '';

  /* The field is RHF-bound and the button that sends it lives in the flow
     drawer's footer, outside this subtree — so what is typed has to travel up.
     It also has to survive this pane unmounting, because stepping back to the
     profile and returning must not cost a paragraph. Hence the flow drawer holds
     the string, this pane is seeded from it on mount, and every keystroke is
     reported back.

     Seeded on mount only — `coverLetter` is deliberately out of the deps below,
     since reacting to the prop this pane is itself writing would fight the person
     typing. A letter is written for one role, so a draft abandoned on "Senior
     Protocol Engineer" must not turn up pre-filled under "Developer Relations
     Lead"; the flow drawer clears it when the flow closes, which is the only
     place that rule can be enforced. */
  useEffect(() => {
    onCoverLetterChange(typed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);

  const summary = summariseProfile(profile);
  /* The entry `summary` speaks for — current role, else most recent. Non-null
     whenever this step is reachable (it is gated on a complete profile), but read
     defensively: the prototype's viewer switcher can clear the profile under an
     open flow. */
  const primary = primaryExperience(profile);

  return (
    <>
      {/* One sentence at the top of the step, in the same slot and the same voice
          as the profile step's lede. Names both halves of what is leaving, in the
          order the pane shows them: "they receive your profile and this note" is
          the whole contract.

          **It names the role**, which the modal this replaced didn't have to —
          that card was titled "Apply for <role>" and could say "<team> receives
          your profile and this note" underneath. Inside the flow the title
          belongs to step 1, and by step 3 the only things on screen are a rail
          reading "Application" and a Back control. Asking someone to write a
          paragraph about a job the screen won't name is the one thing this step
          cannot do. */}
      <p className={pd.lede}>
        Applying to {role.roleTitle} at {teamName} — they receive your profile and this note.
      </p>

      {/* And who "the team" actually is. A company name is an abstraction; the two
          or three people whose inbox this lands in are not, and knowing you're
          writing to a named founder rather than to a careers@ address changes what
          gets written — which is the point, since the letter is the only part of
          this application a person composes.

          **One line, not three rows.** This started as a stacked list — face,
          name and role per row — which spent three rows and ~90px restating one
          fact, and made the recipients look like a section of the form rather
          than a note on the sentence above them. A facepile plus a sentence is
          production's own shape for exactly this: the team-details page's
          `TeamFollowBlock` puts three overlapping 28px avatars at the head of a
          line that says who they are, and this is that block's markup and
          stylesheet values, verbatim.

          The faces are `aria-hidden` because the sentence beside them already
          names everyone — a screen reader reading three unlabelled images and
          then the same three names is the same fact twice.

          Leads only, capped at three, with the rest counted. The full team can run
          to dozens; three faces read as people, thirty read as a directory. Same
          rule ReferModal applies when it decides who an intro is addressed to. */}
      {leads.length > 0 && (
        <p className={s.leads}>
          {/* The faces link too, but silently: `aria-hidden` with `tabIndex={-1}`
              is the standard treatment for a link that duplicates the one
              immediately beside it — clickable with a mouse, because a facepile
              that ignores clicks is a facepile that looks broken, and skipped by
              keyboard and screen reader, which already have the named link in the
              sentence. */}
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
        {/* No <form> element. The control that submits this is the flow drawer's
            footer button, which is outside this subtree — a form here would own an
            Enter key it has no submit button for, and swallow it. */}
        <div className={s.body}>
          {/* The read-back: not a summary of the application, the application's
              first half, quoted. */}
          <div className={s.block}>
            <div className={s.blockLabelRow}>
              <span className={dsh.title}>Your profile</span>
              {/* Steps back to the profile and leaves the letter alone.

                  This was a `target="_blank"` link once, then a button that closed
                  a modal and opened a drawer in its place. Both were solving the
                  same problem — the letter must survive — the expensive way. In
                  one drawer it is a step change, and the rail behind it shows
                  where the press goes before it is pressed. */}
              <button type="button" className={s.editLink} onClick={onEditProfile}>
                {editLabel ?? 'Edit profile'}
              </button>
            </div>

            <DetailsSectionGreyContentContainer className={s.profileCard}>
              {/* The name, always. It is the first thing on the profile the hiring
                  team opens and the first thing they read on the application, so a
                  read-back that led with a job title was quoting the second line
                  of what it claims to quote. */}
              <p className={s.profileName}>{applicantName || VIEWER_NAME}</p>

              {/* Then the role line — `role` alone, or "role at company" when an
                  experience entry supplies the company. This panel used to
                  apologise here, which was an empty state for a card that is never
                  empty; see the note at the top of this file. */}
              <p className={s.profileSummary}>{summary}</p>

              {/* The dates of that same entry, one quiet line under it — the
                  experience arrives dated, so a read-back that showed only the
                  title would be quoting an edited version of what is sent.
                  Secondary tone and its own line rather than appended to the
                  summary with a separator: it's provenance for the line above,
                  not a second fact of equal weight. One entry only — the panel is
                  identity, not a work history, and step 2 holds the rest. */}
              {primary && <p className={s.profileDates}>{formatExperienceDates(primary)}</p>}

              {/* Skills only when there are some. Skills are optional, and an empty
                  chip row under the summary would read as something missing rather
                  than something not offered. */}
              {profile.skills.length > 0 && (
                <div className={s.skills}>
                  {profile.skills.map((skill) => (
                    /* Production's DS label chip — no hover, not focusable, which
                       is what a chip that isn't a control looks like everywhere in
                       this product. Its width cap is sized for table cells; see
                       `.skillTag`.

                       **White, because the panel behind it went grey.** `Tag`
                       fills from `var(--tag-color, #f1f5f9)` — slate-100 —
                       against a slate-50 card, and one step apart is a chip you
                       cannot see. The teams prototype hit the identical collision
                       and wrote it down: "a #f1f5f9 fill on a #f9fafb body has
                       almost nowhere to be seen, where the same chip on a white
                       card has a whole step of contrast."

                       It has to be the `color` prop. Setting `--tag-color` on the
                       row above looks equivalent and silently isn't: `Tag`
                       defaults `color` to '#f1f5f9' and writes it as an inline
                       style on every `default` chip, which beats any ancestor
                       declaration. Passing the token/fallback pair as the value
                       keeps the colour layer where the house rules want it — the
                       prop lands as `--tag-color: var(--background-base-white,
                       #fff)` and the chip resolves it. */
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

          {/* Same label idiom as the panel above, so the step reads as two blocks
              of one form rather than a panel and a stray field. */}
          <div className={s.block}>
            {/* **"Cover letter" is gone, label and genre together.**

                It used to read `Cover letter (message for the team)` — the genre
                plus a parenthetical correcting it, which is the shape of a label
                that knows it is wrong. "Cover letter" is what makes people write
                a formal one, and the parenthetical was there to take that back.

                What replaces it is not a shorter label but a different speech
                act: an invitation. It names who is on the other end, offers three
                things worth saying so the box isn't a blank prompt, and says why
                writing it yourself is worth the minutes. That last sentence is
                the only one the interface could not otherwise show.

                The team is named twice on purpose — once as the people, once as
                the thing that might interest you. `teamName` is always set in
                this flow (a role belongs to a team); the fallbacks are for the
                pane's own sake, following the drawer footer's `?? 'The team'`. */}
            <p className={s.blockNote}>
              {teamName
                ? `Start a conversation with the team at ${teamName}.`
                : 'Start a conversation with the hiring team.'}{' '}
              Share something about you, what you&apos;re looking for, or why {teamName || 'the role'} interests you.
              Human-written messages are more likely to get a response.
            </p>
            {/* Empty placeholder, not a shorter one. It read "Why this role, and
                what you'd bring to it" — the same instruction as the sentence
                directly above, in grey, inside the box it describes. Production's
                `FormTextArea` makes `placeholder` required, so the way to have
                none is to pass none rather than to drop the prop. */}
            <FormTextArea
              name="coverLetter"
              rows={6}
              maxLength={COVER_LETTER_MAX_LENGTH}
              showCharCount
              placeholder=""
            />
          </div>
        </div>
      </FormProvider>
    </>
  );
}

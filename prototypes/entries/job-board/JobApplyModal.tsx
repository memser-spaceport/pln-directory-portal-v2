'use client';

import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';

import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { Tag } from '@/components/ui/Tag';

// The same two pieces ReferModal uses to draw the hiring team: the production
// member lookup behind the board's team name, and the round avatar its pickers
// render. One source for "who is on the other end of this", so the referral
// modal and the apply modal can't end up naming different people.
import { useTeamMembers } from './components/ReferModal/hooks/useTeamMembers';
import { MemberAvatar } from './components/ReferModal/components/MemberAvatar';
import type { DirectoryMember } from './components/ReferModal/types';

// Demo Day's "Make an intro" modal chrome, the same way ReferModal takes it:
// 24px card, centred icon / title / desc, twin full-width footer actions. Two
// dialogs on one row that looked like two products would read as two unrelated
// interruptions.
import intro from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal/ReferCompanyModal.module.scss';

import { VIEWER_NAME } from './profile/viewerIdentity';
import { formatExperienceDates, primaryExperience, summariseProfile, type MemberProfile } from './viewerState';
import s from './JobApplyModal.module.scss';

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
 * necessarily the Clara. The line wraps to two at the card's 440px; that is the
 * cost, and it buys identifiability, so `.leads` aligns the faces to the first
 * line rather than floating them between two.
 *
 * Serial "and" without the Oxford comma, matching the rest of this prototype's
 * prose. Overflow is counted rather than truncated silently — "and 4 others"
 * says the team is bigger, where three names and a full stop would claim it
 * isn't. The count is not a link: it stands for people this card never named,
 * so there is no one profile for it to open.
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
    /* New tab. `Edit profile` next door does *not* open one — it closes this
       card and reopens it, because the drawer is part of this flow and comes
       back. A member's profile is not: it's a detour to somewhere else in the
       product, with nothing to bring back and no reason to end the application
       to take it. So this one leaves the page alone, and the half-written letter
       behind the card is still there when the tab is closed. */
    <a key={member.uid} className={s.leadLink} href={memberHref(member.uid)} target="_blank" rel="noreferrer">
      {/* Non-breaking space *inside* the name, so the two lines break between
          people rather than through one. Left alone, "Marta Belcher" split across
          the wrap and the second line opened on a bare surname — which reads as a
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

interface JobApplyModalProps {
  open: boolean;
  onClose: () => void;
  role: IJobRole | null;
  teamName: string;
  /** The profile that gets sent with the application. Always complete when this opens. */
  profile: MemberProfile;
  /** Closes this modal and opens the profile drawer in place. Receives whatever
   *  is currently in the letter so the parent can hand it back on the way in —
   *  editing a profile mid-application must not cost the application. */
  onEditProfile: (coverLetter: string) => void;
  /** What to put in the letter when this opens. Empty for a fresh application;
   *  the preserved draft when the person has just come back from the drawer. */
  initialCoverLetter: string;
  /** Fires on submit with the finished cover letter. The parent records the
   *  application, closes the modal and toasts. */
  onSubmit: (coverLetter: string) => void;
}

type ApplyFormData = {
  coverLetter: string;
};

/**
 * Apply for a role: your profile, plus the one thing a profile can't say.
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
 * and hence the submit button stays dead until it holds non-whitespace.
 *
 * **Why the profile is read-only here, with an Edit escape into the drawer.** The
 * block exists because you should see what you are about to send — that is the
 * entire reason this isn't a button on the row. But showing it and letting it be
 * *retyped inline* are different things. Editing it here would either write to
 * the profile silently from inside a modal about a different subject, or fork a
 * per-application copy — and then two answers to "what do you do" drift apart with
 * no way to tell which one a team received. So: one copy, shown as it will
 * arrive, and `Edit profile` opens the place that owns it: the drawer, on this
 * page, with this modal closed behind it and reopened the moment the drawer
 * saves. The letter survives the trip — it is lifted out through `onEditProfile`
 * and handed back as `initialCoverLetter` — which is what makes the round trip
 * cheap enough to prefer over the second tab this used to open. The read-back is
 * `summariseProfile` — the same sentence the hiring team gets, not a prettier
 * rendering of it, because a read-back that differs from the thing it reads back
 * isn't one.
 *
 * **What the read-back shows, and what it deliberately leaves out.** Since the
 * profile became production's Experience list, "your profile" is potentially a
 * résumé, and a modal about sending one paragraph cannot become one. What is
 * quoted here is identity — the name, the current-role line, its dates, and
 * skills — because that is the part a hiring team reads first and the part
 * someone would want to correct before sending.
 *
 * The name and the role are always there: both are required (`isProfileComplete`),
 * so this panel has no empty state and shouldn't pretend to one. It briefly had
 * an apology — "No experience added yet" — from the window when the role wasn't
 * required and the line was quoted off an optional Experience entry. Quoting the
 * *entry* was the mistake underneath: the profile's own header card leads with
 * `role`, so a read-back sourced from somewhere else could show a different
 * headline than the profile it claims to be reading back. It now reads the role,
 * and the entry supplies only the company and the dates it is the authority for.
 *
 * Dates are in because the entry is dated when it arrives, and a read-back that
 * silently drops a field is showing you a different application from the one
 * you're sending. The rest of the work history is not: the panel answers "is
 * this me?", not "what have I done?", and the drawer is one click away for the
 * latter.
 *
 * `profile.bio` is considered and rejected. It is a paragraph, it sits directly
 * above a paragraph the person is being asked to write, and two blocks of prose
 * in one card make the required one look optional — the one thing this card
 * cannot afford. It still goes with the application; it just isn't quoted here.
 *
 * `profile.jobSearchStatus` is **never rendered in this modal, in any form.** It
 * is private by design (see `JobSearchStatus` in viewerState) and does not travel
 * with an application: "Not looking" is only an honest answer while saying it
 * costs nothing, and showing it on the card that gets sent to a hiring team is
 * exactly the cost that would make it dishonest. It is not an oversight and it is
 * not a missing field — do not "complete" the panel by adding it.
 *
 * **No sent state**, unlike ReferModal. A referral disappears into an inbox, so
 * that modal has to say it left; an application changes the board — the row behind
 * this card switches to "Applied" the moment the parent records it. A confirmation
 * panel would be reporting a fact the person can already see, and would put a
 * "Done" button between them and it. Submit hands the letter over; the parent
 * closes and toasts.
 *
 * Mocked end to end: no network, no auth. The chrome and both fields are
 * production components.
 */
export function JobApplyModal(props: JobApplyModalProps) {
  const { open, onClose, role, teamName, profile, onEditProfile, initialCoverLetter, onSubmit } = props;

  /* Who actually reads this. Same production lookup ReferModal makes — the board's
     team name → the directory team → its members — and the same preference for
     the leads, which is who a hiring team's applications land with. Only while
     the modal is open, so closed cards fire nothing. Empty on error or while
     loading, and the row simply isn't drawn: a name that isn't there yet is worse
     than no name, and nothing below it depends on the answer. */
  const { defaultRecipients } = useTeamMembers(teamName, open);
  const leads = defaultRecipients.slice(0, 3);

  const methods = useForm<ApplyFormData>({
    defaultValues: { coverLetter: '' },
    mode: 'onChange',
  });
  const { control, reset } = methods;

  const coverLetter = useWatch({ control, name: 'coverLetter' }) ?? '';

  /* Seeded from the parent on every open, which is almost always ''.
   *
   * A letter is written for one role, so a draft abandoned on "Senior Protocol
   * Engineer" must not turn up pre-filled under "Developer Relations Lead" — the
   * failure there is sending it without noticing, which is worse than losing it.
   * The parent enforces exactly that: it keeps the draft only for the round trip
   * through the profile drawer and clears it on submit, on cancel, and whenever
   * the drawer is abandoned. So this reads whatever it is handed and does not
   * try to have a memory of its own.
   *
   * `initialCoverLetter` is deliberately out of the deps: it only ever changes
   * while this modal is closed, and reacting to it would let a parent re-render
   * wipe what someone is in the middle of typing. */
  useEffect(() => {
    if (!open) return;
    reset({ coverLetter: initialCoverLetter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  // The parent holds the selected role in state and clears it on close, so it can
  // legitimately be null between opens. Guarded after the hooks, never before.
  if (!role) return null;

  const summary = summariseProfile(profile);
  /* The entry `summary` speaks for — current role, else most recent. Non-null
     whenever this modal is reachable (Apply is gated on at least one entry), but
     read defensively: the parent can be re-rendered with a cleared profile by the
     prototype's viewer switcher while the close animation runs. */
  const primary = primaryExperience(profile);
  const canSend = coverLetter.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSubmit(coverLetter.trim());
  };

  return (
    /* Backdrop click can't close this: there is typing in it. Same reasoning as the
       preferences modal, opposite of the sign-in prompt — work in progress gets
       protected, an uninvited interruption gets every exit. */
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false} lockScroll>
      <div className={`${intro.modal} ${s.modal}`}>
        <button type="button" className={intro.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        {/* No icon above the title.

            The Demo Day chrome opens with a 52px circled glyph, and this card
            wore a document — the thing being sent, against the pencil its
            sibling modals use for editing a profile. It's gone. That masthead is
            built for an announcement, where a centred mark is the first thing
            you meet and the card is three short lines; here it sat on top of a
            form, cost 76px of a card whose submit button has to stay above the
            fold, and said nothing the headline directly under it doesn't say
            better. Once the header went left-aligned it also had nothing to
            centre against, which is what made it visible as decoration.

            The masthead that's left — title and description — is left-aligned
            against the chrome's centred original. See `.headerLeft`: this card
            is a form, and a form has one left edge. */}
        <h2 className={`${intro.title} ${s.headerLeft} ${s.headerTitle}`}>Apply for {role.roleTitle}</h2>

        {/* Names both halves of what is leaving, in the order the card shows them.
            "receives your profile and this note" is the whole contract. */}
        <p className={`${intro.desc} ${s.headerLeft} ${s.headerDesc}`}>
          {teamName} receives your profile and this note.
        </p>

        {/* And who "the team" actually is. A company name is an abstraction; the
            two or three people whose inbox this lands in are not, and knowing
            you're writing to a named founder rather than to a careers@ address
            changes what gets written — which is the point, since the letter is
            the only part of this application a person composes.

            **One line, not three rows.** This started as a stacked list — face,
            name and role per row — which spent three rows and ~90px restating
            one fact, and made the recipients look like a section of the form
            rather than a note on the sentence above them. A facepile plus a
            sentence is production's own shape for exactly this: the team-details
            page's `TeamFollowBlock` puts three overlapping 28px avatars at the
            head of a line that says who they are, and this is that block's
            markup and stylesheet values, verbatim.

            The faces are `aria-hidden` because the sentence beside them already
            names everyone — a screen reader reading three unlabelled images and
            then the same three names is the same fact twice.

            Leads only, capped at three, with the rest counted. The full team can
            run to dozens; three faces read as people, thirty read as a
            directory. Same rule ReferModal applies when it decides who an intro
            is addressed to. */}
        {leads.length > 0 && (
          <p className={s.leads}>
            {/* The faces link too, but silently: `aria-hidden` with `tabIndex={-1}`
                is the standard treatment for a link that duplicates the one
                immediately beside it — clickable with a mouse, because a facepile
                that ignores clicks is a facepile that looks broken, and skipped
                by keyboard and screen reader, which already have the named link
                in the sentence. */}
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
          <form
            className={`${intro.form} ${s.form}`}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className={s.body}>
              {/* The read-back: not a summary of the application, the application's
                  first half, quoted. */}
              <div className={s.block}>
                <div className={s.blockLabelRow}>
                  <span className={s.blockLabel}>Your profile</span>
                  {/* Closes this card and opens the profile drawer in place,
                      then comes back here when the drawer saves.

                      This was a `target="_blank"` link for a while, on the
                      grounds that closing the modal would throw away a
                      half-written cover letter — the one thing on this card that
                      exists nowhere else. That was solving the right problem the
                      expensive way: a second tab makes the person manage two
                      copies of the same page and find their way back, to protect
                      a string we can simply keep. So the letter is lifted to the
                      parent on the way out (`onEditProfile` hands it over) and
                      handed back as `initialCoverLetter` when the modal reopens.
                      One page, and nothing typed is lost.

                      A button again, not an anchor, because it no longer
                      navigates — and without the navigation the leaves-the-page
                      arrow would be announcing something that doesn't happen.
                      Back to ReferModal's plain quiet-link idiom. */}
                  <button type="button" className={s.editLink} onClick={() => onEditProfile(coverLetter)}>
                    Edit profile
                  </button>
                </div>

                <div className={s.profileCard}>
                  {/* The name, always. It is the first thing on the profile the
                      hiring team opens and the first thing they read on the
                      application, so a read-back that led with a job title was
                      quoting the second line of what it claims to quote. */}
                  <p className={s.profileName}>{VIEWER_NAME}</p>

                  {/* Then the role line — `role` alone, or "role at company" when
                      an experience entry supplies the company.

                      This panel used to apologise here: with no experience saved
                      it read "No experience added yet — your application will
                      carry your profile as it stands", which was an empty state
                      for a card that is never empty. The current role is
                      required and the name is always known, so there is always
                      something true and useful to quote. An apology in place of
                      the two facts the hiring team actually reads first told the
                      applicant their application was thin when it wasn't. */}
                  <p className={s.profileSummary}>{summary}</p>

                  {/* The dates of that same entry, one quiet line under it — the
                      experience arrives dated, so a read-back that showed only the
                      title would be quoting an edited version of what is sent.
                      Secondary tone and its own line rather than appended to the
                      summary with a separator: it's provenance for the line above,
                      not a second fact of equal weight. One entry only — the panel
                      is identity, not a work history; the drawer holds the rest. */}
                  {primary && <p className={s.profileDates}>{formatExperienceDates(primary)}</p>}

                  {/* Skills only when there are some. Skills are optional — the
                      only thing the profile requires is one experience entry — and
                      an empty chip row under the summary would read as something
                      missing rather than something not offered. */}
                  {profile.skills.length > 0 && (
                    <div className={s.skills}>
                      {profile.skills.map((skill) => (
                        /* Production's DS label chip — grey, no hover, not
                           focusable, which is what a chip that isn't a control
                           looks like everywhere in this product. Its width cap is
                           sized for table cells; see `.skillTag`. */
                        <Tag key={skill} value={skill} variant="default" className={s.skillTag} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Same label idiom as the panel above, so the card reads as two blocks
                  of one form rather than a panel and a stray field. */}
              <div className={s.block}>
                <div className={s.blockLabelRow}>
                  {/* "Cover letter" alone is a genre, and the genre is what makes
                      people write a formal one. The parenthetical says what it
                      actually is here: a message to the people named at the top
                      of this card. Both halves stay — dropping "cover letter"
                      would lose the one word that says how much to write. */}
                  <span className={s.blockLabel}>Cover letter (message for the team)</span>
                </div>
                <FormTextArea
                  name="coverLetter"
                  rows={6}
                  maxLength={COVER_LETTER_MAX_LENGTH}
                  showCharCount
                  placeholder="Why this role, and what you’d bring to it."
                />
              </div>
            </div>

            {/* Empty: not "why we're asking" but *what to write*. The earlier
                line explained the field's existence — "the only part that isn't
                already on your profile" — which answers a question nobody staring
                at an empty box has. This one hands them a first sentence: the
                thing a hiring team is reading for is what you did before that
                bears on this role. Filled: stops instructing and says where the
                reply goes. */}
            <p className={s.note}>
              {canSend
                ? `${teamName} can reply to you directly.`
                : 'Add what you did in previous roles that makes you a good fit for this one.'}
            </p>

            <div className={intro.actions}>
              <button type="button" className={intro.cancelButton} onClick={onClose}>
                Cancel
              </button>
              {/* "Submit", not "Send application". The card is titled "Apply for
                  <role>" and its first line already says what leaves and who
                  gets it, so a button repeating the noun is the third statement
                  of the same fact and the widest label in the footer. The verb
                  is the only part that was doing any work. */}
              <button type="submit" className={intro.submitButton} disabled={!canSend}>
                Submit
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
}

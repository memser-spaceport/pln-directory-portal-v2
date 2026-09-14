'use client';

import { Tag } from '@/components/ui/Tag';
import { CvAttachmentLine } from '../profile-shared/StoredCv';
// Production's grey read-only panel for a block inside a `DetailsSection` — the
// same one `RelationshipDetails` and the team-details read views wear. Imported
// rather than re-tinted by hand: it supplies the fill, the 16px padding and the
// 12px radius; `.profileCard` adds only the flex column.
import { DetailsSectionGreyContentContainer } from '@/components/common/profile/DetailsSection';
// The section title every other card in this drawer wears — one `.title` class,
// so this block's label is the same object as "Your account" and "About the
// role" rather than a same-sized lookalike in a different grey.
import dsh from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader/DetailsSectionHeader.module.scss';

import { VIEWER_NAME } from './profile/viewerIdentity';
import { formatExperienceDates, primaryExperience, summariseProfile, type MemberProfile } from './viewerState';
// The application step's stylesheet, because this block *is* that step's block:
// it was lifted out of `JobApplicationPane` unchanged when the interest route
// needed it too, and the classes stayed where they were written.
import s from './JobApplicationPane.module.scss';

interface ProfileReadbackProps {
  /** The profile that gets sent. Always complete when either host step is reachable. */
  profile: MemberProfile;
  /** Who is sending, when that isn't the board's own signed-in viewer — see the
   *  application pane's note on `applicantName`. Falls back to the mock member. */
  applicantName?: string;
  /** What the escape back to the profile step is called. "Edit profile" by default. */
  editLabel?: string;
  /** Steps back to the profile step. Nothing is carried out: whatever the host
   *  step collects lives in the flow drawer, not in this block. */
  onEditProfile: () => void;
}

/**
 * The read-back: not a summary of what is being sent, its first half, quoted.
 *
 * **One block, two steps.** It was written for the application step — the
 * profile above the note, because an application is a profile plus a note and
 * the person should see both halves before pressing Apply. The interest route
 * sends exactly the same profile with exactly the same kind of note, and for a
 * while its step said so in a sentence ("We'll notify {team} and share your
 * LabOS profile and CV") with an `Edit profile` link, while the application
 * step *showed* it. Same payload, two different amounts of evidence. Lifting
 * the block here is what lets both steps show the same thing the same way,
 * and means the interest step no longer needs a sentence to stand in for it.
 *
 * What it quotes, and why — the name always, the role line and its dates when
 * there is an entry to quote, the skills when there are any, the CV by name
 * when one is stored — is written beside each line.
 */
export function ProfileReadback({ profile, applicantName, editLabel, onEditProfile }: ProfileReadbackProps) {
  const summary = summariseProfile(profile);
  /* The entry `summary` speaks for — current role, else most recent. Non-null
     whenever a host step is reachable (both are gated on a complete profile),
     but read defensively: the prototype's viewer switcher can clear the profile
     under an open flow. */
  const primary = primaryExperience(profile);

  return (
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
            experience entry supplies the company. Rendered only when there
            is something to quote: the role is optional, so this can be
            empty, and an empty `<p>` here would leave the name and the
            dates 20px further apart with nothing between them. This panel
            used to apologise in that gap instead; see the note at the top
            of this file for why it doesn't. */}
        {summary && <p className={s.profileSummary}>{summary}</p>}

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

        {/* The CV goes with the application, so the read-back quotes it —
            by name, under the skills, in the dates' rank. Nothing when
            there is none: the CV is optional on every surface that offers
            it, and an empty line here would be the read-back apologising
            for a gap that isn't one. See `CvAttachmentLine`. */}
        {profile.cv && <CvAttachmentLine cv={profile.cv} className={s.cvLine} />}
      </DetailsSectionGreyContentContainer>
    </div>
  );
}

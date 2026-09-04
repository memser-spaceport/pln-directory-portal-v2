/**
 * The email a hiring team gets when someone applies.
 *
 * **Why it exists.** The board makes this email three separate promises and has
 * never written it. The apply modal says `{team} receives your profile and this
 * note` and, once the letter has something in it, `{team} can reply to you
 * directly`. The profile drawer's lede says `This is what hiring teams see when
 * you apply`. Everything up to Submit is designed; the thing Submit produces was
 * a blank.
 *
 * **Whose voice.** Nobody's — this is a notification, not a message from a
 * person. That is why there is no sign-off. The spotlight invite ends "Thanks, /
 * {{sender_name}} / Protocol Labs" because a named human is sending it; the
 * Monday digest ends with a footer and no name because the system is. This is
 * the second kind.
 *
 * Template mechanics come from `email-shared/fillTemplate`, which is the invite
 * template's engine with the spotlight-specific half removed — same doubled
 * braces, same Handlebars `{{#if}}` spelling, same drop rule.
 */

import { fillTemplate, firstName, type FilledTemplate } from '../../email-shared/fillTemplate';
import { summariseProfile, type MemberProfile } from '../viewerState';
import { VIEWER_NAME } from '../profile/viewerIdentity';
import type { StoredCv } from '../../profile-shared/StoredCv';

/** Matches the digest's `Protocol Labs Network <digest@protocol.ai>` — one sender
 *  identity, one domain, a different mailbox per kind of mail. */
export const FROM_LINE = 'Protocol Labs Network <jobs@protocol.ai>';

/**
 * Most inbox clients cut the subject around 60 characters. Same budget the
 * Monday digest writes to, and for the same reason: for most recipients the
 * subject is the only part of this they will ever read.
 *
 * **A warning, not a limit — and that is the difference from the digest.** The
 * digest's subject is *written* each week by a human, so 60 is a line they can stay
 * under. This one is generated, and this board already carries role titles that
 * blow it: "Polina Bublii applied for Senior Distributed Systems Engineer" is 61.
 * Truncating it would be worse than exceeding it, so the template is ordered so
 * that going over costs the least — see `SUBJECT_TEMPLATE`.
 */
export const SUBJECT_BUDGET = 60;

/**
 * **The subject names the person, not the event.**
 *
 * "New application received" is what the system did. "Polina Bublii applied for
 * Head of Ecosystem Growth" is what happened, and it is what someone triaging an
 * inbox is scanning for — a name and a role. 44 characters against the Filecoin
 * role; 61 against this board's longest, which is the point of the next
 * paragraph.
 *
 * **Ordered so that overflow is survivable.** The name comes first and the verb
 * second, so a client that cuts at 60 takes characters off the *end of the role
 * title* — "Polina Bublii applied for Senior Distributed Systems Eng…" still
 * says who and roughly what. Any arrangement that led with the role, or put the
 * team in front, would spend the surviving characters on the half the recipient
 * could guess.
 *
 * The team name is deliberately absent for the same reason: a lead reading this
 * is on one team and already knows which, so it would be paying budget for a
 * word that carries nothing.
 */
export const SUBJECT_TEMPLATE = `{{applicant_name}} applied for {{role_title}}`;

/**
 * **The body, and what each part is doing.**
 *
 * - *The identity block is the applicant's own read-back.* `{{applicant_summary}}`
 *   is `summariseProfile()` — the exact sentence they approved in the apply modal
 *   before pressing Submit. Both sides read the same string, so neither can be
 *   surprised by what the other saw. Location and skills sit under it in the same
 *   order the modal's profile card shows them.
 *
 *   All three lines are conditional, and the summary's `{{#if}}` is load-bearing
 *   rather than tidy: the current role stopped being required, so the summary can
 *   be empty — and `fillTemplate` drops any *paragraph* still holding an
 *   unresolved placeholder. Unguarded, one missing role would have taken the
 *   applicant's location and skills out of the email with it, silently, because
 *   they share this paragraph.
 * - *"What they wrote" is unconditional.* The cover letter is required — Submit
 *   stays dead until it holds non-whitespace — so there is no empty-letter branch
 *   to write. This is the whole payoff of requiring it: every one of these emails
 *   contains a paragraph a person wrote for this role.
 * - *The link is the only call to action.* There is no application-review screen
 *   in this product, so a "Review application" button would go nowhere. The
 *   profile page exists, so that is what gets named.
 * - *The last line states a mechanism the product already committed to.* The
 *   apply modal tells the applicant the team can reply directly; this is the
 *   other half of that sentence, and it means the email needs no reply button.
 *
 * **`jobSearchStatus` is not here, in any form, and must never be added.** It is
 * private by design (`JobSearchStatus` in viewerState) and does not travel with
 * an application. The field now offers two answers — searching now, or open to
 * the right conversation — and putting either in front of the team you have
 * just applied to turns it into a bargaining position: one reads as desperate,
 * the other as lukewarm, and neither is a thing anyone would answer honestly
 * once they knew the recipient. The privacy is what makes the answer worth
 * collecting. It is not a missing field.
 */
export const BODY_TEMPLATE = `Hi {{recipient_first_name}},

{{applicant_name}} applied for {{role_title}}.

{{#if applicant_summary}}{{applicant_summary}}{{/if}}
{{#if applicant_location}}{{applicant_location}}{{/if}}
{{#if applicant_skills}}{{applicant_skills}}{{/if}}

What they wrote:

{{cover_letter}}

Their full profile — experience, projects and links:
{{applicant_profile_url}}

{{#if applicant_cv}}Their CV is attached ({{applicant_cv}}).

{{/if}}Reply to this email and it goes straight to {{applicant_first_name}}.`;

/**
 * The footer, in the digest's own shape: why you got this, then how to stop
 * getting it. Not part of `BODY_TEMPLATE` because it is a property of the send
 * rather than of the wording — the same split `SEND_FOOTNOTE` makes on the
 * spotlight invite.
 */
export const FOOTER_REASON = `You're getting this because you're listed as a lead on {{team_name}}.`;

/**
 * The variables, and where each one's value comes from.
 *
 * The `source` strings name the actual surface rather than the field, so the
 * answer to "where does this come from" is on screen rather than in a doc — the
 * same job `TEMPLATE_VARIABLES` does for the spotlight invite.
 */
export const TEMPLATE_VARIABLES: { key: string; source: string }[] = [
  { key: 'recipient_first_name', source: 'the hiring team lead this copy is addressed to' },
  { key: 'applicant_name', source: 'the applicant’s directory name' },
  { key: 'applicant_first_name', source: 'the same name, first word' },
  { key: 'role_title', source: 'the role they pressed Apply on' },
  { key: 'team_name', source: 'the team that posted the role' },
  { key: 'applicant_summary', source: 'their profile’s current-role line, as they approved it (optional)' },
  { key: 'applicant_location', source: 'profile → Location (optional)' },
  { key: 'applicant_skills', source: 'profile → Skills (optional)' },
  { key: 'cover_letter', source: 'the note they wrote for this role' },
  { key: 'applicant_profile_url', source: 'their member page' },
  { key: 'applicant_cv', source: 'the CV on their profile, by file name (optional — the sentence and the attachment go together)' },
];

export interface ApplicationEmailInput {
  /** The lead this copy is addressed to. One email each — see below. */
  recipientName: string;
  roleTitle: string;
  teamName: string;
  profile: MemberProfile;
  coverLetter: string;
  /** The applicant's member page. Empty in the mock until a uid exists. */
  profileUrl: string;
}

export interface ApplicationEmail {
  from: string;
  subject: FilledTemplate;
  body: FilledTemplate;
  footerReason: FilledTemplate;
  /** What an inbox shows under the subject: the first sentence of the body. */
  preview: string;
  /**
   * The CV, as an attachment on the mail — the profile's kept file at the
   * moment of sending, or nothing. A real attachment rather than a link into
   * the directory: a hiring lead forwards applications, and a link needs a
   * login the person it is forwarded to may not have.
   */
  attachment: StoredCv | null;
}

/**
 * Build the email for **one** recipient.
 *
 * One send per lead, each addressed by first name, rather than one email to all
 * of them. `ReferModal`'s `getGreeting` sets the rule this follows — one named
 * person gets a first name, a group gets "Hi {team} team," — and an application
 * is always addressed to individuals, so the first-name branch always applies.
 * It also means a lead can reply without replying to their colleagues.
 */
export function buildApplicationEmail(input: ApplicationEmailInput): ApplicationEmail {
  const { recipientName, roleTitle, teamName, profile, coverLetter, profileUrl } = input;

  const values: Record<string, string> = {
    recipient_first_name: firstName(recipientName),
    applicant_name: VIEWER_NAME,
    applicant_first_name: firstName(VIEWER_NAME),
    role_title: roleTitle,
    team_name: teamName,
    applicant_summary: summariseProfile(profile),
    applicant_location: profile.location.trim(),
    // Middot, the separator this product joins metadata with everywhere else.
    applicant_skills: profile.skills.join(' · '),
    cover_letter: coverLetter.trim(),
    applicant_profile_url: profileUrl,
    applicant_cv: profile.cv?.fileName ?? '',
  };

  const subject = fillTemplate(SUBJECT_TEMPLATE, values, { singleLine: true });
  const body = fillTemplate(BODY_TEMPLATE, values);
  const footerReason = fillTemplate(FOOTER_REASON, values, { singleLine: true });

  /* The inbox preview line. Taken from the body rather than written separately,
     because a preview that says something the email doesn't is the one piece of
     copy nobody can proof-read in place — it only ever appears in someone else's
     mail client. The first paragraph after the greeting is the sentence that
     names the applicant and the role, which is exactly what belongs there. */
  const preview = body.text.split('\n\n')[1] ?? '';

  return { from: FROM_LINE, subject, body, footerReason, preview, attachment: profile.cv };
}

// The invite email the envelope button sends, and the rules for filling it in.
//
// The back-office screenshot describes this email in four bullets but never lets
// anyone see or change it. Making it editable means the wording has to live
// somewhere concrete — here — and has to survive a row whose `templateVars` cell
// reads "no data", which is most of them.
//
// The split that follows from that: SUBJECT and BODY are a starting draft the
// admin can rewrite per participant; the sign-in link, branding, support contact
// and delivery channel are properties of the send, not of the text, so they stay
// fixed and are listed in the modal instead (`ALWAYS_INCLUDED`).
//
// TWO LEVELS OF EDITING, ADDED WITH THE OVERVIEW CARD
// The strings below stopped being the last word and became the *default*. The
// spotlight owns a template (Overview → Email Template, edited once, applies to
// everyone), and each send owns a draft seeded from it (the envelope button,
// edited per participant, thrown away on close). Hence `buildInviteDraft` now
// takes the template rather than reading it off the module, and takes the
// spotlight's live title / support address rather than the frozen constant —
// renaming the spotlight in the Overview has to change the subject line, or the
// card is decoration.

import type { InviteContext, SpotlightParticipant } from './mocks';

/**
 * `{{name}}` rather than the `{name}` some mail tools use: doubled braces can't
 * collide with a JSON snippet someone pastes into the body.
 */
const PLACEHOLDER = /\{\{(\w+)\}\}/g;
/** Same pattern, un-global: `.test()` on a /g regex carries `lastIndex` between calls. */
const HAS_PLACEHOLDER = /\{\{\w+\}\}/;

// ── The default template ──────────────────────────────────────────────────────
// Transcribed from the email PL actually sends, not written here. Every sentence
// below is theirs, in their order and their punctuation; the only edits are the
// six places a literal became a variable, plus the two noted after this block.
//
// WHAT THE REAL EMAIL TAUGHT, AND WHAT CHANGED BECAUSE OF IT
//  - The record is a COMPANY, not an event. The real mail says "the Devonian
//    Systems Spotlight page", names the company again in the description, and a
//    third time as the link's label. So `{{spotlight_title}}` and `{{team_name}}`
//    — two invented variables for one real thing — collapse into
//    `{{company_name}}`, used three times.
//  - There is a DEADLINE, and it does the persuading. "…closes this coming
//    Monday, July 27th" is the first line of the body. Nothing in the
//    back-office screenshot held a close date, so the Overview grew one.
//  - The sign-off is a PERSON. "Thanks, / Remi Antczak / Protocol Labs" — which
//    is exactly what the Overview's Sender Name field is for, so
//    `{{sender_name}}` reads from it and "Protocol Labs" stays fixed beneath.
//  - The link is the point, and it is dangerous. It gets its own labelled line,
//    is minted per recipient, and carries a do-not-share paragraph. So it stops
//    being an invisible thing the send appends and becomes `{{spotlight_link}}`,
//    a variable you can place — while its VALUE stays un-editable.
//  - `{{support_email}}` is gone. The real mail never prints an address; it says
//    "reply here" four times over. Reply-To is the mechanism, so the Overview
//    field stays and the template stops naming it.
//
// TWO DELIBERATE DEPARTURES FROM THE MAIL AS GIVEN
//  1. The opening drops "This is a final reminder that…". What PL supplied is a
//     FOLLOW-UP; this is the template behind the envelope button, which is
//     Send Invite. Everything after that first line works unchanged for both —
//     see the note under BODY_TEMPLATE about the follow-up needing its own.
//  2. One paragraph is added: "We flagged this one for you because you back
//     {{sector_hook}}." It is the only optional line in the mail, and it is not
//     an invention — it is the answer to the real email's own closing question
//     ("let me know what kinds of companies you're looking for, so we can
//     prioritize better for you"). That answer lands in the table's Template
//     vars column, which is why 8 of 18 rows have none yet. Rows without it
//     receive the real email verbatim; rows with it receive the real email plus
//     one sentence.

export const SUBJECT_TEMPLATE = `{{company_name}} — PL Spotlight, open until {{close_date}}`;

export const BODY_TEMPLATE = `Hi {{first_name}},

The {{company_name}} Spotlight page is open until {{close_date}}.

PL Spotlight connects a select few companies in the Protocol Labs network with investors who may be a fit, like you.

We flagged this one for you because you back {{sector_hook}}.

{{company_name}} {{company_blurb}}. Their Spotlight page has a summary slide, founder bios, the deck, and a video pitch — everything you need for a first look.

Your personal access link:
{{spotlight_link}}

To request intro: open the page and click the connect button, or just reply here and I'll connect you.

Please don't share the link above, as it is your personal, one-click-entry link to confidential materials. Just reply to this email and let me know who you'd like me to send one to.

If you have any questions or feedback, let me know. If you're not interested in this one, let me know what kinds of companies you're looking for, so we can prioritize better for you.

Thanks,
{{sender_name}}
Protocol Labs`;

/**
 * What the send adds on its own, whatever the admin types.
 *
 * The back-office sheet lists this as four bullets, and has to: the email is
 * invisible there, so the bullets *are* the description of it. Here the text is
 * on screen and editable, so the same facts shrink to one caption — a list of
 * four would outweigh the thing it annotates. The support address is dropped
 * from it too, because the body already names it.
 */
export const SEND_FOOTNOTE =
  'Added automatically: Protocol Labs branding, and the reply-to address set on this spotlight. {{spotlight_link}} is minted per recipient — one-click entry tied to their email address, which is why the template tells them not to forward it.';

/** The editable pair. Everything else about the send is fixed — see above. */
export type InviteTemplate = {
  subject: string;
  body: string;
};

export const DEFAULT_INVITE_TEMPLATE: InviteTemplate = {
  subject: SUBJECT_TEMPLATE,
  body: BODY_TEMPLATE,
};

/**
 * The variables the template may use, and where each one's value comes from.
 *
 * This list is the reason the template editor exists as a modal rather than as
 * one more text field in the Overview grid: nobody types `{{sector_hook}}`
 * correctly from memory, and nothing on the table screen says that
 * `{{spotlight_title}}` is the Title field two rows above it. The `source`
 * strings name the actual surface, so the answer is on screen rather than in a
 * doc — they reach the editor as each chip's hover title, and the two that point
 * back at the Overview are spelled out in the note beneath the chips.
 */
export const TEMPLATE_VARIABLES: { key: string; source: string }[] = [
  { key: 'first_name', source: 'the participant’s name' },
  { key: 'company_name', source: 'the company this spotlight is for' },
  { key: 'company_blurb', source: 'the company’s one-line description' },
  { key: 'close_date', source: 'Overview → Closes' },
  { key: 'spotlight_link', source: 'minted per recipient at send' },
  { key: 'sender_name', source: 'Overview → Sender Name' },
  { key: 'sector_hook', source: 'the row’s Template vars' },
];

export function isDefaultTemplate(template: InviteTemplate): boolean {
  return template.subject === DEFAULT_INVITE_TEMPLATE.subject && template.body === DEFAULT_INVITE_TEMPLATE.body;
}

export type InviteDraft = {
  subject: string;
  body: string;
  /**
   * Placeholder → value, but *only* for the ones that came out of the row's
   * `templateVars` cell. `first_name` and the three spotlight constants are
   * filled in too, and reporting them would bury the one line that carries
   * information: the admin can read "Hi Björn" for themselves, but has no way
   * to know what the JSON in that column resolved to.
   */
  fromRow: Record<string, string>;
  /** Placeholders this row has no value for; their paragraph is dropped. */
  missing: string[];
};

/**
 * `templateVars` is a raw JSON string in the table, and the cell can read
 * "no data" — so a bad parse is an ordinary case, not an error to surface.
 */
function parseTemplateVars(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
    );
  } catch {
    return {};
  }
}

/**
 * Build the draft for one row.
 *
 * The judgement call: half the rows have no `sector_hook`, and a mail merge that
 * ships "you back {{sector_hook}}" is worse than one that says nothing. So a
 * paragraph holding an unfilled placeholder is *dropped whole* — the email stays
 * sendable as-is, one sentence shorter, and the modal says which line went. That
 * only works because every placeholder-bearing paragraph is optional by
 * construction; the ones that carry the actual invite use fields every row has.
 */
export function buildInviteDraft(
  row: SpotlightParticipant,
  template: InviteTemplate = DEFAULT_INVITE_TEMPLATE,
  // Required, not defaulted: `closeDate` and `senderName` are live Overview state,
  // so there is no module constant that could stand in for a real context.
  context: InviteContext,
): InviteDraft {
  const rowVars = parseTemplateVars(row.templateVars);
  const values: Record<string, string> = {
    first_name: row.name.split(' ')[0],
    company_name: context.companyName,
    company_blurb: context.companyBlurb,
    close_date: context.closeDate,
    // The label the real email gives the link, not a URL: the address itself is
    // minted per recipient at send and is not something a template can show.
    spotlight_link: `${context.companyName} — PL Spotlight`,
    // '' rather than a fallback name, so an unset Sender Name behaves like every
    // other unfilled variable — the sign-off paragraph drops and the modal says
    // so, instead of a stranger's name appearing under someone else's email.
    sender_name: context.senderName ?? '',
    ...rowVars,
  };

  const fromRow: Record<string, string> = {};
  const missing: string[] = [];

  const fill = (text: string) =>
    text.replace(PLACEHOLDER, (match, key: string) => {
      const value = values[key];
      if (value === undefined || value === '') {
        if (!missing.includes(key)) missing.push(key);
        return match;
      }
      if (key in rowVars) fromRow[key] = value;
      return value;
    });

  const body = template.body
    .split('\n\n')
    .map(fill)
    .filter((paragraph) => !HAS_PLACEHOLDER.test(paragraph))
    .join('\n\n');

  return { subject: fill(template.subject), body, fromRow, missing };
}

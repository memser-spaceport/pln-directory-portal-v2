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

/**
 * The innermost `{{#if key}}…{{/if}}` block, so a nested one resolves before the
 * block that contains it. `(?!\{\{#if\s)` is what makes it innermost: the body
 * may contain anything except another opening tag.
 *
 * Deliberately Handlebars' own spelling — `{{#if}}` / `{{else}}` / `{{/if}}` —
 * rather than a shorter invention. Whoever ends up wiring this to a real mailer
 * will reach for Handlebars, and a template written here should survive the trip
 * without a find-and-replace.
 */
const IF_BLOCK = /\{\{#if\s+(\w+)\}\}((?:(?!\{\{#if\s)[\s\S])*?)\{\{\/if\}\}/;
const ELSE_TAG = /\{\{else\}\}/;
/** Only truthiness of a variable is supported — no operators, no comparisons. See NOTE below. */
const IF_OPEN = /\{\{#if\s+\w*\s*\}\}/g;
const IF_CLOSE = /\{\{\/if\}\}/g;

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

// ── The conditional template ──────────────────────────────────────────────────
// The same email, with its two optional passages written out instead of left to
// the drop rule.
//
// WHY IT EXISTS AS A SECOND OPTION RATHER THAN A REPLACEMENT
// The drop rule (see `buildInviteDraft`) is a good default and a bad ceiling. It
// can only ever do one thing to a paragraph whose variable is empty — delete it —
// so the 8 rows with no `sector_hook` get an email with a hole where the reason
// they were picked should be. `{{#if}}` is the same automation with the other
// branch exposed: the author writes what those 8 rows read instead. Neither is
// strictly better, which is why the editor offers both rather than migrating.
//
// The two conditionals below are the two shapes worth showing:
//  - `sector_hook` uses `{{else}}` — a real alternative sentence, not a deletion.
//  - `sender_name` has no `{{else}}` — dropping is still right when there is no
//    honest substitute for a person's name, but now the template SAYS so.
export const CONDITIONAL_SUBJECT_TEMPLATE = SUBJECT_TEMPLATE;

export const CONDITIONAL_BODY_TEMPLATE = `Hi {{first_name}},

The {{company_name}} Spotlight page is open until {{close_date}}.

PL Spotlight connects a select few companies in the Protocol Labs network with investors who may be a fit, like you.

{{#if sector_hook}}We flagged this one for you because you back {{sector_hook}}.{{else}}We flagged this one for you because it looks close to the stage and sector you invest at.{{/if}}

{{company_name}} {{company_blurb}}. Their Spotlight page has a summary slide, founder bios, the deck, and a video pitch — everything you need for a first look.

Your personal access link:
{{spotlight_link}}

To request intro: open the page and click the connect button, or just reply here and I'll connect you.

Please don't share the link above, as it is your personal, one-click-entry link to confidential materials. Just reply to this email and let me know who you'd like me to send one to.

If you have any questions or feedback, let me know. If you're not interested in this one, let me know what kinds of companies you're looking for, so we can prioritize better for you.

Thanks,
{{#if sender_name}}{{sender_name}}
{{/if}}Protocol Labs`;

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

/**
 * The shipped template, written with its conditionals explicit.
 *
 * The drop rule below has NOT gone away — it still catches any variable nobody
 * wrapped — but it stopped being something the author picks. It is the safety
 * net under the template, not one of two ways to write one.
 *
 * Since Settings → Email templates exists, this is no longer what any surface
 * edits: it is the text the SETTINGS entry starts as, and the thing its "Reset to
 * original" returns to. A spotlight resets to the Settings wording instead — see
 * emailTemplateLibrary.ts.
 */
export const DEFAULT_INVITE_TEMPLATE: InviteTemplate = {
  subject: CONDITIONAL_SUBJECT_TEMPLATE,
  body: CONDITIONAL_BODY_TEMPLATE,
};

/** The plain-text variant, kept only as the thing the drop rule is documented against. */
export const PLAIN_INVITE_TEMPLATE: InviteTemplate = {
  subject: SUBJECT_TEMPLATE,
  body: BODY_TEMPLATE,
};

/** The block the editor's `{{#if}}` chip inserts, as a function of the selected text. */
export function conditionalSnippet(key: string, selected = ''): string {
  const then = selected.trim() || `…text when {{${key}}} is set…`;
  return `{{#if ${key}}}${then}{{else}}…text when it is not…{{/if}}`;
}

// ── The template as a list of rules ───────────────────────────────────────────
//
// The editor offers two ways to write the same conditional: type it inline, or
// fill in labelled Then / Otherwise fields. Those are two VIEWS, not two drafts
// — both read and write the one template string, which is why switching tabs
// costs nothing and the two can never disagree.
//
// Everything below is the bridge: read the `{{#if}}` blocks out of a body, and
// write an edited one back into the exact span it came from.

export type DynamicRule = {
  /** Position in the body, and the identity the panel keys its cards on. */
  index: number;
  start: number;
  end: number;
  /** The variable being tested. Truthiness only — see `resolveConditionals`. */
  key: string;
  then: string;
  otherwise: string;
};

/** Global twin of IF_BLOCK, for walking every block in one pass. */
const IF_BLOCK_ALL = new RegExp(IF_BLOCK.source, 'g');

export function parseDynamicRules(body: string): DynamicRule[] {
  const rules: DynamicRule[] = [];
  IF_BLOCK_ALL.lastIndex = 0;
  let match = IF_BLOCK_ALL.exec(body);
  while (match) {
    const [block, key, inner] = match;
    const [then, otherwise = ''] = inner.split(ELSE_TAG);
    rules.push({
      index: rules.length,
      start: match.index,
      end: match.index + block.length,
      key,
      then,
      otherwise,
    });
    match = IF_BLOCK_ALL.exec(body);
  }
  return rules;
}

function serialiseRule(rule: Pick<DynamicRule, 'key' | 'then' | 'otherwise'>): string {
  // No `{{else}}` when there is nothing to put in it: an empty else branch and
  // an absent one behave identically at send, and the shorter form is the one a
  // human would have typed.
  return rule.otherwise
    ? `{{#if ${rule.key}}}${rule.then}{{else}}${rule.otherwise}{{/if}}`
    : `{{#if ${rule.key}}}${rule.then}{{/if}}`;
}

/** Replace one block in place, leaving every character around it untouched. */
export function applyDynamicRule(body: string, rule: DynamicRule, patch: Partial<DynamicRule>): string {
  return body.slice(0, rule.start) + serialiseRule({ ...rule, ...patch }) + body.slice(rule.end);
}

/** Delete the whole block, both branches — the trash icon on the rule row. */
export function removeDynamicRule(body: string, rule: DynamicRule): string {
  return (body.slice(0, rule.start) + body.slice(rule.end)).replace(/\n{3,}/g, '\n\n');
}

/**
 * Append a new block as its own paragraph.
 *
 * At the END rather than at some guessed insertion point: there is no caret on
 * this tab to aim at, and a rule that lands mid-sentence would be worse than one
 * the author has to drag into place. The panel says where it went.
 */
export function appendDynamicRule(body: string, key: string): string {
  return `${body.trimEnd()}\n\n${serialiseRule({
    key,
    then: `…text when {{${key}}} is set…`,
    otherwise: '…text when it is not…',
  })}`;
}

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

/**
 * Whether two templates say the same thing — drives the editor's reset link and
 * the "is this still the default" question in two places.
 *
 * It used to be `isStartingTemplate(t)`, comparing against the module constant,
 * which was right while there was exactly one template in the world. There are
 * now two levels of it (Settings holds the default, a spotlight can hold its own
 * copy — see emailTemplateLibrary.ts), so what a draft is measured against is a
 * property of the surface doing the measuring, not of this module.
 */
export function templatesMatch(a: InviteTemplate, b: InviteTemplate): boolean {
  return a.subject === b.subject && a.body === b.body;
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
  /**
   * Every `{{#if}}` the template holds and which way it went for this row.
   *
   * Reported even when it went the obvious way. The preview shows one specimen,
   * so a branch that did not run leaves no trace in the rendered email — without
   * this the reader cannot tell a sentence that was chosen from one that was
   * never conditional at all.
   */
  conditionals: { key: string; taken: 'then' | 'else' }[];
  /** Set when `{{#if}}` and `{{/if}}` don't balance; the body is passed through untouched. */
  syntaxError: string | null;
};

/**
 * Resolve every `{{#if key}}…{{else}}…{{/if}}` against the values already
 * gathered for this row — the same map, at the same moment, as the plain
 * variables. That is the whole point of the second style: a conditional is not a
 * new authoring surface with its own data, it is the existing substitution with
 * its false branch made writable.
 *
 * Innermost-first, looping until the text stops changing, so nesting works
 * without recursion. Truthiness is "the variable has a non-empty value" —
 * matching the drop rule's own test exactly, so the two styles never disagree
 * about whether a row "has" a variable.
 *
 * NOTE: no `{{#unless}}`, no `{{#if a b}}`, no comparisons. Handlebars has all
 * three and a mail template does not need them; the moment one appears, this
 * silently-truthy resolver is the wrong tool and a real Handlebars runtime is
 * the right one.
 */
function resolveConditionals(
  text: string,
  values: Record<string, string>,
): { text: string; branches: { key: string; taken: 'then' | 'else' }[]; error: string | null } {
  const opens = text.match(IF_OPEN)?.length ?? 0;
  const closes = text.match(IF_CLOSE)?.length ?? 0;
  if (opens !== closes) {
    return {
      text,
      branches: [],
      // Named in the template's own tokens, since that is what the author has to
      // go and fix. Counting both sides is more useful than "unbalanced".
      error: `${opens} {{#if}} and ${closes} {{/if}} — every {{#if}} needs its own {{/if}}.`,
    };
  }

  const branches: { key: string; taken: 'then' | 'else' }[] = [];
  let output = text;
  let match = IF_BLOCK.exec(output);

  while (match) {
    const [block, key, inner] = match;
    const [thenBranch, elseBranch = ''] = inner.split(ELSE_TAG);
    const value = values[key];
    const taken = value === undefined || value === '' ? 'else' : 'then';
    branches.push({ key, taken });
    output = output.replace(block, taken === 'then' ? thenBranch : elseBranch);
    match = IF_BLOCK.exec(output);
  }

  // A dropped branch can leave the blank line that separated it from its
  // neighbours, which would read as a deliberate gap in the email.
  return { text: output.replace(/\n{3,}/g, '\n\n').trim(), branches, error: null };
}

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

  // Conditionals first, so a variable that only ever appears inside a branch the
  // row didn't take is never reported missing — the author already said what
  // happens in that case, and a "left out" note would contradict the email.
  const resolvedSubject = resolveConditionals(template.subject, values);
  const resolvedBody = resolveConditionals(template.body, values);
  const conditionals = [...resolvedSubject.branches, ...resolvedBody.branches];
  const syntaxError = resolvedSubject.error ?? resolvedBody.error;

  const body = resolvedBody.text
    .split('\n\n')
    .map(fill)
    .filter((paragraph) => !HAS_PLACEHOLDER.test(paragraph))
    .join('\n\n');

  return { subject: fill(resolvedSubject.text), body, fromRow, missing, conditionals, syntaxError };
}

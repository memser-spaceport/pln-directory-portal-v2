// Back Office → Settings → Email templates: the library the list page renders.
//
// WHY THIS IS A SEPARATE FILE FROM inviteTemplate.ts
// That file holds ONE email and the machinery that fills it in — placeholders,
// conditionals, the drop rule. This one holds the *catalogue*: which templates
// the back office keeps, what each is for, where it is sent from, and what it
// said when it shipped. Nothing here parses or resolves anything.
//
// ── THE SPLIT THIS INTRODUCES ─────────────────────────────────────────────────
// The spotlight's template stopped being "the template" and became an OVERRIDE.
// There are two objects now where there was one:
//
//   · the SETTINGS template — owned by this list, the wording every spotlight's
//     invite starts from;
//   · the SPOTLIGHT override — owned by the Overview card, a copy one spotlight
//     keeps for itself.
//
// They are separate because they answer different questions. "What does a PL
// Spotlight invite say" is an org decision, made once, and belongs where the org
// is configured. "What does the Devonian Systems invite say" is this deal's
// decision — the sector hook, the pitch, the deadline — and belongs on the
// record. Collapsing them would mean either editing the org copy to fix one
// spotlight, or having no org copy at all and rewriting the whole email per
// spotlight from a module constant nobody can see.
//
// Three consequences, all of them load-bearing and all of them wired up:
//  1. `Reset to default` in the spotlight editor resets to the SETTINGS text, not
//     to the shipped constant. Otherwise editing the default here would leave
//     every spotlight silently pinned to the old wording.
//  2. Saving a spotlight template that MATCHES the settings default clears the
//     override rather than storing an identical copy — so a spotlight can get
//     back on the default without a "revert" button, and the list's override
//     count stays true.
//  3. The list has to show overrides from the default's side ("1 override:
//     Devonian Systems Spotlight"), because the one thing an admin cannot see
//     from Settings is which records have stopped listening to it.
//
// ── WHAT IS INVENTED, AND WHAT IS NOT ─────────────────────────────────────────
// The Figma file (r1B2INuN2xKR31z9oDQWWt) has no Settings screen and no template
// list, so the page and this catalogue are a placement proposal — see the note in
// SettingsEmailTemplates.tsx for what that means for the IA.
//
// The two ENTRIES, though, are not invented:
//  - The invite is the mail PL actually sends, transcribed in inviteTemplate.ts.
//  - The follow-up is the mail PL actually sends TOO. What was supplied for the
//    invite was a follow-up ("This is a final reminder that…"), and that file's
//    note says so and says the follow-up needs its own template. The table's
//    Reply button already counts follow-ups it has no wording for. So this row is
//    a gap the code documented, not a row added to make a list look like a list.
//
// A real back office would list member invites, team approvals and gathering
// invites here as well, and the page is built to take them (one flat list, the
// surface named in its own column). They are left out rather than mocked: no
// screen in this prototype sends them, so the rows would open an editor over
// copy nobody wrote, which is worse than an honest two-row list.

import type { InviteTemplate } from './inviteTemplate';
import { DEFAULT_INVITE_TEMPLATE } from './inviteTemplate';

/** Stable ids, because the override map and the editor both key off them. */
export type EmailTemplateId = 'spotlight-invite' | 'spotlight-follow-up';

// ── The follow-up ─────────────────────────────────────────────────────────────
// Deliberately SHORTER than the invite rather than a copy of it with one line
// changed. A follow-up lands in a thread the recipient has already ignored once;
// re-sending the full pitch says the sender was not paying attention. So it keeps
// the four things a reminder needs — the deadline, what is behind the link, the
// link, and the reply door — and drops the description of what PL Spotlight is.
//
// It reuses the invite's variables exactly (nothing new to learn, nothing new to
// fill in) and keeps the `{{#if sender_name}}` sign-off, so an unset Sender Name
// behaves the same in both mails.
export const FOLLOWUP_SUBJECT_TEMPLATE = `Closing {{close_date}} — {{company_name}} PL Spotlight`;

export const FOLLOWUP_BODY_TEMPLATE = `Hi {{first_name}},

This is a final reminder that the {{company_name}} Spotlight page closes {{close_date}}.

{{#if sector_hook}}We flagged this one for you because you back {{sector_hook}}.{{else}}It looks close to the stage and sector you invest at.{{/if}}

Your personal access link:
{{spotlight_link}}

The page has a summary slide, founder bios, the deck and a video pitch. If you'd like an intro, open it and click the connect button, or just reply here.

If this one isn't for you, let me know what kinds of companies you're looking for, so we can prioritize better for you.

Thanks,
{{#if sender_name}}{{sender_name}}
{{/if}}Protocol Labs`;

export const DEFAULT_FOLLOWUP_TEMPLATE: InviteTemplate = {
  subject: FOLLOWUP_SUBJECT_TEMPLATE,
  body: FOLLOWUP_BODY_TEMPLATE,
};

// ── The catalogue ─────────────────────────────────────────────────────────────

export type EmailTemplateEntry = {
  id: EmailTemplateId;
  /** The list's first column. Named for the mail, not for the code. */
  name: string;
  /** One line under the name — what the mail is for, never how it works. */
  purpose: string;
  /** Where it goes out from, in the back office's own words. */
  sentFrom: string;
  /**
   * Who this wording currently reaches, as the list's resting badge.
   *
   * Named per entry rather than printed as a generic "Everywhere", which read on
   * screen as "everywhere in the app" sitting next to a Sent from column that
   * said PL Spotlight. It is also what makes the column survive the templates
   * this list does not have yet: a member invite's badge says All members, and
   * nothing has to be taught that spotlights are the only scope there is.
   */
  appliesTo: string;
  /**
   * The wording as shipped. `Reset to original` in the Settings editor returns
   * here, which is why the shipped text has to survive being edited — the state
   * below holds the current text, this holds the one it started as.
   */
  shipped: InviteTemplate;
  /**
   * Where a record can keep its own copy, if anywhere. Absent ⇒ one wording for
   * everyone, and the list says nothing about overrides on that row rather than
   * claiming a rule ("cannot be overridden") that is really just this
   * prototype's reach.
   */
  overrideSurface?: string;
  /** Mock: there is no history in a prototype, and an empty column reads as broken. */
  lastEdited: string;
};

export const EMAIL_TEMPLATES: EmailTemplateEntry[] = [
  {
    id: 'spotlight-invite',
    name: 'Spotlight investor invite',
    purpose: 'First send to an investor on a spotlight’s participant list.',
    sentFrom: 'PL Spotlight → participants table',
    appliesTo: 'All spotlights',
    shipped: DEFAULT_INVITE_TEMPLATE,
    overrideSurface: 'a spotlight’s Overview card',
    // Both dates sit before SPOTLIGHT_TODAY (Aug 10, 2026) — see mocks.ts.
    lastEdited: 'Aug 4, 2026',
  },
  {
    id: 'spotlight-follow-up',
    name: 'Spotlight follow-up',
    purpose: 'Reminder for an investor who hasn’t opened their spotlight page.',
    sentFrom: 'PL Spotlight → participants table',
    appliesTo: 'All spotlights',
    shipped: DEFAULT_FOLLOWUP_TEMPLATE,
    lastEdited: 'Jul 22, 2026',
  },
];

/** The current wording of every template, plus when it last changed. */
export type EmailTemplateState = Record<EmailTemplateId, { template: InviteTemplate; lastEdited: string }>;

export const INITIAL_EMAIL_TEMPLATES: EmailTemplateState = {
  'spotlight-invite': {
    template: DEFAULT_INVITE_TEMPLATE,
    lastEdited: 'Aug 4, 2026',
  },
  'spotlight-follow-up': {
    template: DEFAULT_FOLLOWUP_TEMPLATE,
    lastEdited: 'Jul 22, 2026',
  },
};

/**
 * What the list shows in Last edited after a save.
 *
 * A literal rather than a formatted `new Date()`: these routes server-render, so
 * a clock read during render is a hydration mismatch waiting to happen — and the
 * exact minute is not what the column is for.
 */
export const JUST_EDITED = 'Just now';

/** Which records currently keep their own copy of each template, by name. */
export type EmailTemplateOverrides = Record<EmailTemplateId, string[]>;

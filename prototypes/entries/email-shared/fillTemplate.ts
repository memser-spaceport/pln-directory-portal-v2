/**
 * Filling a `{{placeholder}}` email template — the generic half.
 *
 * SHARED (prototypes/entries/email-shared/, no registry entry — like nav-shared/
 * and profile-shared/).
 *
 * EXTRACTED FROM `pl-spotlight-table/inviteTemplate.ts`, which worked all of this
 * out for the investor invite: doubled braces, Handlebars' own `{{#if}}` spelling,
 * innermost-first conditional resolution, and the drop rule. Every regex and rule
 * below is that file's, unchanged — what is removed is everything that knew about
 * spotlights (`SpotlightParticipant`, `InviteContext`, the row's JSON vars), which
 * is what kept it from being callable by anything else.
 *
 * `inviteTemplate.ts` has NOT been switched over to this module. That is a
 * deliberate not-now rather than an oversight: it is a settled prototype with a
 * two-level override model and a live editor on top of these functions, and
 * re-pointing it is a change worth making on its own, not as a side effect of
 * adding a second email. Until it is, these are two copies of one engine — which
 * is exactly the drift this folder exists to end, so whoever touches either file
 * next should finish the move.
 */

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
 */
const IF_BLOCK = /\{\{#if\s+(\w+)\}\}((?:(?!\{\{#if\s)[\s\S])*?)\{\{\/if\}\}/;
const ELSE_TAG = /\{\{else\}\}/;
const IF_OPEN = /\{\{#if\s+\w*\s*\}\}/g;
const IF_CLOSE = /\{\{\/if\}\}/g;

export type Branch = { key: string; taken: 'then' | 'else' };

export type FilledTemplate = {
  text: string;
  /** Placeholders the values map had nothing for; their paragraph was dropped. */
  missing: string[];
  /** Every `{{#if}}` the template holds and which way it went. */
  conditionals: Branch[];
  /** Set when `{{#if}}` and `{{/if}}` don't balance; the text passes through untouched. */
  syntaxError: string | null;
};

/**
 * Truthiness is "the variable has a non-empty value" — matching the drop rule's
 * own test exactly, so the two never disagree about whether a value "exists".
 *
 * NOTE: no `{{#unless}}`, no `{{#if a b}}`, no comparisons. Handlebars has all
 * three and a mail template does not need them; the moment one appears, this
 * silently-truthy resolver is the wrong tool and a real Handlebars runtime is the
 * right one.
 */
function resolveConditionals(
  text: string,
  values: Record<string, string>,
): { text: string; branches: Branch[]; error: string | null } {
  const opens = text.match(IF_OPEN)?.length ?? 0;
  const closes = text.match(IF_CLOSE)?.length ?? 0;
  if (opens !== closes) {
    return {
      text,
      branches: [],
      error: `${opens} {{#if}} and ${closes} {{/if}} — every {{#if}} needs its own {{/if}}.`,
    };
  }

  const branches: Branch[] = [];
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
 * Fill one template string.
 *
 * **The drop rule.** A paragraph still holding an unfilled placeholder is dropped
 * whole rather than sent with a hole in it — a mail merge that ships "based in
 * {{location}}" is worse than one that says nothing. That only works while every
 * placeholder-bearing paragraph is optional by construction; anything the email
 * cannot be sent without has to use a value every record has.
 *
 * `singleLine` turns the rule off for subjects, which have no paragraphs to drop
 * — a subject with a hole in it is still better than an empty subject, and the
 * `missing` list is what reports the problem.
 */
export function fillTemplate(
  template: string,
  values: Record<string, string>,
  { singleLine = false }: { singleLine?: boolean } = {},
): FilledTemplate {
  const missing: string[] = [];

  const substitute = (text: string) =>
    text.replace(PLACEHOLDER, (match, key: string) => {
      const value = values[key];
      if (value === undefined || value === '') {
        if (!missing.includes(key)) missing.push(key);
        return match;
      }
      return value;
    });

  // Conditionals first, so a variable that only ever appears inside a branch this
  // record didn't take is never reported missing — the author already said what
  // happens in that case, and a "left out" note would contradict the email.
  const resolved = resolveConditionals(template, values);

  const text = singleLine
    ? substitute(resolved.text)
    : resolved.text
        .split('\n\n')
        .map(substitute)
        .filter((paragraph) => !HAS_PLACEHOLDER.test(paragraph))
        .join('\n\n');

  return { text, missing, conditionals: resolved.branches, syntaxError: resolved.error };
}

/** The first word of a name — the greeting form used across these templates. */
export const firstName = (fullName: string): string => fullName.trim().split(/\s+/)[0] ?? '';

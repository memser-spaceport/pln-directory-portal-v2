'use client';

import clsx from 'clsx';

// The Monday digest's email shell, imported rather than rebuilt: the stage, the
// fake client chrome with its subject-budget counter, the white card, the
// masthead and the footer. It is the only email preview in this repo, and two
// prototypes drawing an inbox differently would make the *format* the thing under
// review instead of the words.
import digest from '../../newsfeed/Newsfeed.module.scss';

import {
  buildApplicationEmail,
  SUBJECT_BUDGET,
  TEMPLATE_VARIABLES,
  type ApplicationEmailInput,
} from './applicationEmail';
import s from './ApplicationEmailPreview.module.scss';

/**
 * What the hiring team receives, rendered as an email.
 *
 * **Why render it at all when the deliverable is copy.** Because the subject line
 * is a design decision that only exists at a length — it is the one part most
 * recipients ever read, and 60 characters is a budget you cannot hold in your
 * head while writing in a `.ts` file. The digest learned this first and put a
 * live counter in its client chrome; this reuses it.
 *
 * It also makes the drop rule visible. A reviewer looking at a filled email
 * cannot tell a line that was never in the template from one that was dropped
 * because the profile had no location — so the panel underneath says which, in
 * the same words the invite modal uses ("left out rather than sent half-empty").
 *
 * Review scaffolding, not product: reachable at `?email=1` on the board.
 */
export function ApplicationEmailPreview({ input }: { input: ApplicationEmailInput }) {
  const email = buildApplicationEmail(input);
  const overBudget = email.subject.text.length > SUBJECT_BUDGET;

  /* The profile URL is the one line in the body that is a link. Rather than
     marking it up in the template — which would make the template HTML, and it
     is plain text — the body is split on it and the middle piece is tinted. */
  const [beforeUrl, afterUrl] = input.profileUrl ? email.body.text.split(input.profileUrl) : [email.body.text, ''];

  return (
    <div className={digest.emailStage}>
      {/* Client chrome, so this reads as an email rather than a page. */}
      <div className={digest.clientBar}>
        <div className={digest.clientRow}>
          <span className={digest.clientLabel}>From</span>
          <span className={digest.clientValue}>{email.from}</span>
        </div>
        <div className={digest.clientRow}>
          <span className={digest.clientLabel}>To</span>
          <span className={digest.clientValue}>{input.recipientName}</span>
        </div>
        <div className={digest.clientRow}>
          <span className={digest.clientLabel}>Subject</span>
          <span className={clsx(digest.clientValue, digest.clientSubject)}>
            {email.subject.text}
            <span className={clsx(digest.charCount, overBudget && digest.charCountOver)}>
              {email.subject.text.length}/{SUBJECT_BUDGET}
            </span>
          </span>
        </div>
        <div className={digest.clientRow}>
          <span className={digest.clientLabel}>Preview</span>
          <span className={digest.clientValue}>{email.preview}</span>
        </div>
      </div>

      <div className={digest.email}>
        <header className={digest.emailHead}>
          <p className={digest.masthead}>Protocol Labs Network</p>
          {/* No date line. The digest's says which week it covers because it is a
              roundup; an application happened at a moment the mail client already
              timestamps, and repeating it here would be the second telling. */}
        </header>

        <div className={s.body}>
          {beforeUrl}
          {input.profileUrl && <span className={s.bodyLink}>{input.profileUrl}</span>}
          {afterUrl}
        </div>

        <footer className={digest.emailFoot}>
          <p>{email.footerReason.text}</p>
          <p>
            <a href="/settings/email-preferences">Choose who receives application emails</a> ·{' '}
            <a href="/settings/email-preferences">Unsubscribe</a>
          </p>
        </footer>
      </div>

      {/* --- Review scaffolding below this line --- */}
      <div className={s.notes}>
        <p className={s.notesTitle}>Template</p>

        {email.body.conditionals.map((branch) => (
          <p key={branch.key} className={clsx(s.note, branch.taken === 'else' && s.noteDropped)}>
            {branch.taken === 'then'
              ? `{{${branch.key}}} had a value — its line is in.`
              : `No ${branch.key.replace('applicant_', '')} on this profile — the line using it was left out rather than sent half-empty.`}
          </p>
        ))}

        {email.subject.syntaxError && <p className={clsx(s.note, s.noteDropped)}>{email.subject.syntaxError}</p>}
        {email.body.syntaxError && <p className={clsx(s.note, s.noteDropped)}>{email.body.syntaxError}</p>}

        {TEMPLATE_VARIABLES.map((variable) => (
          <div key={variable.key} className={s.varRow}>
            <span className={s.varKey}>{`{{${variable.key}}}`}</span>
            <span className={s.varSource}>{variable.source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

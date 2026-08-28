'use client';

// Back Office → Settings → Email templates.
//
// WHY THE LIST IS HERE AND NOT UNDER A DOMAIN ITEM
// The navbar has a shape: domain items that have records behind them (Members,
// Teams, Demo Days, IRL Gathering), then chevron-less utility items (Deals,
// Guides, Settings). A template is not a seventh kind of record — it is
// configuration for how the records reach people — so it goes in the utility
// slot. Under Demo Days it would be the spotlight's templates only, and the
// member invite, the team approval and the gathering invite would each need their
// own list under their own domain: four lists, four places to look, and no answer
// to "what does this back office send".
//
// WHAT IS INVENTED, SAID PLAINLY
// Neither the Settings item nor this page is in the Figma file
// (r1B2INuN2xKR31z9oDQWWt) — everything else in this prototype is traced. So the
// page is a placement proposal, built at the app's own fidelity so it can be
// judged where it would live. The rows in it are not invented; see the note in
// emailTemplateLibrary.ts for why these two and no others.
//
// WHAT THE PAGE IS, AND WHAT IT ISN'T
//  - It is a LIST, not a form. The wording lives behind a row, in the same editor
//    the Overview card opens (EmailTemplateModal), because the two scopes edit the
//    same kind of object and a second editor would drift from the first. Five
//    columns are what a template needs before you open it: what it is, where it
//    goes out from, whether anyone has changed it, whether any record has stopped
//    listening to it, and when it last moved.
//  - It does NOT preview inline. A row that renders half an email is a row that
//    stops being a row; the editor's preview pane is one click away and shows the
//    whole thing resolved.
//  - The h1 is "Settings", not "Email templates". The card is one section of a
//    settings page, and titling the page after its only current section would
//    make the second section — whenever it arrives — look like it landed in the
//    wrong place. The nav item and the h1 say the same word (design-thinking #6).
//
// THE COLUMN THAT MATTERS MOST IS "Used by"
// It is the only thing an admin cannot work out from anywhere else: editing the
// default here does nothing at all for a spotlight that keeps its own copy. So
// the override is reported from the default's side, by name, and the save message
// says it again at the moment it becomes relevant. Without that line this page
// would quietly lie to whoever edits it.
//
// REUSE MAP (prototypes/CLAUDE.md #2)
//  - EmailTemplateModal (local) — the same editor, at a different scope. What
//    differs is copy and what "reset" means, both passed in as props.
//  - SpotlightOverview.module.scss — the Edit control is `overview.ghostButton`,
//    imported rather than restyled, because it makes the same promise here as it
//    does on the Overview card: this opens somewhere you can change it.
//  - The table chrome is transcribed from the participants table's stylesheet in
//    the same entry (row heights, header tone, 0.8px borders, badge ramps), so the
//    two tables in this back office measure the same. Nothing is imported from
//    portal-v2: this is the back-office app's palette, not the portal's.

import { useMemo, useState } from 'react';

import type { InviteContext } from './mocks';
import type { InviteTemplate } from './inviteTemplate';
import { templatesMatch } from './inviteTemplate';
import type { EmailTemplateId, EmailTemplateOverrides, EmailTemplateState } from './emailTemplateLibrary';
import { EMAIL_TEMPLATES } from './emailTemplateLibrary';
import EmailTemplateModal from './EmailTemplateModal';

import overview from './SpotlightOverview.module.scss';
import s from './SettingsEmailTemplates.module.scss';

interface SettingsEmailTemplatesProps {
  /** Current wording and last-edited stamp per template. Owned by the prototype root. */
  templates: EmailTemplateState;
  /** Which records keep their own copy of each template, by name. Live, not mocked. */
  overrides: EmailTemplateOverrides;
  /** What the editor's preview resolves against — the values of the one spotlight this prototype has. */
  context: InviteContext;
  onSave: (id: EmailTemplateId, template: InviteTemplate) => void;
}

export default function SettingsEmailTemplates({ templates, overrides, context, onSave }: SettingsEmailTemplatesProps) {
  // Which row's editor is open, plus a session that changes per open so the card
  // re-mounts on the saved text rather than a stale draft. Same trick as the two
  // modals on the spotlight screen.
  const [editing, setEditing] = useState<{ id: EmailTemplateId; session: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');

  const entry = useMemo(() => EMAIL_TEMPLATES.find((candidate) => candidate.id === editing?.id) ?? null, [editing?.id]);

  const handleEdit = (id: EmailTemplateId) => {
    // The session only has to CHANGE, so it counts opens across both rows rather
    // than per row — reopening the same template twice still re-mounts the card.
    setEditing((current) => ({ id, session: (current?.session ?? 0) + 1 }));
    setOpen(true);
  };

  const handleSave = (next: InviteTemplate) => {
    if (!entry) return;
    onSave(entry.id, next);
    setOpen(false);

    // Reports the consequence, not the action. "Saved" is visible in the row
    // that just changed; what is NOT visible is that a record with its own copy
    // did not just change with it.
    const holders = overrides[entry.id] ?? [];
    setStatus(
      holders.length > 0
        ? `${entry.name} saved. ${formatList(holders)} ${holders.length === 1 ? 'keeps' : 'keep'} their own version, so ${holders.length === 1 ? 'it is' : 'they are'} unchanged.`
        : `${entry.name} saved. Every send starts from the new wording.`,
    );
  };

  return (
    <div className={s.root}>
      <h1 className={s.pageTitle}>Settings</h1>

      <section className={s.card} aria-labelledby="settings-email-templates">
        <div className={s.cardHead}>
          <h2 className={s.cardHeading} id="settings-email-templates">
            Email templates
          </h2>
          {/* Says the one rule the page cannot show: these are STARTING points.
              Without it, an admin who edits the invite here has no reason to
              expect a spotlight to be able to disagree with them. */}
          <p className={s.cardDesc}>
            The wording each automated email starts from. A record can keep its own version — when it does, this stops
            being what it sends, and the row says so.
          </p>
        </div>

        {/* Five columns fit a laptop, but not a narrow window, and the
            participants table next door already solved this: one scroller,
            keyboard-reachable, rather than columns that collapse into each other. */}
        <div className={s.scroller} role="region" aria-label="Email templates" tabIndex={0}>
          <div className={s.table} role="table" aria-label="Email templates">
            <div className={s.headRow} role="row">
              <div className={`${s.headCell} ${s.colTemplate}`} role="columnheader">
                <span className={s.headLabel}>Template</span>
              </div>
              <div className={`${s.headCell} ${s.colSentFrom}`} role="columnheader">
                <span className={s.headLabel}>Sent from</span>
              </div>
              <div className={`${s.headCell} ${s.colUsedBy}`} role="columnheader">
                <span className={s.headLabel}>Used by</span>
              </div>
              <div className={`${s.headCell} ${s.colEdited}`} role="columnheader">
                <span className={s.headLabel}>Last edited</span>
              </div>
              <div className={`${s.headCell} ${s.colActions}`} role="columnheader">
                <span className={s.headLabel}>Actions</span>
              </div>
            </div>

            {EMAIL_TEMPLATES.map((template) => {
              const state = templates[template.id];
              const holders = overrides[template.id] ?? [];
              // "Edited" measured against the SHIPPED text, which is what this
              // scope's own reset returns to. The spotlight scope measures against
              // this row instead — see emailTemplateLibrary.ts.
              const edited = !templatesMatch(state.template, template.shipped);

              return (
                <div className={s.row} key={template.id} role="row">
                  <div className={`${s.cell} ${s.colTemplate}`} role="cell">
                    <span className={s.templateText}>
                      <span className={s.templateName}>{template.name}</span>
                      <span className={s.templatePurpose}>{template.purpose}</span>
                    </span>
                  </div>

                  <div className={`${s.cell} ${s.colSentFrom}`} role="cell">
                    <span className={s.value}>{template.sentFrom}</span>
                  </div>

                  {/* The badge carries the EXCEPTION when there is one and the
                      scope when there isn't, rather than showing both: an
                      override is the only thing in this column anyone needs to
                      act on, and a row that says "All spotlights · 1 override"
                      makes the reader work out which half is the news.
                      The subline is what the badge can't say — which record, or
                      where a record could take a copy in the first place. */}
                  <div className={`${s.cell} ${s.colUsedBy}`} role="cell">
                    {holders.length > 0 ? (
                      <span className={s.usedBy}>
                        <span className={`${s.badge} ${s.badgeOverridden}`}>
                          {holders.length === 1 ? '1 override' : `${holders.length} overrides`}
                        </span>
                        <span className={s.usedByNote}>{formatList(holders)}</span>
                      </span>
                    ) : (
                      <span className={s.usedBy}>
                        <span className={`${s.badge} ${s.badgeEverywhere}`}>{template.appliesTo}</span>
                        <span className={s.usedByNote}>
                          {template.overrideSurface
                            ? `Overridable in ${template.overrideSurface}`
                            : 'One wording, no per-record copy'}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className={`${s.cell} ${s.colEdited}`} role="cell">
                    <span className={s.editedCell}>
                      <span className={s.value}>{state.lastEdited}</span>
                      {/* Whether anyone has touched it since it shipped. It rides
                          the date rather than taking a column of its own: the two
                          are one fact — what happened, and when. */}
                      <span className={s.editedNote}>{edited ? 'Edited here' : 'Original wording'}</span>
                    </span>
                  </div>

                  <div className={`${s.cell} ${s.colActions}`} role="cell">
                    <button type="button" className={overview.ghostButton} onClick={() => handleEdit(template.id)}>
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className={s.statusBar}>
        <span role="status" aria-live="polite">
          {status}
        </span>
      </div>

      {entry && (
        <EmailTemplateModal
          open={open}
          template={templates[entry.id].template}
          // Reset goes back to the text that shipped: this row IS the default, so
          // there is nothing above it to fall back to.
          baseTemplate={entry.shipped}
          resetLabel="Reset to original"
          heading={entry.name}
          description={
            entry.overrideSurface
              ? `The wording every send of this email starts from. A record that keeps its own version keeps it — editing here won't reach it.`
              : `The wording every send of this email starts from. There is no per-record version of this one.`
          }
          saveNote={
            (overrides[entry.id] ?? []).length > 0
              ? `Applies from now on, except where a record keeps its own version: ${formatList(overrides[entry.id])}. Emails already delivered stay as they were.`
              : 'Applies to sends from now on. Emails already delivered stay as they were.'
          }
          context={context}
          // Names where the preview's VALUES came from. The recipient is a
          // stand-in and reads as one, but `{{company_name}}` and
          // `{{close_date}}` resolve to a real spotlight's — and this page sits
          // above every record, so a reader who did not pick that spotlight
          // would otherwise take its name for part of the template.
          previewNote={`Values from the ${context.companyName} spotlight — the most recent one to use this template.`}
          session={`settings-${entry.id}-${editing?.session ?? 0}`}
          onClose={() => setOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/** "A", "A and B", "A, B and C" — used in a sentence, so it needs the conjunction. */
function formatList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

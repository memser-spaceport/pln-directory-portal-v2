'use client';

// The template editor, opened from two places.
//
// WHY THIS EXISTS SEPARATELY FROM InviteEmailModal
// That modal edits one send: you open it from a row, retouch a sentence for that
// investor, and the change dies with the modal. This one edits the wording
// everyone gets. Same email, two different questions — "what does Björn read"
// versus "what does the invite say" — so they are two surfaces, and the second
// one lives on the record the table belongs to rather than on any row of it.
//
// ONE EDITOR, TWO SCOPES
// Settings → Email templates edits the default every spotlight starts from; the
// Overview card edits one spotlight's copy of it. Same job, same instrument — so
// this is the same component in both places rather than a second editor that
// would drift a variable chip or a syntax rule away from the first.
//
// What differs between the two is COPY and what "default" means, so both are
// props now: `heading`, `description`, `saveNote`, and `baseTemplate` +
// `resetLabel` for the reset link. That is why this file no longer contains the
// sentences it used to — they are at the two call sites, in
// SettingsEmailTemplates.tsx and PlSpotlightTablePrototype.tsx, next to the state
// that makes them true. The layout, the chips, the preview and the drop-rule
// notes are the same in both scopes and stay here.
//
// REUSE MAP (prototypes/CLAUDE.md #2)
//  - Modal, Button, CloseIcon, Tabs — production components.
//  - Subject and body are NOT FormField / FormTextArea any more. A form control
//    cannot paint its own contents, and the tokens have to be visible in the
//    text being typed — so both are transcribed into TemplateSyntaxFields.tsx
//    with a highlight layer behind them, production metrics restated verbatim.
//    Everything else on the card is unchanged; see that file's header.
//  - The chrome classes are IMPORTED from InviteEmailModal.module.scss rather
//    than copied: same prototype entry, same modal, and two copies of the
//    ReferModal transcription would drift the moment one of them is nudged.
//    Only what the invite modal has no equivalent of — the ranged-left header,
//    the variable chips, the preview pane — is new, in this file's own
//    stylesheet, and overrides rather than edits what it borrows.
//
// THREE THINGS DECIDED HERE, NOT TRANSCRIBED
//  - Variables are chips you click, not syntax you memorise. `{{sector_hook}}`
//    typed as `{sector_hook}` fails silently — it just renders as literal text
//    in someone's inbox — so the only safe way to offer variables is to insert
//    them. The chip carries the token alone: annotating each one with its source
//    stacked the list five rows deep and pushed the note under it out of the
//    card, and the preview opposite answers "what does this become" better than
//    a label could. The sources survive on hover, and the two that reach back
//    into the Overview — the pair nobody would guess — are named in that note.
//  - The preview is not optional, not collapsed, and not below the fold. The
//    left column is placeholders; this is the only place it becomes an email a
//    person could read, and the notes underneath say what resolved and what did
//    not. It resolves against a STAND-IN recipient, not a participant — see the
//    note on `PREVIEW_RECIPIENT` in mocks.ts.
//    (It used to carry a With / No template vars cohort toggle, because the drop
//    rule was invisible and the only way to teach it was to show the template
//    resolving two ways. Both branches are now written into the template itself,
//    on either tab, so the toggle was re-answering a question the editor beside
//    it already answers in words.)
//    That requirement is what sets the card's shape: stacked under the editor,
//    the preview opened out of sight at the 860px height cap this modal family
//    uses, so the card takes an edit-and-preview split instead and the two
//    columns each come in under the cap. It stacks back to one column on mobile,
//    where the preview does end up below the editor — unavoidable, and at least
//    it is one scroll rather than a scroll inside a scroll.
//  - Saving does not touch invites already sent, and says so. There is no
//    version history in a prototype, so the alternative to that sentence is an
//    admin guessing.

import { useMemo, useState, type ReactNode } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { CloseIcon } from '@/components/icons';

import { TemplateSyntaxInput, TemplateSyntaxTextArea } from './TemplateSyntaxFields';

import type { InviteContext } from './mocks';
import { PREVIEW_RECIPIENT } from './mocks';
import type { DynamicRule, InviteTemplate } from './inviteTemplate';
import {
  TEMPLATE_VARIABLES,
  appendDynamicRule,
  applyDynamicRule,
  buildInviteDraft,
  conditionalSnippet,
  parseDynamicRules,
  removeDynamicRule,
  templatesMatch,
} from './inviteTemplate';
import DynamicContentPanel from './DynamicContentPanel';

import chrome from './InviteEmailModal.module.scss';
import s from './EmailTemplateModal.module.scss';

/** Same cap the invite draft uses — the template can only ever be shorter. */
const BODY_MAX_LENGTH = 5000;
const SUBJECT_MAX_LENGTH = 140;

/**
 * Field names are prefixed because `insertVariable` reaches for the live
 * textarea by id (FormTextArea sets `id={name}`), and a bare "body" would be
 * ambiguous the moment another modal in this entry registers one.
 */
type TemplateFormData = { templateSubject: string; templateBody: string };

/**
 * Two ways to write the same conditional, not two templates.
 *
 * Conditional leads because it is the one that shows the whole email at once —
 * you can read the thing you are sending. Rules is the way in for someone who
 * would never type a handlebar, and it costs a click to reach, which is the
 * right order for a surface an admin opens rarely and reads carefully.
 *
 * No sub-labels: the note under each tab's own controls says what that tab does,
 * and the preview opposite shows it happening.
 */
type TemplateView = 'syntax' | 'rules';

const VIEW_TABS: { key: TemplateView; label: string }[] = [
  { key: 'syntax', label: 'Conditional' },
  { key: 'rules', label: 'Rules' },
];

interface EmailTemplateModalProps {
  open: boolean;
  /** Currently saved template; the form is seeded from it on every open. */
  template: InviteTemplate;
  /**
   * What "reset" restores, and what the reset link's visibility is measured
   * against. NOT the same thing at the two scopes: Settings resets to the text
   * that shipped, a spotlight resets to whatever Settings currently says. Passing
   * it in is the whole reason editing the Settings default cannot leave a
   * spotlight quietly resetting to last month's wording.
   */
  baseTemplate: InviteTemplate;
  /** The reset link's words, because the base has a different name at each scope. */
  resetLabel: string;
  /** Names the template being edited. The spotlight scope names the email, Settings names the entry. */
  heading: string;
  /** Says whose wording this is and what saving it reaches. */
  description: ReactNode;
  /** Sits above the save button: what a save does to mail already out, and to overrides. */
  saveNote: ReactNode;
  /** Live Overview values — the preview has to resolve against what is set now. */
  context: InviteContext;
  /**
   * Where the preview's *values* come from, when that is not obvious.
   *
   * The recipient is a stand-in at both scopes (`PREVIEW_RECIPIENT`), so this no
   * longer has to name a borrowed person. What it still has to name is the
   * spotlight supplying `{{company_name}}` and `{{close_date}}`: the Overview
   * card is opened from that spotlight, so it says nothing, while the Settings
   * list sits above every record and has to say which one it borrowed.
   */
  previewNote?: ReactNode;
  /** Changes per open, so the card re-mounts with a clean form. Same trick as the invite modal. */
  session: string;
  onClose: () => void;
  onSave: (template: InviteTemplate) => void;
}

export default function EmailTemplateModal({ open, session, onClose, ...card }: EmailTemplateModalProps) {
  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false} lockScroll className={s.wideContainer}>
      <EmailTemplateCard key={session} {...card} onClose={onClose} />
    </Modal>
  );
}

function EmailTemplateCard({
  template,
  baseTemplate,
  resetLabel,
  heading,
  description,
  saveNote,
  context,

  previewNote,
  onClose,
  onSave,
}: Omit<EmailTemplateModalProps, 'open' | 'session'>) {
  const methods = useForm<TemplateFormData>({
    defaultValues: { templateSubject: template.subject, templateBody: template.body },
    mode: 'onChange',
  });
  const { control, setValue } = methods;

  const subject = useWatch({ control, name: 'templateSubject' }) ?? '';
  const body = useWatch({ control, name: 'templateBody' }) ?? '';

  const draftTemplate: InviteTemplate = { subject, body };
  const changed = subject !== template.subject || body !== template.body;

  // ── Two views of one template ───────────────────────────────────────────────
  // The tabs hold no state of their own. Both read `templateBody` and both write
  // it back, so nothing has to be stashed on the way out of a tab and the two can
  // never disagree — switching is free because there is only ever one draft.
  //
  // An earlier pass gave each tab its own draft, which had to be true when the
  // tabs were two different TEXTS. They are now two editors over the same one,
  // and the stash went with the premise.
  const [view, setView] = useState<TemplateView>('syntax');

  // Re-derived from the body on every keystroke rather than held in state: the
  // syntax tab can edit the same blocks, and a cached rule list would be one
  // render behind the text it describes.
  const rules = useMemo(() => parseDynamicRules(body), [body]);

  const writeBody = (next: string) => setValue('templateBody', next, { shouldDirty: true });

  const canSave = Boolean(subject.trim() && body.trim()) && changed;

  // A STAND-IN, not a participant.
  //
  // Two things came off this preview in turn. First the With / No template vars
  // cohort toggle, once both branches were written into the template itself and
  // the toggle was re-answering a question the editor already answers in words.
  // Then the real row it had been borrowing: a specimen named "Polina Bublii"
  // reads as an email *about* her, and she is also whoever is signed in, so the
  // pane looked like it was showing the admin their own mail.
  //
  // `PREVIEW_RECIPIENT` is John Doe — obviously nobody, which is the point, and
  // which is also why the caption naming the specimen went with him. There is no
  // one to name any more, and "as John Doe receives it" would have been a label
  // stating that a placeholder is a placeholder.
  const sample = PREVIEW_RECIPIENT;
  const preview = useMemo(
    () => (sample ? buildInviteDraft(sample, draftTemplate, context) : null),
    // draftTemplate is a fresh object each render; its two strings are the real deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sample, subject, body, context],
  );

  /**
   * Insert at the caret, not at the end. A variable belongs mid-sentence, and an
   * editor that always appends makes you cut and paste it into place — at which
   * point the chip has saved nothing.
   */
  const insertToken = (makeToken: (selected: string) => string) => {
    const field = typeof document === 'undefined' ? null : document.getElementById('templateBody');
    const textarea = field instanceof HTMLTextAreaElement ? field : null;

    if (!textarea) {
      setValue('templateBody', `${body}${makeToken('')}`, { shouldDirty: true });
      return;
    }

    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? start;
    // The selection is passed to the token builder rather than simply replaced,
    // so the `{{#if}}` chip can WRAP the sentence you highlighted — which is how
    // an optional paragraph actually gets written: you type it, then decide it
    // is conditional. A variable chip ignores the argument and overwrites, which
    // is the same behaviour it had before.
    const token = makeToken(body.slice(start, end));
    setValue('templateBody', `${body.slice(0, start)}${token}${body.slice(end)}`, { shouldDirty: true });

    // After React has written the new value back into the textarea, or the
    // caret lands in the pre-insert string and jumps.
    requestAnimationFrame(() => {
      const caret = start + token.length;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  };

  const insertVariable = (key: string) => insertToken(() => `{{${key}}}`);
  const insertConditional = (key: string) => insertToken((selected) => conditionalSnippet(key, selected));

  // Resets to whatever the caller called the base — the shipped text in Settings,
  // the Settings text in a spotlight. Never to a module constant: that is exactly
  // the bug the two scopes would otherwise have.
  const resetToBase = () => {
    setValue('templateSubject', baseTemplate.subject, { shouldDirty: true });
    setValue('templateBody', baseTemplate.body, { shouldDirty: true });
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({ subject: subject.trim(), body: body.trim() });
  };

  return (
    <div className={`${chrome.modal} ${s.wide}`}>
      <Button style="link" variant="neutral" className={chrome.closeButton} onClick={onClose} aria-label="Close modal">
        <CloseIcon />
      </Button>

      {/* No envelope glyph, and the type is ranged left over a rule.
          The invite modal keeps the centred-icon-over-centred-title header it
          inherits from ReferModal, and should: it is a 520px confirm sheet, and
          a centred column is what a confirm sheet looks like. This is an 880px
          two-column editor whose every other element starts at the left margin,
          so a centred header floated free of the thing it titles, and a 52px
          decorative envelope only pushed the editor further down a card that is
          already fighting for height. The rule does the work the icon was
          pretending to: it separates what this modal is from what it edits. */}
      <div className={s.header}>
        <h2 className={`${chrome.title} ${s.headerText}`}>{heading}</h2>
        <p className={`${chrome.desc} ${s.headerText}`}>{description}</p>
      </div>

      {/* Above the editor and outside the columns, because it governs both of
          them — the subject, the body, the chips and the preview all change
          meaning with it. Inside the left column it would read as a property of
          the body field alone.
          Production's Tabs (components/common/Tabs), underline variant, rather
          than the pill toggle the preview uses: these are not two views of one
          thing, and a second pill control on the same card would have claimed
          they were. */}
      <Tabs
        tabs={VIEW_TABS.map((tab) => ({ label: tab.label, value: tab.key }))}
        value={view}
        onValueChange={(next) => setView(next as TemplateView)}
        variant="underline"
        classes={{ root: s.styleTabs }}
      />

      <FormProvider {...methods}>
        <form
          className={chrome.form}
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className={chrome.fields}>
            <div className={s.columns}>
              <div className={s.column}>
                <TemplateSyntaxInput
                  name="templateSubject"
                  label="Subject"
                  placeholder="Subject line"
                  maxLength={SUBJECT_MAX_LENGTH}
                />

                <div className={chrome.bodyBlock}>
                  <div className={chrome.bodyLabelRow}>
                    <span className={chrome.bodyLabel}>Email body</span>
                    {!templatesMatch(draftTemplate, baseTemplate) && (
                      <button type="button" className={chrome.resetLink} onClick={resetToBase}>
                        {resetLabel}
                      </button>
                    )}
                  </div>
                  {/* Shorter on the Rules tab. The body is what you edit on the
                      Conditional tab and merely context on this one — at 7 rows
                      it pushed "If it doesn't match then display", the row this
                      whole tab exists for, below the card's fold. */}
                  <TemplateSyntaxTextArea
                    name="templateBody"
                    placeholder="Write the template…"
                    rows={view === 'rules' ? 4 : 7}
                    maxLength={BODY_MAX_LENGTH}
                    showCharCount
                  />
                </div>

                {/* The tab's own controls. Both tabs edit the same body above —
                    only the instrument changes, which is why this is the one
                    region that swaps and the fields never do. */}
                {view === 'syntax' ? (
                  /* Variables. Chips rather than a legend, because the useful
                     action is "put this in the text", not "read that this
                     exists" — so they sit in the editing column, next to the
                     caret they insert into. */
                  <div className={s.block}>
                    <span className={s.blockLabel}>Variables</span>
                    <div className={s.varList}>
                      {TEMPLATE_VARIABLES.map((variable) => (
                        <button
                          key={variable.key}
                          type="button"
                          className={s.varChip}
                          onClick={() => insertVariable(variable.key)}
                          title={`Insert at the cursor — filled from ${variable.source}`}
                        >
                          <code className={s.varChipToken}>{`{{${variable.key}}}`}</code>
                        </button>
                      ))}
                      {/* Same row, same chip, same insert-at-caret — a
                          conditional is a thing you put in the text, so it
                          belongs with the other things you put in the text
                          rather than in a "syntax" panel of its own. It carries
                          `{{sector_hook}}` because that is the one variable a
                          row can lack; the others resolve for everyone and
                          wrapping them would only add a branch that never runs. */}
                      <button
                        type="button"
                        className={`${s.varChip} ${s.ifChip}`}
                        onClick={() => insertConditional('sector_hook')}
                        title="Insert at the cursor — wraps the selected text, or leaves placeholders to fill in"
                      >
                        <code className={s.varChipToken}>{'{{#if}}'}</code>
                      </button>
                    </div>
                    {/* The chips carry the token alone and put `source` on hover.
                        Printing every source inline stacked them five rows deep
                        and pushed this note out of the card — and the preview
                        opposite already answers "what does this resolve to"
                        better than a label could. What the preview cannot show
                        is the two that reach back into the Overview, so those
                        are named here. */}
                    <p className={chrome.noteLine}>
                      Click to insert at the cursor. <code className={chrome.varToken}>{'{{close_date}}'}</code> and{' '}
                      <code className={chrome.varToken}>{'{{sender_name}}'}</code> come from the Overview;{' '}
                      <code className={chrome.varToken}>{'{{sector_hook}}'}</code> from each row’s Template vars.{' '}
                      <code className={chrome.varToken}>{'{{#if}}'}</code> resolves against those same values at the
                      same moment — the block keeps its first half when the variable has a value and its{' '}
                      <code className={chrome.varToken}>{'{{else}}'}</code> half when it doesn’t. Leave off the{' '}
                      <code className={chrome.varToken}>{'{{else}}'}</code> to drop the passage, as the sign-off does.
                    </p>
                  </div>
                ) : (
                  <DynamicContentPanel
                    rules={rules}
                    onChange={(rule, patch) => writeBody(applyDynamicRule(body, rule, patch))}
                    onRemove={(rule) => writeBody(removeDynamicRule(body, rule))}
                    onAdd={(key) => writeBody(appendDynamicRule(body, key))}
                  />
                )}
              </div>

              {/* Preview. Fixed, not collapsible: the template opposite is full
                  of placeholders, and this is the only place it becomes an
                  email anyone could read. */}
              {sample && preview && (
                <div className={s.column}>
                  <div className={s.block}>
                    <div className={s.previewHeader}>
                      <span className={s.blockLabel}>Preview</span>
                    </div>

                    {/* Above the box rather than under the notes, because it
                        frames everything in it: at the Settings scope the
                        specimen is borrowed from a record the reader did not
                        open, and a preview that resolves {{sector_hook}} without
                        saying whose spotlight supplied it reads as a promise
                        about every recipient. */}
                    {previewNote && <p className={chrome.noteLine}>{previewNote}</p>}

                    <div className={s.preview}>
                      <p className={s.previewSubject}>{preview.subject}</p>
                      <p className={s.previewBody}>{preview.body}</p>
                    </div>

                    {/* Ordered by how much the reader needs it: a broken
                        template makes the preview above meaningless, so it
                        speaks first and the other two stay quiet.
                        All three now describe THIS email rather than a cohort —
                        the counts went with the toggle, and a count nobody can
                        switch to is just a number. */}
                    {preview.syntaxError ? (
                      <p className={`${chrome.noteLine} ${s.syntaxError}`}>Preview paused — {preview.syntaxError}</p>
                    ) : (
                      <>
                        {preview.missing.length > 0 && (
                          <p className={chrome.noteLine}>
                            No{' '}
                            {preview.missing.map((key) => (
                              <code key={key} className={chrome.varToken}>{`{{${key}}}`}</code>
                            ))}{' '}
                            on this row — the paragraph using it is missing above, and would be missing from the email.
                          </p>
                        )}
                        {/* The conditional line replaces the "nothing is left
                            out" reassurance rather than joining it: once the
                            template branches, "nothing is left out" is not the
                            good news — which branch ran is. */}
                        {preview.conditionals.length > 0 ? (
                          <p className={chrome.noteLine}>
                            {preview.conditionals.map((branch, index) => (
                              <span key={`${branch.key}-${index}`}>
                                {index > 0 && ' '}
                                <code className={chrome.varToken}>{`{{#if ${branch.key}}}`}</code>{' '}
                                {branch.taken === 'then' ? 'kept its main text.' : 'used its fallback.'}
                              </span>
                            ))}
                          </p>
                        ) : (
                          preview.missing.length === 0 && (
                            <p className={chrome.noteLine}>Every variable resolves here; nothing is left out.</p>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Outside `.fields`, so it cannot scroll away from the button it
              qualifies — the one question a save provokes is "does this rewrite
              what I already sent". */}
          <p className={s.saveNote}>{saveNote}</p>

          <div className={chrome.actions}>
            <Button style="border" variant="primary" className={chrome.actionButton} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" style="fill" variant="primary" className={chrome.actionButton} disabled={!canSave}>
              Save template
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

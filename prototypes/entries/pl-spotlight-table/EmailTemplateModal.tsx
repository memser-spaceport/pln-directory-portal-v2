'use client';

// Overview → Email Template → "Edit template".
//
// WHY THIS EXISTS SEPARATELY FROM InviteEmailModal
// That modal edits one send: you open it from a row, retouch a sentence for that
// investor, and the change dies with the modal. This one edits the wording
// everyone gets. Same email, two different questions — "what does Björn read"
// versus "what does the invite say" — so they are two surfaces, and the second
// one lives on the record the table belongs to rather than on any row of it.
//
// (BackOfficeNavbar's note argues Email templates belongs in Settings. Both are
// true and they are different objects: Settings would hold the org-wide default,
// this holds the override for *this* spotlight. The per-spotlight one comes
// first because the copy that actually needs changing — the sector hook, the
// team, the pitch — is per-spotlight by nature.)
//
// REUSE MAP (prototypes/CLAUDE.md #2)
//  - Modal, Button, CloseIcon, FormField, FormTextArea — production components.
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
//    template's one surprising rule is that a paragraph holding an unfilled
//    variable is dropped whole (inviteTemplate.ts), and the only honest way to
//    teach that is to show the same template resolving two ways. The toggle
//    picks a COHORT, not a person — rows that carry something in the table's
//    Template vars column, and rows that carry nothing — with the size of each
//    attached, because 8 of 18 is what makes the drop worth knowing about. The
//    drop itself is visible as a missing paragraph, and named underneath.
//    That requirement is what sets the card's shape: stacked under the editor,
//    the preview opened out of sight at the 860px height cap this modal family
//    uses, so the card takes an edit-and-preview split instead and the two
//    columns each come in under the cap. It stacks back to one column on mobile,
//    where the preview does end up below the editor — unavoidable, and at least
//    it is one scroll rather than a scroll inside a scroll.
//  - Saving does not touch invites already sent, and says so. There is no
//    version history in a prototype, so the alternative to that sentence is an
//    admin guessing.

import { useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';

import type { InviteContext, SpotlightParticipant } from './mocks';
import type { InviteTemplate } from './inviteTemplate';
import { DEFAULT_INVITE_TEMPLATE, TEMPLATE_VARIABLES, buildInviteDraft, isDefaultTemplate } from './inviteTemplate';

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

interface EmailTemplateModalProps {
  open: boolean;
  /** Currently saved template; the form is seeded from it on every open. */
  template: InviteTemplate;
  /** Live Overview values — the preview has to resolve against what is set now. */
  context: InviteContext;
  /** The table's rows, used only to size the two preview cohorts and take a specimen of each. */
  rows: SpotlightParticipant[];
  /** Changes per open, so the card re-mounts with a clean form. Same trick as the invite modal. */
  session: string;
  onClose: () => void;
  onSave: (template: InviteTemplate) => void;
}

export default function EmailTemplateModal({
  open,
  template,
  context,
  rows,
  session,
  onClose,
  onSave,
}: EmailTemplateModalProps) {
  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false} lockScroll className={s.wideContainer}>
      <EmailTemplateCard
        key={session}
        template={template}
        context={context}
        rows={rows}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
}

function EmailTemplateCard({
  template,
  context,
  rows,
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
  const canSave = Boolean(subject.trim() && body.trim()) && changed;

  // The two COHORTS the preview switches between, not two people.
  //
  // An earlier pass labelled these tabs with the sample rows' names. That read
  // as a recipient picker inside a modal that has nothing to do with choosing
  // recipients, and "Polina Bublii" says nothing about why the two previews
  // differ. What actually separates them is whether the row carries anything in
  // the table's Template vars column — so that is what the tabs say, in the
  // table's own words, with the size of each cohort attached. The row behind
  // each tab is just the first of its kind; it is a specimen, not a choice.
  //
  // Labelled by the row DATA rather than by the outcome ("missing a variable"),
  // so the labels stay true if the template stops using a per-row variable
  // altogether — at which point both cohorts resolve fully and the note below
  // says so.
  const cohorts = useMemo(() => {
    const withVars = rows.filter((row) => row.templateVars);
    const withoutVars = rows.filter((row) => !row.templateVars);
    return [
      { key: 'with', label: 'With template vars', rows: withVars },
      { key: 'without', label: 'No template vars', rows: withoutVars },
    ].filter((cohort) => cohort.rows.length > 0);
  }, [rows]);

  const [cohortKey, setCohortKey] = useState<string | null>(cohorts[0]?.key ?? null);
  const cohort = cohorts.find((candidate) => candidate.key === cohortKey) ?? cohorts[0] ?? null;
  const sample = cohort?.rows[0] ?? null;
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
  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    const field = typeof document === 'undefined' ? null : document.getElementById('templateBody');
    const textarea = field instanceof HTMLTextAreaElement ? field : null;

    if (!textarea) {
      setValue('templateBody', `${body}${token}`, { shouldDirty: true });
      return;
    }

    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? start;
    setValue('templateBody', `${body.slice(0, start)}${token}${body.slice(end)}`, { shouldDirty: true });

    // After React has written the new value back into the textarea, or the
    // caret lands in the pre-insert string and jumps.
    requestAnimationFrame(() => {
      const caret = start + token.length;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  };

  const resetToDefault = () => {
    setValue('templateSubject', DEFAULT_INVITE_TEMPLATE.subject);
    setValue('templateBody', DEFAULT_INVITE_TEMPLATE.body);
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
        <h2 className={`${chrome.title} ${s.headerText}`}>Invite email template</h2>
        <p className={`${chrome.desc} ${s.headerText}`}>
          The draft every invite for {context.companyName} starts from. Editing one email before it sends doesn’t change
          this.
        </p>
      </div>

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
                <FormField
                  name="templateSubject"
                  label="Subject"
                  placeholder="Subject line"
                  maxLength={SUBJECT_MAX_LENGTH}
                />

                <div className={chrome.bodyBlock}>
                  <div className={chrome.bodyLabelRow}>
                    <span className={chrome.bodyLabel}>Email body</span>
                    {!isDefaultTemplate(draftTemplate) && (
                      <button type="button" className={chrome.resetLink} onClick={resetToDefault}>
                        Reset to default
                      </button>
                    )}
                  </div>
                  <FormTextArea
                    name="templateBody"
                    placeholder="Write the template…"
                    rows={7}
                    maxLength={BODY_MAX_LENGTH}
                    showCharCount
                  />
                </div>

                {/* Variables. Chips rather than a legend, because the useful
                    action is "put this in the text", not "read that this
                    exists" — so they sit in the editing column, next to the
                    caret they insert into. */}
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
                  </div>
                  {/* The chips carry the token alone and put `source` on hover.
                      Printing every source inline stacked them five rows deep
                      and pushed this note out of the card — and the preview
                      opposite already answers "what does this resolve to"
                      better than a label could. What the preview cannot show is
                      the two that reach back into the Overview, so those are
                      named here. */}
                  <p className={chrome.noteLine}>
                    Click to insert at the cursor. <code className={chrome.varToken}>{'{{close_date}}'}</code> and{' '}
                    <code className={chrome.varToken}>{'{{sender_name}}'}</code> come from the Overview;{' '}
                    <code className={chrome.varToken}>{'{{sector_hook}}'}</code> from each row’s Template vars — and a
                    paragraph whose variable has no value for a recipient is left out whole rather than sent with a gap
                    in it.
                  </p>
                </div>
              </div>

              {/* Preview. Fixed, not collapsible: it is the only place the drop
                  rule opposite is visible rather than merely asserted. */}
              {cohort && sample && preview && (
                <div className={s.column}>
                  <div className={s.block}>
                    <div className={s.previewHeader}>
                      <span className={s.blockLabel}>Preview</span>
                      <div className={s.sampleToggle} role="group" aria-label="Preview against">
                        {cohorts.map((candidate) => (
                          <button
                            key={candidate.key}
                            type="button"
                            className={`${s.sampleButton} ${candidate.key === cohort.key ? s.sampleButtonActive : ''}`}
                            aria-pressed={candidate.key === cohort.key}
                            onClick={() => setCohortKey(candidate.key)}
                          >
                            {candidate.label}
                            <span className={s.sampleCount}>{candidate.rows.length}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={s.preview}>
                      <p className={s.previewSubject}>{preview.subject}</p>
                      <p className={s.previewBody}>{preview.body}</p>
                    </div>

                    {/* Reports the cohort, not the specimen: the count is what
                        makes the drop worth caring about, and naming one
                        participant would put the person back in a control that
                        just stopped being about people. */}
                    {preview.missing.length > 0 ? (
                      <p className={chrome.noteLine}>
                        No{' '}
                        {preview.missing.map((key) => (
                          <code key={key} className={chrome.varToken}>{`{{${key}}}`}</code>
                        ))}{' '}
                        on these {cohort.rows.length} rows — the paragraph using it is missing above, and would be
                        missing from their emails.
                      </p>
                    ) : (
                      <p className={chrome.noteLine}>
                        Every variable resolves for these {cohort.rows.length} rows; nothing is left out.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Outside `.fields`, so it cannot scroll away from the button it
              qualifies — the one question a save provokes is "does this rewrite
              what I already sent". */}
          <p className={s.saveNote}>Applies to invites sent from now on. Emails already delivered stay as they were.</p>

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

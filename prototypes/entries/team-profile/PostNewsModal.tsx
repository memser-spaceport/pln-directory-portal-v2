'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { useFormDraft } from '@/hooks/useFormDraft';
import { DraftSaveStatus } from '@/components/page/gantry/ideas/SubmitIdeaModal/DraftSaveStatus';
import { DiscardDraftDialog } from '@/components/page/gantry/ideas/DiscardDraftDialog';
import { hasRichTextContent, TITLE_MAX_LENGTH } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

// The product's standard modal shell — the same three stylesheets Gantry's
// SubmitIdeaModal composes: deal-modal chrome (header / content / footer), the
// idea modal's 640px card + title row + discard link, and the idea form's
// input tone fixes.
import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import ideaModalStyles from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';
import ideaFieldStyles from '@/components/page/gantry/shared/IdeaFormFields.module.scss';

import { findNewsByUrl, htmlToPlainText, isSafeHttpUrl } from './newsUrl';

export interface PostNewsFormData {
  title: string;
  body: string;
  url: string;
}

export interface PostNewsSubmission extends PostNewsFormData {
  /** The card's teaser, derived from the body so the two can't disagree. */
  summary: string | null;
}

/** Plain-text cap on the body. The type doc calls a news body "2–5 paragraphs";
 *  Gantry's 1,000 is a description, the forum's 32k is a document. */
export const BODY_MAX_LENGTH = 2000;

// A news post is short-form (bold / italic / underline, lists, a link) — the
// forum's headers and images are for documents, and the card only ever shows a
// two-line teaser of this anyway.
const NEWS_BODY_TOOLBAR: (string | Record<string, unknown>)[][] = [
  ['bold', 'italic', 'underline'],
  [{ list: 'bullet' }, { list: 'ordered' }],
  ['link'],
];

const getDefaults = (): PostNewsFormData => ({ title: '', body: '', url: '' });

const isDraftEmpty = (draft: PostNewsFormData) =>
  !draft.title.trim() && !hasRichTextContent(draft.body) && !draft.url.trim();

const formatWhen = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

interface Props {
  open: boolean;
  onClose: () => void;
  teamUid: string;
  teamName: string;
  /** This team's news as it stands — what the link is checked against. */
  existing: ITeamNewsItem[];
  onPublish: (post: PostNewsSubmission) => void;
}

/**
 * Compose one item of team news: a required headline, a formatted body, and
 * the required link the story lives at.
 *
 * A MODAL, not a page. The three-field shape is Gantry's "Submit idea" (title,
 * rich description, a few facts), and that ships as a modal in this exact
 * shell; the forum's full-page composer exists for long documents with a
 * category and an audience picker. And the person posting is standing on their
 * team's profile with the rail beside them — a page would take the profile
 * away to fill in three fields and then have to bring them back to it.
 *
 * The link is typed, never previewed. No unfurl card, no fetched title: the
 * headline is the author's, and the card shows the link only as its source
 * domain — the same meta line every enriched story wears.
 *
 * DUPLICATE LINK — blocked at the field, not on submit. The URL is checked as
 * it's typed against every outlet URL in this team's news (normalised: no www,
 * no trailing slash, no utm), and a hit names the story it already belongs to.
 * Post stays disabled until the link changes; there is no "post anyway",
 * because the second copy would sit two rows under the first.
 *
 * Drafts follow the product's autosave contract via production's own
 * `useFormDraft` (the hook Gantry's modal and the AI-apps feedback dialog use):
 * a visible Saving… / Saved status in the title row, the backdrop inert while
 * open, and an explicit Discard step — Cancel and Escape keep the draft.
 */
export function PostNewsModal({ open, onClose, teamUid, teamName, existing, onPublish }: Props) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = useRef<number | null>(null);

  const methods = useForm<PostNewsFormData>({ defaultValues: getDefaults(), mode: 'onChange' });
  const {
    handleSubmit,
    reset,
    control,
    formState: { isValid },
  } = methods;

  const title = useWatch({ control, name: 'title' }) ?? '';
  const body = useWatch({ control, name: 'body' }) ?? '';
  const url = useWatch({ control, name: 'url' }) ?? '';

  const hasDraft = !isDraftEmpty({ title, body, url });
  const bodyLength = htmlToPlainText(body).length;
  const bodyTooLong = bodyLength > BODY_MAX_LENGTH;

  const { clearDraft } = useFormDraft<PostNewsFormData, PostNewsFormData>({
    storageKey: `team-news-post:${teamUid}`,
    enabled: open,
    methods,
    getDefaults,
    toDraft: (form) => form,
    fromDraft: (draft) => ({ ...getDefaults(), ...draft }),
    isEmpty: isDraftEmpty,
    // A restored draft is already on disk, so it opens as Saved rather than
    // idle — the status has to be true of the text on screen.
    onRestore: (draft) => setSaveStatus(draft ? 'saved' : 'idle'),
  });

  // The hook writes silently; this mirrors its debounce so the status flips
  // when the write lands. Skip the first pass (the restore) — that's handled
  // by onRestore above.
  const skipFirst = useRef(true);
  useEffect(() => {
    if (!open) {
      skipFirst.current = true;
      return;
    }
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (!hasDraft) {
      setSaveStatus('idle');
      return;
    }
    setSaveStatus('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaveStatus('saved'), 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, body, url]);

  const validateUrl = useCallback(
    (value: string) => {
      if (!value?.trim()) return 'Required';
      if (!isSafeHttpUrl(value)) return 'Enter the full link, starting with https://';
      const hit = findNewsByUrl(existing, value);
      if (hit) return `Already in ${teamName} news: “${hit.title}” (${formatWhen(hit.eventDate)})`;
      return true;
    },
    [existing, teamName],
  );

  const handleDiscard = () => {
    clearDraft();
    reset(getDefaults());
    setSaveStatus('idle');
    setDiscardOpen(false);
    onClose();
  };

  const onSubmit = (data: PostNewsFormData) => {
    const bodyHtml = hasRichTextContent(data.body) ? data.body : '';
    onPublish({
      title: data.title.trim(),
      body: bodyHtml,
      url: data.url.trim(),
      summary: bodyHtml ? htmlToPlainText(bodyHtml) : null,
    });
    clearDraft();
    reset(getDefaults());
    setSaveStatus('idle');
    onClose();
  };

  return (
    <>
      {/* Backdrop inert while open (closeOnBackdropClick={false}) — a stray click
          outside a half-written post must not close it. Escape and Cancel still
          do, and keep the draft. */}
      <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false}>
        <div className={ideaModalStyles.root}>
          <div className={dealModalStyles.header}>
            <div className={dealModalStyles.headerText}>
              <div className={ideaModalStyles.titleRow}>
                <h2 className={dealModalStyles.title}>Post news</h2>
                <DraftSaveStatus status={saveStatus} />
              </div>
              {/* The one thing the form can't show: where this goes, and under
                  whose name. */}
              <p className={dealModalStyles.subtitle}>
                Published as {teamName}, to its followers and the network feed.
              </p>
            </div>
            <button type="button" className={dealModalStyles.closeButton} onClick={onClose} aria-label="Close">
              <CloseIcon width={20} height={20} color="#0a0c11" />
            </button>
          </div>

          <div className={dealModalStyles.content}>
            <FormProvider {...methods}>
              <div className={dealModalStyles.form}>
                <div className={ideaFieldStyles.titleField}>
                  <FormField
                    name="title"
                    label="Headline"
                    placeholder="What happened, in one line"
                    isRequired
                    max={TITLE_MAX_LENGTH}
                    maxLength={TITLE_MAX_LENGTH}
                    rules={{
                      validate: (value: string) => (value?.trim() ? true : 'Required'),
                    }}
                  />
                </div>

                <div className={ideaFieldStyles.descriptionField}>
                  <FormEditor
                    name="body"
                    label="Body (optional)"
                    placeholder="The details — what it is, why it matters, what happens next."
                    simplified
                    toolbarConfig={NEWS_BODY_TOOLBAR}
                    minHeight={120}
                    maxLength={BODY_MAX_LENGTH}
                    showCharCount
                  />
                </div>

                <FormField
                  name="url"
                  label="Link"
                  placeholder="https://"
                  isRequired
                  inputMode="url"
                  description="Shown as the source on the card."
                  rules={{ validate: validateUrl }}
                />
              </div>
            </FormProvider>
          </div>

          <div className={dealModalStyles.footer}>
            {hasDraft && (
              <button type="button" className={ideaModalStyles.discardDraftLink} onClick={() => setDiscardOpen(true)}>
                Discard draft
              </button>
            )}
            <Button style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={!isValid || bodyTooLong}>
              Post
            </Button>
          </div>
        </div>
      </Modal>

      <DiscardDraftDialog
        isOpen={discardOpen}
        draftTitle={title.trim() || 'this post'}
        onKeep={() => setDiscardOpen(false)}
        onDiscard={handleDiscard}
      />
    </>
  );
}

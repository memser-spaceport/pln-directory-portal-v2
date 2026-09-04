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
import { findNewsByUrl, htmlToPlainText, isSafeHttpUrl } from '@/services/team-news/newsUrl';

import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import ideaModalStyles from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';
import ideaFieldStyles from '@/components/page/gantry/shared/IdeaFormFields.module.scss';

export interface PostNewsFormData {
  title: string;
  body: string;
  url: string;
}

export interface PostNewsSubmission {
  title: string;
  body: string;
  url: string;
}

export const BODY_MAX_LENGTH = 2000;

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
  existing: ITeamNewsItem[];
  onPublish: (post: PostNewsSubmission) => void | Promise<void>;
  isPublishing?: boolean;
}

export function PostNewsModal({ open, onClose, teamUid, teamName, existing, onPublish, isPublishing = false }: Props) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = useRef<number | null>(null);

  const methods = useForm<PostNewsFormData>({ defaultValues: getDefaults(), mode: 'onChange' });
  const {
    handleSubmit,
    reset,
    control,
    formState: { isValid },
    setError,
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
    onRestore: (draft) => setSaveStatus(draft ? 'saved' : 'idle'),
  });

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
  }, [open, title, body, url, hasDraft]);

  const validateUrl = useCallback(
    (value: string) => {
      if (!value?.trim()) return 'Required';
      if (!isSafeHttpUrl(value)) return 'Enter the full link, starting with https://';
      const hit = findNewsByUrl(existing, value);
      if (hit) return `Already in ${teamName} news: "${hit.title}" (${formatWhen(hit.eventDate)})`;
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

  const onSubmit = async (data: PostNewsFormData) => {
    try {
      await onPublish({
        title: data.title.trim(),
        body: hasRichTextContent(data.body) ? data.body : '',
        url: data.url.trim(),
      });
      clearDraft();
      reset(getDefaults());
      setSaveStatus('idle');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post news';
      if (message.toLowerCase().includes('already in')) {
        setError('url', { type: 'server', message });
      }
    }
  };

  return (
    <>
      <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false}>
        <div className={ideaModalStyles.root}>
          <div className={dealModalStyles.header}>
            <div className={dealModalStyles.headerText}>
              <div className={ideaModalStyles.titleRow}>
                <h2 className={dealModalStyles.title}>Post news</h2>
                <DraftSaveStatus status={saveStatus} />
              </div>
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
            <Button onClick={handleSubmit(onSubmit)} disabled={!isValid || bodyTooLong || isPublishing}>
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

'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { FormSelect } from '@/components/form/FormSelect';
import { useFormDraft } from '@/hooks/useFormDraft';
import { DraftSaveStatus } from '@/components/page/gantry/ideas/SubmitIdeaModal/DraftSaveStatus';
import { DiscardDraftDialog } from '@/components/page/gantry/ideas/DiscardDraftDialog';
import { hasRichTextContent, TITLE_MAX_LENGTH } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { findNewsByUrl, htmlToPlainText, isSafeHttpUrl } from '@/services/team-news/newsUrl';

import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import ideaModalStyles from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';
import ideaFieldStyles from '@/components/page/gantry/shared/IdeaFormFields.module.scss';
import local from './PostNewsModal.module.scss';

export interface PostNewsFormData {
  title: string;
  body: string;
  url: string;
}

export interface PostNewsSubmission {
  /** The team the post goes to: `teamUid`, or the "Post as" choice. */
  teamUid: string;
  title: string;
  body: string;
  url: string;
}

/** One team in "Post as" (LAB-3342). */
export interface PostNewsTeamChoice {
  uid: string;
  name: string;
  logoUrl?: string | null;
}

type TeamOption = { value: string; label: string };

/** A "Post as" row: the team logo, then the name. The same row in the list and in the chosen value. */
function TeamOptionRow({ logoUrl, label }: { logoUrl?: string | null; label: ReactNode }) {
  return (
    <span className={local.teamOption}>
      {logoUrl ? <img className={local.teamLogo} src={logoUrl} alt="" /> : null}
      <span className={local.teamOptionName}>{label}</span>
    </span>
  );
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
  /**
   * The teams the poster may post as (LAB-3342). With more than one, "Post as" shows on top of the form (the LAB-3202
   * pattern) and starts on `teamUid`. One or none: the form is for `teamUid`, as before.
   */
  teamChoices?: PostNewsTeamChoice[];
}

export function PostNewsModal({
  open,
  onClose,
  teamUid,
  teamName,
  existing,
  onPublish,
  isPublishing = false,
  teamChoices = [],
}: Props) {
  const several = teamChoices.length > 1;
  const teamOptions: TeamOption[] = useMemo(
    () => teamChoices.map((c) => ({ value: c.uid, label: c.name })),
    [teamChoices],
  );
  const optionFor = useCallback(
    (uid: string) => teamOptions.find((o) => o.value === uid) ?? teamOptions[0] ?? null,
    [teamOptions],
  );
  const logoOf = (uid: string) => teamChoices.find((c) => c.uid === uid)?.logoUrl;

  // The team is not part of the draft: it is where the post goes. A change of team keeps the text.
  const teamMethods = useForm<{ postAs: TeamOption | null }>({
    defaultValues: { postAs: several ? optionFor(teamUid) : null },
  });
  const pickedOption = useWatch({ control: teamMethods.control, name: 'postAs' });
  useEffect(() => {
    if (open && several) teamMethods.reset({ postAs: optionFor(teamUid) });
    // Opens on `teamUid` each time; a choice made while open stays until the form closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, several, teamUid]);
  const target = several
    ? (teamChoices.find((c) => c.uid === pickedOption?.value) ?? null)
    : { uid: teamUid, name: teamName };
  const targetUid = target?.uid ?? '';
  const targetName = target?.name ?? '';

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
    // "Post as": one draft for all the poster's teams, so a change of team never swaps the text out.
    storageKey: several ? 'team-news-post:lead-teams' : `team-news-post:${teamUid}`,
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
      // "Post as": `existing` may hold every team's news, and only the chosen team's can be a duplicate.
      const hit = findNewsByUrl(several ? existing.filter((item) => item.teamUid === targetUid) : existing, value);
      if (hit) return `Already in ${targetName} news: "${hit.title}" (${formatWhen(hit.eventDate)})`;
      return true;
    },
    [existing, several, targetUid, targetName],
  );

  const handleDiscard = () => {
    clearDraft();
    reset(getDefaults());
    setSaveStatus('idle');
    setDiscardOpen(false);
    onClose();
  };

  // The duplicate check depends on the team: check the link again for a new choice.
  const { trigger, getValues } = methods;
  useEffect(() => {
    if (several && getValues('url')?.trim()) void trigger('url');
  }, [several, targetUid, trigger, getValues]);

  const onSubmit = async (data: PostNewsFormData) => {
    if (!targetUid) return;
    try {
      await onPublish({
        teamUid: targetUid,
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
                Published as {targetName}, to its followers and the network feed.
              </p>
            </div>
            <button type="button" className={dealModalStyles.closeButton} onClick={onClose} aria-label="Close">
              <CloseIcon width={20} height={20} color="#0a0c11" />
            </button>
          </div>

          <div className={dealModalStyles.content}>
            {several && (
              <FormProvider {...teamMethods}>
                <div className={local.postAsField}>
                  <FormSelect
                    name="postAs"
                    label="Post as"
                    placeholder="Select a team"
                    isRequired
                    disabled={isPublishing}
                    options={teamOptions}
                    renderOption={({ option, label }) => <TeamOptionRow logoUrl={logoOf(option.value)} label={label} />}
                    formatOptionLabel={(option) => (
                      <TeamOptionRow logoUrl={logoOf(option.value)} label={option.label} />
                    )}
                  />
                </div>
              </FormProvider>
            )}
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
            {hasDraft && !isPublishing && (
              <button type="button" className={ideaModalStyles.discardDraftLink} onClick={() => setDiscardOpen(true)}>
                Discard draft
              </button>
            )}
            {/* While the post is sent, Cancel is off too: the post can't be called back (LAB-3342). */}
            <Button style="border" variant="neutral" onClick={onClose} disabled={isPublishing}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={!targetUid || !isValid || bodyTooLong || isPublishing}>
              {isPublishing ? 'Posting…' : 'Post'}
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

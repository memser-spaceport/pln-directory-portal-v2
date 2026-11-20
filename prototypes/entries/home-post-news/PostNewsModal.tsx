'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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

import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import ideaModalStyles from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';
import ideaFieldStyles from '@/components/page/gantry/shared/IdeaFormFields.module.scss';

// The prototype copy of `services/team-news/newsUrl` (pure functions; a prototype imports no `services/`).
import { findNewsByUrl, htmlToPlainText, isSafeHttpUrl } from '../team-profile/newsUrl';
import local from './HomePostNews.module.scss';

/**
 * COPY of production `PostNewsModal`
 * (components/page/team-details/TeamNews/PostNewsModal/PostNewsModal.tsx).
 * Regenerate from production, then apply only these deltas:
 *
 * 1. "Post as" on top (`teamChoices`, more than one team): the LAB-3202 pattern,
 *    "the same UI with a team picker on top", in the look of the team-profile
 *    prototype's picker. It opens on the lead's main team (`initialTeamUid`),
 *    and the subtitle names that team, so the choice stays in view (Polina,
 *    PR #3613). Each option and the chosen value show the team logo
 *    (`formatOptionLabel` for the value, `renderOption` for the list).
 * 2. While `isPublishing`, Post reads "Posting…" and Cancel is off too.
 *    Production only disables Post.
 * 3. `prefill`: the review band opens the form already filled, for "Posting".
 * 4. `newsUrl` from the prototype copy, not `services/`.
 */

/** One "Post as" row: the team logo, then the name. */
function TeamOptionRow({ logoUrl, label }: { logoUrl?: string; label: ReactNode }) {
  return (
    <span className={local.teamOption}>
      {logoUrl && <img className={local.teamLogo} src={logoUrl} alt="" />}
      <span className={local.teamName}>{label}</span>
    </span>
  );
}

export interface PostNewsFormData {
  title: string;
  body: string;
  url: string;
}

export interface PostNewsSubmission extends PostNewsFormData {
  teamUid: string;
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

type TeamOption = { value: string; label: string };

interface Props {
  open: boolean;
  onClose: () => void;
  /** The teams the viewer leads. One: the form is for it. More: "Post as" on top. */
  teamChoices: { uid: string; name: string; logoUrl?: string }[];
  /** The team "Post as" opens on: the lead's main team. */
  initialTeamUid?: string;
  existing: ITeamNewsItem[];
  onPublish: (post: PostNewsSubmission) => void | Promise<void>;
  isPublishing?: boolean;
  prefill?: PostNewsFormData;
}

export function PostNewsModal({
  open,
  onClose,
  teamChoices,
  initialTeamUid = '',
  existing,
  onPublish,
  isPublishing = false,
  prefill,
}: Props) {
  const several = teamChoices.length > 1;
  const teamOptions: TeamOption[] = teamChoices.map((c) => ({ value: c.uid, label: c.name }));
  const logoOf = (uid: string) => teamChoices.find((c) => c.uid === uid)?.logoUrl;
  const findOption = (uid: string) => teamOptions.find((o) => o.value === uid) ?? null;

  // The team is not part of the post's draft: it is where the post goes.
  const teamMethods = useForm<{ postAs: TeamOption | null }>({
    defaultValues: { postAs: several ? findOption(initialTeamUid) : null },
  });
  const pickedOption = useWatch({ control: teamMethods.control, name: 'postAs' });
  const team = several ? (teamChoices.find((c) => c.uid === pickedOption?.value) ?? null) : (teamChoices[0] ?? null);

  useEffect(() => {
    if (open) teamMethods.reset({ postAs: several ? findOption(initialTeamUid) : null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTeamUid]);

  const [discardOpen, setDiscardOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = useRef<number | null>(null);

  const methods = useForm<PostNewsFormData>({ defaultValues: getDefaults(), mode: 'onChange' });
  const {
    handleSubmit,
    reset,
    control,
    trigger,
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
    // One draft across teams, so a change of team never swaps the text out.
    storageKey: several ? 'proto-home-news-post:any-team' : `proto-home-news-post:${teamChoices[0]?.uid ?? ''}`,
    enabled: open && !prefill,
    methods,
    getDefaults,
    toDraft: (form) => form,
    fromDraft: (draft) => ({ ...getDefaults(), ...draft }),
    isEmpty: isDraftEmpty,
    onRestore: (draft) => setSaveStatus(draft ? 'saved' : 'idle'),
  });

  // Review states: open on the sample post, validated, so Post shows its real state.
  useEffect(() => {
    if (!open || !prefill) return;
    reset(prefill);
    void trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill]);

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

  const teamName = team?.name ?? '';
  const validateUrl = useCallback(
    (value: string) => {
      if (!value?.trim()) return 'Required';
      if (!isSafeHttpUrl(value)) return 'Enter the full link, starting with https://';
      const hit = findNewsByUrl(
        existing.filter((i) => i.teamUid === team?.uid),
        value,
      );
      if (hit) return `Already in ${teamName} news: "${hit.title}" (${formatWhen(hit.eventDate)})`;
      return true;
    },
    [existing, team?.uid, teamName],
  );

  const handleDiscard = () => {
    clearDraft();
    reset(getDefaults());
    setSaveStatus('idle');
    setDiscardOpen(false);
    onClose();
  };

  const onSubmit = async (data: PostNewsFormData) => {
    if (!team) return;
    try {
      await onPublish({
        teamUid: team.uid,
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
                {team
                  ? `Published as ${team.name}, to its followers and the network feed.`
                  : 'Published as the team you pick, to its followers and the network feed.'}
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
            <Button style="border" variant="neutral" onClick={onClose} disabled={isPublishing}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={!team || !isValid || bodyTooLong || isPublishing}>
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

'use client';

import { useState } from 'react';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { FileUploader } from '@/components/ui/FileUploader/FileUploader';
import { isHtmlDocument } from '@/components/page/ai-apps/components/PrdContent';
import { AiApp, hasPrd } from '@/services/ai-apps/ai-apps.service';
import { useUpdateAiApp } from '@/services/ai-apps/hooks/useUpdateAiApp';
import { useUpdateAiAppFile } from '@/services/ai-apps/hooks/useUpdateAiAppFile';
import { formatFileSize } from '@/utils/file.utils';

import s from './EditAiAppModal.module.scss';

/**
 * `existing` mirrors the currently stored one-pager (read-only text, for the
 * format/size preview — never re-sent to the backend). `file` is a freshly
 * chosen upload that will PATCH as multipart on save; its content is never
 * read client-side, only its name/size for the preview card.
 */
type PrdState = { kind: 'existing'; text: string } | { kind: 'file'; file: File };

interface Props {
  app: AiApp;
  onClose: () => void;
}

const PRD_MAX_MB = 1;

function prdFormatBadge(state: PrdState): string {
  if (state.kind === 'existing') {
    return isHtmlDocument(state.text) ? 'HTML' : 'MD';
  }
  const ext = state.file.name.split('.').pop()?.toLowerCase();
  return ext === 'html' || ext === 'htm' ? 'HTML' : 'MD';
}

function prdByteSize(state: PrdState): number {
  return state.kind === 'existing' ? new TextEncoder().encode(state.text).length : state.file.size;
}

/**
 * "Edit details" — name, description, and the optional one-pager. Plain
 * metadata saves are a JSON PATCH; setting or replacing the one-pager is a
 * multipart PATCH carrying the file itself (`-F file=@one-pager.md`) — the
 * backend derives `prd` from the file's contents, so its bytes are never
 * read or re-encoded client-side. Removing a one-pager still clears it with
 * an explicit JSON `prd: null` (multipart can't carry a null).
 *
 * Rendered only while open, so all state seeds fresh from `app` on mount —
 * a list refetch mid-edit can't reset the form.
 */
export function EditAiAppModal({ app, onClose }: Props) {
  const analytics = useAiAppsAnalytics();
  const { mutateAsync: savePatch, isPending: isSavingPatch } = useUpdateAiApp(app.uid);
  const { mutateAsync: saveFile, isPending: isSavingFile } = useUpdateAiAppFile(app.uid);
  const isSaving = isSavingPatch || isSavingFile;

  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description);
  const [prd, setPrd] = useState<PrdState | null>(() => (hasPrd(app) ? { kind: 'existing', text: app.prd as string } : null));
  // Bumped on Remove so the FileUploader remounts with fresh internal state.
  const [uploaderKey, setUploaderKey] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hadInitialPrd = hasPrd(app);

  const handleUpload = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setPrd({ kind: 'file', file });
  };

  const handleRemove = () => {
    setPrd(null);
    setUploaderKey((k) => k + 1);
  };

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const nameError = trimmedName.length === 0 ? 'Name is required.' : null;

  const handleSave = async () => {
    if (nameError || isSaving) return;

    setSaveError(null);

    // A freshly chosen file always goes through the multipart route — the
    // backend reads the one-pager from the file itself, never from JSON text.
    const result =
      prd?.kind === 'file'
        ? await saveFile({ name: trimmedName, description: trimmedDescription, file: prd.file })
        : await savePatch({
            name: trimmedName,
            description: trimmedDescription,
            // Only ship `prd` when clearing a one-pager that existed before —
            // an unchanged `existing` one-pager is never re-sent.
            ...(prd === null && hadInitialPrd ? { prd: null } : {}),
          });

    if (result.error) {
      setSaveError(result.error);
      analytics.onEditDetailsFailed(app.uid);
      return;
    }
    analytics.onEditDetailsSaved(app.uid);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.title}>Edit details</h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className={s.body}>
          <label className={s.field}>
            <span className={s.label}>Name</span>
            <input
              className={s.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="App name"
              disabled={isSaving}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'ai-app-name-error' : undefined}
            />
            {nameError && (
              <span id="ai-app-name-error" className={s.errorText}>
                {nameError}
              </span>
            )}
          </label>

          <label className={s.field}>
            <span className={s.label}>Description</span>
            <textarea
              className={s.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What does this app do?"
              disabled={isSaving}
            />
          </label>

          <div className={s.field}>
            <span className={s.label}>1-pager (HTML or Markdown)</span>
            <p className={s.helpText}>
              Anyone viewing the app will be able to open it from the list. Saving here never redeploys the app.
            </p>
            {prd ? (
              <div className={s.fileCard}>
                <div className={s.thumb}>
                  <span className={s.thumbFallback}>{prdFormatBadge(prd)}</span>
                </div>
                <div className={s.fileMeta}>
                  <p className={s.fileName}>{prd.kind === 'file' ? prd.file.name : 'One-pager'}</p>
                  <p className={s.fileSize}>
                    {prdFormatBadge(prd) === 'HTML' ? 'HTML' : 'Markdown'} - {formatFileSize(prdByteSize(prd))}
                  </p>
                </div>
                <button type="button" className={s.removeBtn} onClick={handleRemove} disabled={isSaving}>
                  Remove
                </button>
              </div>
            ) : (
              <FileUploader
                key={uploaderKey}
                title="Upload a 1-pager"
                description={`HTML or Markdown up to ${PRD_MAX_MB}MB. Anyone viewing the app will be able to open it.`}
                supportedFormats={['HTML', 'MD']}
                maxFiles={1}
                maxFileSize={PRD_MAX_MB}
                onUpload={handleUpload}
                disabled={isSaving}
              />
            )}
          </div>

          {saveError && <p className={s.errorText}>{saveError}</p>}
        </div>

        <div className={s.footer}>
          <Button style="border" variant="neutral" size="s" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button style="fill" variant="primary" size="s" onClick={handleSave} disabled={!!nameError || isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

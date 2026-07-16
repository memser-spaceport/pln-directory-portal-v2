'use client';

import { useState } from 'react';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { FileUploader } from '@/components/ui/FileUploader/FileUploader';
import { isHtmlDocument } from '@/components/page/ai-apps/components/PrdContent';
import { AiApp, hasPrd, UpdateAiAppPatch } from '@/services/ai-apps/ai-apps.service';
import { useUpdateAiApp } from '@/services/ai-apps/hooks/useUpdateAiApp';
import { formatFileSize } from '@/utils/file.utils';

import s from './EditAiAppModal.module.scss';

interface PrdDraft {
  /** The one-pager text that will be PATCHed as `prd`. */
  text: string;
  /** Original file name when the text came from an upload this session. */
  fileName: string | null;
}

interface Props {
  app: AiApp;
  onClose: () => void;
}

const PRD_MAX_MB = 1;

function prdFormatBadge(draft: PrdDraft): string {
  return isHtmlDocument(draft.text) ? 'HTML' : 'MD';
}

function prdByteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * "Edit details" — name, description, and the optional one-pager. Saves are
 * metadata-only (a plain JSON PATCH): they never trigger a redeploy. The
 * one-pager is stored as MD/HTML *text*; an uploaded file is read client-side
 * into that text, and Remove clears it with an explicit `prd: null`.
 *
 * Rendered only while open, so all state seeds fresh from `app` on mount —
 * a list refetch mid-edit can't reset the form.
 */
export function EditAiAppModal({ app, onClose }: Props) {
  const analytics = useAiAppsAnalytics();
  const { mutateAsync: saveApp, isPending: isSaving } = useUpdateAiApp(app.uid);

  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description);
  const [prd, setPrd] = useState<PrdDraft | null>(() => (hasPrd(app) ? { text: app.prd as string, fileName: null } : null));
  // Bumped on Remove so the FileUploader remounts with fresh internal state.
  const [uploaderKey, setUploaderKey] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const initialPrdText = hasPrd(app) ? (app.prd as string) : null;

  const handleUpload = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploadError(null);
    file
      .text()
      .then((text) => {
        if (!text.trim()) {
          setUploadError('That file is empty.');
          setUploaderKey((k) => k + 1);
          return;
        }
        setPrd({ text, fileName: file.name });
      })
      .catch(() => {
        setUploadError('Could not read that file. Please try another one.');
        setUploaderKey((k) => k + 1);
      });
  };

  const handleRemove = () => {
    setPrd(null);
    setUploadError(null);
    setUploaderKey((k) => k + 1);
  };

  const trimmedName = name.trim();
  const nameError = trimmedName.length === 0 ? 'Name is required.' : null;

  const handleSave = async () => {
    if (nameError || isSaving) return;

    setSaveError(null);
    const patch: UpdateAiAppPatch = { name: trimmedName, description: description.trim() };
    // Only ship `prd` when it actually changed — null is the explicit
    // "clear the stored one-pager" signal, so it must not ride along idly.
    if ((prd?.text ?? null) !== initialPrdText) {
      patch.prd = prd?.text ?? null;
    }

    const result = await saveApp(patch);
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
                  <p className={s.fileName}>{prd.fileName ?? 'One-pager'}</p>
                  <p className={s.fileSize}>
                    {prdFormatBadge(prd) === 'HTML' ? 'HTML' : 'Markdown'} - {formatFileSize(prdByteSize(prd.text))}
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
            {uploadError && <p className={s.errorText}>{uploadError}</p>}
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

'use client';

import { useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { FileUploader } from '@/components/ui/FileUploader/FileUploader';
import { formatFileSize } from '@/utils/file.utils';

import type { AiAppWithDoc, OnePager } from './mocks';

import s from './ManageAppModal.module.scss';

interface Props {
  isOpen: boolean;
  app: AiAppWithDoc;
  onClose: () => void;
  onSave: (app: AiAppWithDoc) => void;
}

function revokeOnePagerUrls(doc: OnePager | null): void {
  if (!doc) return;
  if (doc.fileUrl?.startsWith('blob:')) URL.revokeObjectURL(doc.fileUrl);
  if (doc.previewDataUrl?.startsWith('blob:')) URL.revokeObjectURL(doc.previewDataUrl);
}

function onePagerFormatLabel(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'md' || ext === 'markdown') return 'Markdown';
  if (ext === 'html' || ext === 'htm') return 'HTML';
  return ext?.toUpperCase() ?? 'File';
}

function onePagerFormatBadge(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'md' || ext === 'markdown') return 'MD';
  if (ext === 'html' || ext === 'htm') return 'HTML';
  return ext?.toUpperCase() ?? 'FILE';
}

export function ManageAppModal(props: Props) {
  const { isOpen, app, onClose, onSave } = props;

  // The draft is seeded once from `app`. The parent remounts this component
  // (via a changing `key`) each time the modal opens, so the draft always
  // starts fresh from the current app without a state-syncing effect.
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description);
  const [onePager, setOnePager] = useState<OnePager | null>(app.onePager ?? null);
  // Bumped on Remove so the FileUploader remounts with fresh internal state.
  const [uploaderKey, setUploaderKey] = useState(0);

  // Mock upload: no S3. Keep a local blob URL for viewing. Production would
  // POST to a presigned URL.
  const handleUpload = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    revokeOnePagerUrls(onePager);
    setOnePager({ fileName: file.name, fileSize: file.size, fileUrl });
  };

  const handleRemove = () => {
    revokeOnePagerUrls(onePager);
    setOnePager(null);
    setUploaderKey((k) => k + 1);
  };

  const trimmedName = name.trim();
  const nameError = trimmedName.length === 0 ? 'Name is required.' : null;

  const handleSave = () => {
    if (nameError) return;

    onSave({
      ...app,
      name: trimmedName,
      description: description.trim(),
      onePager: onePager ?? undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.title}>Manage app</h2>
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
            />
          </label>

          <div className={s.field}>
            <span className={s.label}>1-pager (HTML or Markdown)</span>
            <p className={s.helpText}>
              Mock upload only. The file is stored in local prototype state and becomes visible to visitors immediately
              after saving.
            </p>
            {onePager ? (
              <div className={s.fileCard}>
                <div className={s.thumb}>
                  {onePager.previewDataUrl ? (
                    <img className={s.thumbImg} src={onePager.previewDataUrl} alt="" />
                  ) : (
                    <span className={s.thumbFallback}>{onePagerFormatBadge(onePager.fileName)}</span>
                  )}
                </div>
                <div className={s.fileMeta}>
                  <p className={s.fileName}>{onePager.fileName}</p>
                  <p className={s.fileSize}>
                    {onePagerFormatLabel(onePager.fileName)} - {formatFileSize(onePager.fileSize)}
                  </p>
                </div>
                <button type="button" className={s.removeBtn} onClick={handleRemove}>
                  Remove
                </button>
              </div>
            ) : (
              <FileUploader
                key={uploaderKey}
                title="Upload a 1-pager"
                description="HTML or Markdown up to 10MB. Anyone viewing the app will be able to open it."
                supportedFormats={['HTML', 'MD']}
                maxFiles={1}
                maxFileSize={10}
                onUpload={handleUpload}
              />
            )}
          </div>
        </div>

        <div className={s.footer}>
          <Button style="border" variant="neutral" size="s" onClick={onClose}>
            Cancel
          </Button>
          <Button style="fill" variant="primary" size="s" onClick={handleSave} disabled={!!nameError}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

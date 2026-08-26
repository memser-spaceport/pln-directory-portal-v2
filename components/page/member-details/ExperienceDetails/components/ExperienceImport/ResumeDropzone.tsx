'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { CloseIcon } from '@/components/icons';
import { formatFileSize } from '@/utils/file.utils';
// Chrome is `FileUploader`'s own stylesheet, imported rather than re-typed — the
// 16px row, its hover and `dragOver` borders, the 40px icon disc, the Upload
// button's inset shadow, the file row and the error strip. Only the ✕ changes.
import s from '@/components/ui/FileUploader/FileUploader.module.scss';
// The mobile layout only — see the note in the file. `FileUploader` stacks the
// disc, the text and the button; in this drawer the first two sit on one row.
import m from './ResumeDropzone.module.scss';

/**
 * `FileUploader`, narrowed to one document, with one deliberate substitution:
 * the file row's remove ✕.
 *
 * `FileUploader` draws it with a local `CloseIcon` that is a *filled* heavy
 * cross inheriting `--text-secondary`. Every other ✕ in this flow is the DS
 * `CloseIcon`: a 1.5px stroked ✕ taking its tone from `currentColor`. Two glyphs
 * for one action is two controls as far as the eye is concerned — the same swap,
 * for the same reason, as `SkillsTagsInput`.
 *
 * Narrowed, and said out loud rather than done quietly: **one file, no video
 * preview.** A résumé is singular, so `maxFiles`, the file *list* and the
 * `showVideoPreview` branch are all answering a question this surface doesn't
 * have. The validation rules and their exact error strings are `FileUploader`'s,
 * word for word, so a rejected file reads the same here as anywhere else.
 *
 * The client-side check is a courtesy, not a control — the server validates the
 * type and size independently of anything decided here.
 */
interface ResumeDropzoneProps {
  title: string;
  description: string;
  /** e.g. ['PDF', 'DOC', 'DOCX'] — extensions, upper case, as `FileUploader` takes them. */
  supportedFormats: string[];
  /** In MB. */
  maxFileSize: number;
  /** The file already chosen, if any. Owned by the parent — see the panel. */
  file: File | null;
  /**
   * A file chosen somewhere else — the "Update from CV" control in the section
   * header, which owns its own input so the OS picker opens on the click itself
   * rather than one render later.
   *
   * It is handed *here* rather than straight to the parser so that a file picked
   * from the header meets the same size and extension rules, and fails into the
   * same inline error, as one dropped on this box. Two entry points may share a
   * validator or they will eventually disagree about what a valid CV is.
   */
  externalFile?: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function ResumeDropzone(props: ResumeDropzoneProps) {
  const {
    title,
    description,
    supportedFormats,
    maxFileSize,
    file,
    externalFile,
    onSelect,
    onRemove,
    disabled = false,
  } = props;

  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* `FileUploader`'s `validateFile`, verbatim — including the two message
     strings, which is the half a reader actually meets. */
  const validateFile = (candidate: File): string | null => {
    const fileSizeInMB = candidate.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSize) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    const fileExtension = candidate.name.split('.').pop()?.toUpperCase();
    if (!fileExtension || !supportedFormats.map((f) => f.toUpperCase()).includes(fileExtension)) {
      return `File format must be one of: ${supportedFormats.join(', ')}`;
    }

    return null;
  };

  const handleFile = (candidate: File | undefined) => {
    if (!candidate) return;
    const validationError = validateFile(candidate);
    if (validationError) {
      setError(`${candidate.name}: ${validationError}`);
      return;
    }
    setError(null);
    onSelect(candidate);
  };

  /* Keyed on the File's identity, not its name: picking the same file twice in a
     row makes a new File object (the input's value is cleared after each read),
     so a second attempt at the same document still runs. */
  useEffect(() => {
    if (externalFile) handleFile(externalFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalFile]);

  const acceptedTypes = supportedFormats.map((format) => `.${format.toLowerCase()}`).join(',');

  return (
    <div>
      <div
        className={clsx(s.container, m.container, { [s.dragOver]: dragOver })}
        onDragOver={(ev) => {
          ev.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={(ev) => {
          ev.preventDefault();
          setDragOver(false);
        }}
        onDrop={(ev) => {
          ev.preventDefault();
          setDragOver(false);
          if (disabled) return;
          handleFile(ev.dataTransfer.files?.[0]);
        }}
      >
        <div className={s.iconWrapper}>
          <UploadIcon className={s.icon} />
        </div>

        <div className={clsx(s.content, m.content)}>
          <h3 className={s.title}>{title}</h3>
          <p className={s.description}>{description}</p>
        </div>

        <button
          type="button"
          className={clsx(s.uploadButton, m.uploadButton)}
          onClick={() => {
            if (!disabled) inputRef.current?.click();
          }}
          disabled={disabled}
        >
          Upload
        </button>

        <input
          ref={inputRef}
          type="file"
          className={s.hiddenInput}
          onChange={(ev) => {
            handleFile(ev.target.files?.[0]);
            /* Reset so the same file can be picked twice — which matters here,
               since "try again" is a real path out of both dead ends. */
            if (inputRef.current) inputRef.current.value = '';
          }}
          accept={acceptedTypes}
          disabled={disabled}
        />
      </div>

      {file && (
        <div className={s.fileList}>
          <div className={s.fileItem}>
            <div className={s.fileInfo}>
              <div className={s.fileName}>{file.name}</div>
              <div className={s.fileSize}>{formatFileSize(file.size)}</div>
            </div>
            <button
              type="button"
              className={s.removeButton}
              onClick={() => {
                setError(null);
                onRemove();
              }}
              aria-label={`Remove ${file.name}`}
              disabled={disabled}
            >
              {/* The one substitution. See the note above. */}
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      {error && <div className={s.errorMessage}>{error}</div>}
    </div>
  );
}

/** `FileUploader`'s own upload glyph, copied so the disc reads identically. */
const UploadIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M23.2504 12C23.2551 13.7861 22.6757 15.5248 21.6004 16.9509C21.5412 17.0297 21.467 17.0961 21.3822 17.1462C21.2973 17.1964 21.2034 17.2293 21.1058 17.2431C21.0082 17.257 20.9089 17.2514 20.8134 17.2269C20.7179 17.2023 20.6283 17.1592 20.5495 17.1C20.4707 17.0408 20.4043 16.9666 20.3542 16.8818C20.304 16.7969 20.2711 16.703 20.2573 16.6054C20.2434 16.5078 20.249 16.4085 20.2735 16.313C20.2981 16.2175 20.3412 16.1279 20.4004 16.0491C21.2806 14.883 21.7547 13.4609 21.7504 12C21.7504 10.2098 21.0392 8.4929 19.7734 7.22703C18.5075 5.96115 16.7906 5.25 15.0004 5.25C13.2102 5.25 11.4933 5.96115 10.2274 7.22703C8.96156 8.4929 8.2504 10.2098 8.2504 12C8.2504 12.1989 8.17138 12.3897 8.03073 12.5303C7.89008 12.671 7.69931 12.75 7.5004 12.75C7.30149 12.75 7.11072 12.671 6.97007 12.5303C6.82942 12.3897 6.7504 12.1989 6.7504 12C6.75003 11.2431 6.85382 10.4898 7.05884 9.76125C6.95665 9.75 6.85353 9.75 6.7504 9.75C5.55693 9.75 4.41234 10.2241 3.56842 11.068C2.72451 11.9119 2.2504 13.0565 2.2504 14.25C2.2504 15.4435 2.72451 16.5881 3.56842 17.432C4.41234 18.2759 5.55693 18.75 6.7504 18.75H9.0004C9.19931 18.75 9.39008 18.829 9.53073 18.9697C9.67138 19.1103 9.7504 19.3011 9.7504 19.5C9.7504 19.6989 9.67138 19.8897 9.53073 20.0303C9.39008 20.171 9.19931 20.25 9.0004 20.25H6.7504C5.92557 20.2502 5.10955 20.0803 4.35332 19.751C3.59709 19.4216 2.91688 18.9399 2.35519 18.3359C1.7935 17.7318 1.36238 17.0185 1.08876 16.2403C0.815145 15.4622 0.704907 14.636 0.764932 13.8134C0.824958 12.9907 1.05396 12.1893 1.43763 11.4591C1.8213 10.7289 2.3514 10.0857 2.99483 9.56961C3.63825 9.05351 4.38118 8.67562 5.17721 8.45954C5.97323 8.24346 6.80527 8.19383 7.62134 8.31375C8.45234 6.65171 9.8201 5.31888 11.5031 4.53115C13.1861 3.74342 15.0857 3.54693 16.8943 3.9735C18.7029 4.40007 20.3145 5.42472 21.4681 6.88148C22.6217 8.33824 23.2497 10.1418 23.2504 12ZM14.781 11.4694C14.7114 11.3996 14.6287 11.3443 14.5376 11.3066C14.4466 11.2688 14.349 11.2494 14.2504 11.2494C14.1518 11.2494 14.0542 11.2688 13.9632 11.3066C13.8721 11.3443 13.7894 11.3996 13.7198 11.4694L10.7198 14.4694C10.6501 14.5391 10.5948 14.6218 10.5571 14.7128C10.5194 14.8039 10.5 14.9015 10.5 15C10.5 15.0985 10.5194 15.1961 10.5571 15.2872C10.5948 15.3782 10.6501 15.4609 10.7198 15.5306C10.8605 15.6714 11.0514 15.7504 11.2504 15.7504C11.3489 15.7504 11.4465 15.731 11.5376 15.6933C11.6286 15.6556 11.7113 15.6003 11.781 15.5306L13.5004 13.8103V19.5C13.5004 19.6989 13.5794 19.8897 13.7201 20.0303C13.8607 20.171 14.0515 20.25 14.2504 20.25C14.4493 20.25 14.6401 20.171 14.7807 20.0303C14.9214 19.8897 15.0004 19.6989 15.0004 19.5V13.8103L16.7198 15.5306C16.7895 15.6003 16.8722 15.6556 16.9632 15.6933C17.0543 15.731 17.1519 15.7504 17.2504 15.7504C17.3489 15.7504 17.4465 15.731 17.5376 15.6933C17.6286 15.6556 17.7113 15.6003 17.781 15.5306C17.8507 15.4609 17.906 15.3782 17.9437 15.2872C17.9814 15.1961 18.0008 15.0985 18.0008 15C18.0008 14.9015 17.9814 14.8039 17.9437 14.7128C17.906 14.6218 17.8507 14.5391 17.781 14.4694L14.781 11.4694Z"
      fill="#455468"
    />
  </svg>
);

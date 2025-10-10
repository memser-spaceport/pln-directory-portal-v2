'use client';

import React, { useCallback, useState, useRef } from 'react';
import { clsx } from 'clsx';
import s from './FileUploader.module.scss';

interface FileUploaderProps {
  title: string;
  description: string;
  supportedFormats: string[]; // e.g., ['PDF', 'DOC', 'DOCX']
  maxFiles: number;
  maxFileSize: number; // in MB
  onUpload: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  showVideoPreview?: boolean; // Show video preview with 16:9 aspect ratio
}

interface UploadedFile {
  file: File;
  id: string;
  previewUrl?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ title, description, supportedFormats, maxFiles, maxFileSize, onUpload, disabled = false, className, showVideoPreview = false }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSize) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (!fileExtension || !supportedFormats.map((f) => f.toUpperCase()).includes(fileExtension)) {
      return `File format must be one of: ${supportedFormats.join(', ')}`;
    }

    return null;
  };

  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/');
  };

  const handleFiles = useCallback(
    (files: FileList) => {
      setError(null);
      const newFiles: UploadedFile[] = [];
      const errors: string[] = [];

      // Check total file count
      if (uploadedFiles.length + files.length > maxFiles) {
        setError(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`);
        return;
      }

      Array.from(files).forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
        } else {
          const uploadedFile: UploadedFile = {
            file,
            id: Math.random().toString(36).substr(2, 9),
          };

          // Create preview URL for video files if showVideoPreview is enabled
          if (showVideoPreview && isVideoFile(file)) {
            uploadedFile.previewUrl = URL.createObjectURL(file);
          }

          newFiles.push(uploadedFile);
        }
      });

      if (errors.length > 0) {
        setError(errors.join('; '));
        return;
      }

      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      onUpload(updatedFiles.map((f) => f.file));
    },
    [uploadedFiles, maxFiles, maxFileSize, supportedFormats, onUpload, showVideoPreview],
  );

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const removeFile = (id: string) => {
    // Revoke preview URL to free up memory
    const fileToRemove = uploadedFiles.find((f) => f.id === id);
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }

    const updatedFiles = uploadedFiles.filter((f) => f.id !== id);
    setUploadedFiles(updatedFiles);
    onUpload(updatedFiles.map((f) => f.file));
    setError(null);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const acceptedTypes = supportedFormats.map((format) => `.${format.toLowerCase()}`).join(',');

  return (
    <div className={clsx(className)}>
      <div
        className={clsx(s.container, {
          [s.dragOver]: dragOver,
        })}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={s.iconWrapper}>
          <UploadIcon className={s.icon} />
        </div>

        <div className={s.content}>
          <h3 className={s.title}>{title}</h3>
          <p className={s.description}>{description}</p>
        </div>

        <button type="button" className={s.uploadButton} onClick={openFileDialog} disabled={disabled}>
          Upload
        </button>

        <input ref={fileInputRef} type="file" className={s.hiddenInput} onChange={handleFileInputChange} accept={acceptedTypes} multiple={maxFiles > 1} disabled={disabled} />
      </div>

      {uploadedFiles.length > 0 && (
        <div className={s.fileList}>
          {uploadedFiles.map((uploadedFile) => (
            <div key={uploadedFile.id} className={clsx(s.fileItem, { [s.withPreview]: uploadedFile.previewUrl })}>
              {uploadedFile.previewUrl && (
                <div className={s.videoPreviewContainer}>
                  <video src={uploadedFile.previewUrl} className={s.videoPreview} muted playsInline preload="metadata" />
                  <div className={s.videoOverlay}>
                    <div className={s.playIcon}>
                      <PlayIcon />
                    </div>
                  </div>
                  <button type="button" className={s.removeButtonOverlay} onClick={() => removeFile(uploadedFile.id)} aria-label={`Remove ${uploadedFile.file.name}`}>
                    <CloseIcon />
                  </button>
                </div>
              )}
              {!uploadedFile.previewUrl && (
                <>
                  <div className={s.fileInfo}>
                    <div className={s.fileName}>{uploadedFile.file.name}</div>
                    <div className={s.fileSize}>{formatFileSize(uploadedFile.file.size)}</div>
                  </div>
                  <button type="button" className={s.removeButton} onClick={() => removeFile(uploadedFile.id)} aria-label={`Remove ${uploadedFile.file.name}`}>
                    <CloseIcon />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <div className={s.errorMessage}>{error}</div>}
    </div>
  );
};

// Upload Icon Component
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M23.2504 12C23.2551 13.7861 22.6757 15.5248 21.6004 16.9509C21.5412 17.0297 21.467 17.0961 21.3822 17.1462C21.2973 17.1964 21.2034 17.2293 21.1058 17.2431C21.0082 17.257 20.9089 17.2514 20.8134 17.2269C20.7179 17.2023 20.6283 17.1592 20.5495 17.1C20.4707 17.0408 20.4043 16.9666 20.3542 16.8818C20.304 16.7969 20.2711 16.703 20.2573 16.6054C20.2434 16.5078 20.249 16.4085 20.2735 16.313C20.2981 16.2175 20.3412 16.1279 20.4004 16.0491C21.2806 14.883 21.7547 13.4609 21.7504 12C21.7504 10.2098 21.0392 8.4929 19.7734 7.22703C18.5075 5.96115 16.7906 5.25 15.0004 5.25C13.2102 5.25 11.4933 5.96115 10.2274 7.22703C8.96156 8.4929 8.2504 10.2098 8.2504 12C8.2504 12.1989 8.17138 12.3897 8.03073 12.5303C7.89008 12.671 7.69931 12.75 7.5004 12.75C7.30149 12.75 7.11072 12.671 6.97007 12.5303C6.82942 12.3897 6.7504 12.1989 6.7504 12C6.75003 11.2431 6.85382 10.4898 7.05884 9.76125C6.95665 9.75 6.85353 9.75 6.7504 9.75C5.55693 9.75 4.41234 10.2241 3.56842 11.068C2.72451 11.9119 2.2504 13.0565 2.2504 14.25C2.2504 15.4435 2.72451 16.5881 3.56842 17.432C4.41234 18.2759 5.55693 18.75 6.7504 18.75H9.0004C9.19931 18.75 9.39008 18.829 9.53073 18.9697C9.67138 19.1103 9.7504 19.3011 9.7504 19.5C9.7504 19.6989 9.67138 19.8897 9.53073 20.0303C9.39008 20.171 9.19931 20.25 9.0004 20.25H6.7504C5.92557 20.2502 5.10955 20.0803 4.35332 19.751C3.59709 19.4216 2.91688 18.9399 2.35519 18.3359C1.7935 17.7318 1.36238 17.0185 1.08876 16.2403C0.815145 15.4622 0.704907 14.636 0.764932 13.8134C0.824958 12.9907 1.05396 12.1893 1.43763 11.4591C1.8213 10.7289 2.3514 10.0857 2.99483 9.56961C3.63825 9.05351 4.38118 8.67562 5.17721 8.45954C5.97323 8.24346 6.80527 8.19383 7.62134 8.31375C8.45234 6.65171 9.8201 5.31888 11.5031 4.53115C13.1861 3.74342 15.0857 3.54693 16.8943 3.9735C18.7029 4.40007 20.3145 5.42472 21.4681 6.88148C22.6217 8.33824 23.2497 10.1418 23.2504 12ZM14.781 11.4694C14.7114 11.3996 14.6287 11.3443 14.5376 11.3066C14.4466 11.2688 14.349 11.2494 14.2504 11.2494C14.1518 11.2494 14.0542 11.2688 13.9632 11.3066C13.8721 11.3443 13.7894 11.3996 13.7198 11.4694L10.7198 14.4694C10.6501 14.5391 10.5948 14.6218 10.5571 14.7128C10.5194 14.8039 10.5 14.9015 10.5 15C10.5 15.0985 10.5194 15.1961 10.5571 15.2872C10.5948 15.3782 10.6501 15.4609 10.7198 15.5306C10.8605 15.6714 11.0514 15.7504 11.2504 15.7504C11.3489 15.7504 11.4465 15.731 11.5376 15.6933C11.6286 15.6556 11.7113 15.6003 11.781 15.5306L13.5004 13.8103V19.5C13.5004 19.6989 13.5794 19.8897 13.7201 20.0303C13.8607 20.171 14.0515 20.25 14.2504 20.25C14.4493 20.25 14.6401 20.171 14.7807 20.0303C14.9214 19.8897 15.0004 19.6989 15.0004 19.5V13.8103L16.7198 15.5306C16.7895 15.6003 16.8722 15.6556 16.9632 15.6933C17.0543 15.731 17.1519 15.7504 17.2504 15.7504C17.3489 15.7504 17.4465 15.731 17.5376 15.6933C17.6286 15.6556 17.7113 15.6003 17.781 15.5306C17.8507 15.4609 17.906 15.3782 17.9437 15.2872C17.9814 15.1961 18.0008 15.0985 18.0008 15C18.0008 14.9015 17.9814 14.8039 17.9437 14.7128C17.906 14.6218 17.8507 14.5391 17.781 14.4694L14.781 11.4694Z"
      fill="#455468"
    />
  </svg>
);

// Close Icon Component
const CloseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

// Play Icon Component
const PlayIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.5 12C22.5006 12.2546 22.4353 12.5051 22.3105 12.727C22.1856 12.949 22.0055 13.1348 21.7875 13.2665L8.28 21.5297C8.05227 21.6691 7.79144 21.7452 7.52445 21.7502C7.25746 21.7551 6.99399 21.6887 6.76125 21.5578C6.53073 21.4289 6.3387 21.2409 6.2049 21.0132C6.07111 20.7855 6.00039 20.5263 6 20.2622V3.73779C6.00039 3.47368 6.07111 3.21445 6.2049 2.98673C6.3387 2.75902 6.53073 2.57106 6.76125 2.44217C6.99399 2.31124 7.25746 2.24482 7.52445 2.24977C7.79144 2.25471 8.05227 2.33084 8.28 2.47029L21.7875 10.7334C22.0055 10.8651 22.1856 11.051 22.3105 11.2729C22.4353 11.4949 22.5006 11.7453 22.5 12Z"
      fill="#455468"
    />
  </svg>
);

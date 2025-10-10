import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadVideo } from '@/services/demo-day/hooks/useUploadVideo';
import { MediaPreview } from '../MediaPreview';
import { formatFileSize } from '@/utils/file.utils';
import s from './PitchVideoUpload.module.scss';
import { UploadInfo } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { useQueryClient } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { formatWalletAddress } from '@privy-io/js-sdk-core';
import { DemoMaterialAnalyticsHandlers } from '../EditProfileDrawer/EditProfileDrawer';
import { toast } from '@/components/core/ToastContainer';

const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21.5057 4.75428V14.0743C21.5057 14.6609 21.0301 15.1363 20.4436 15.1363H3.55659C2.97016 15.1363 2.49463 14.6609 2.49463 14.0743V2.75385C2.49463 2.16732 2.97016 1.69189 3.55659 1.69189H9.72823C10.4811 1.69189 11.1844 2.06693 11.6038 2.69216C12.0233 3.31717 12.7266 3.69243 13.4794 3.69243H20.4436C21.0301 3.69243 21.5057 4.16785 21.5057 4.75439V4.75428Z"
      fill="url(#paint0_linear_7395_157695)"
    />
    <path
      d="M21.5057 4.75428V14.0743C21.5057 14.6609 21.0301 15.1363 20.4436 15.1363H3.55659C2.97016 15.1363 2.49463 14.6609 2.49463 14.0743V2.75385C2.49463 2.16732 2.97016 1.69189 3.55659 1.69189H9.72823C10.4811 1.69189 11.1844 2.06693 11.6038 2.69216C12.0233 3.31717 12.7266 3.69243 13.4794 3.69243H20.4436C21.0301 3.69243 21.5057 4.16785 21.5057 4.75439V4.75428Z"
      fill="url(#paint1_linear_7395_157695)"
    />
    <g style={{ mixBlendMode: 'multiply' }}>
      <path
        d="M5.37298 4.40381H19.856C20.3677 4.40381 20.7832 4.81931 20.7832 5.33099V9.27213H4.4458V5.33099C4.4458 4.81931 4.8613 4.40381 5.37298 4.40381Z"
        fill="#E6E6E6"
      />
    </g>
    <path
      d="M4.98244 4.65869H19.7369C20.1737 4.65869 20.5283 5.01338 20.5283 5.4501V9.27194H4.19092V5.4501C4.19092 5.01327 4.5456 4.65869 4.98233 4.65869H4.98244Z"
      fill="#E6E6E6"
    />
    <g style={{ mixBlendMode: 'multiply' }}>
      <path
        d="M4.59466 5.18213H19.0777C19.5894 5.18213 20.0049 5.59763 20.0049 6.10931V9.79549H3.66748V6.10931C3.66748 5.59763 4.08298 5.18213 4.59466 5.18213Z"
        fill="#E6E6E6"
      />
    </g>
    <path
      d="M4.20412 5.43701H18.9586C19.3954 5.43701 19.75 5.7917 19.75 6.22842V10.0503H3.4126V6.22842C3.4126 5.79159 3.76728 5.43701 4.20401 5.43701H4.20412Z"
      fill="white"
    />
    <path
      d="M23.2472 10.4102L22.4607 21.3223C22.4586 21.3524 22.4551 21.3821 22.4505 21.4114C22.3703 21.9232 21.9282 22.308 21.4016 22.308H2.61887C2.05809 22.308 1.59394 21.8719 1.5589 21.3122L0.752115 8.39956C0.71386 7.78815 1.19945 7.27148 1.81197 7.27148H9.52575C10.2786 7.27148 10.9819 7.64651 11.4013 8.27175C11.8208 8.89699 12.5242 9.27202 13.2769 9.27202H22.1879C22.8045 9.27202 23.2914 9.79531 23.2472 10.4104V10.4102Z"
      fill="url(#paint2_linear_7395_157695)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_7395_157695"
        x1="12.0002"
        y1="15.1363"
        x2="12.0002"
        y2="1.69189"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FA842A" />
        <stop offset="1" stopColor="#FAC03E" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_7395_157695"
        x1="12.0002"
        y1="15.1364"
        x2="12.0002"
        y2="1.6918"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#1B4DFF" />
        <stop offset="1" stopColor="#5177FF" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_7395_157695"
        x1="12"
        y1="22.3081"
        x2="12"
        y2="7.27137"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#1B4DFF" />
        <stop offset="1" stopColor="#5177FF" />
      </linearGradient>
    </defs>
  </svg>
);

const VideoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="14" rx="2" fill="#7C3AED" />
    <polygon points="10,8 16,12 10,16" fill="white" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={s.spinner}>
    <path d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
  </svg>
);

interface PitchVideoUploadProps {
  existingFile?: UploadInfo | null;
  analyticsHandlers?: DemoMaterialAnalyticsHandlers;
  teamUid?: string;
}

interface UploadState {
  file: File | null;
  progress: number;
  isUploading: boolean;
  isComplete: boolean;
  error: string | null;
}

export const PitchVideoUpload = ({ existingFile, analyticsHandlers, teamUid }: PitchVideoUploadProps) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    progress: 0,
    isUploading: false,
    isComplete: false,
    error: null,
  });

  const uploadMutation = useUploadVideo();

  const queryClient = useQueryClient();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        const errorMessage = 'Only MP4, MOV, and WebM video files are allowed';
        toast.error(errorMessage);
        setUploadState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return;
      }

      // Validate file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        const errorMessage = 'File size must be less than 500MB';
        toast.error(errorMessage);
        setUploadState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return;
      }

      const uploadStartTime = Date.now();
      const fileMetadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        materialType: 'video',
      };

      // Report upload started analytics
      analyticsHandlers?.onUploadStarted(fileMetadata);

      setUploadState({
        file,
        progress: 0,
        isUploading: true,
        isComplete: false,
        error: null,
      });

      // Simulate progress for better UX (since fetch doesn't support real progress)
      const progressInterval = setInterval(() => {
        setUploadState((prev) => {
          if (prev.progress < 90) {
            return { ...prev, progress: prev.progress + 5 }; // Slower progress for larger files
          }
          return prev;
        });
      }, 500); // Slower interval for video uploads

      // Start upload
      uploadMutation.mutate(
        { file, teamUid },
        {
          onSuccess: () => {
            clearInterval(progressInterval);
            queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE] });

            // Report upload success analytics
            const uploadDuration = Date.now() - uploadStartTime;
            analyticsHandlers?.onUploadSuccess({
              ...fileMetadata,
              uploadDuration,
            });

            toast.success('Pitch video uploaded successfully!');

            setUploadState((prev) => ({
              ...prev,
              isUploading: false,
              isComplete: true,
              progress: 100,
            }));
          },
          onError: (error) => {
            clearInterval(progressInterval);
            queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE] });

            const errorMessage = error instanceof Error ? error.message : 'Upload failed';

            // Report upload failed analytics
            analyticsHandlers?.onUploadFailed(fileMetadata, errorMessage);

            toast.error(`Failed to upload pitch video: ${errorMessage}`);

            setUploadState((prev) => ({
              ...prev,
              isUploading: false,
              error: errorMessage,
            }));
          },
        },
      );
    },
    [queryClient, uploadMutation, analyticsHandlers, teamUid],
  );

  const onDropRejected = useCallback((fileRejections: any[]) => {
    const rejection = fileRejections[0];
    if (!rejection) return;

    let errorMessage = 'File upload failed';

    // Check for file type errors
    const fileTypeError = rejection.errors.find((e: any) => e.code === 'file-invalid-type');
    if (fileTypeError) {
      errorMessage = 'Only MP4, MOV, and WebM video files are allowed';
    }

    // Check for file size errors
    const fileSizeError = rejection.errors.find((e: any) => e.code === 'file-too-large');
    if (fileSizeError) {
      errorMessage = 'File size must be less than 500MB';
    }

    toast.error(errorMessage);
    setUploadState((prev) => ({
      ...prev,
      error: errorMessage,
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'video/mp4': ['.mp4'],
      'video/mov': ['.mov'],
      'video/quicktime': ['.mov'],
      'video/webm': ['.webm'],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
    disabled: uploadState.isUploading,
  });

  const renderUploadArea = () => {
    // Show uploading state
    if (uploadState.isUploading) {
      return (
        <div className={s.filePreview}>
          <div className={s.fileIcon}>
            <VideoIcon />
          </div>
          <div className={s.fileInfo}>
            <div className={s.fileName}>{formatWalletAddress(uploadState.file?.name) || 'Uploading...'}</div>
            <div className={s.fileDetails}>
              <span className={s.fileSize}>{uploadState.file ? formatFileSize(uploadState.file.size) : ''}</span>
              <DotIcon />
              <div className={s.uploadStatus}>
                <SpinnerIcon />
                <span>Uploading</span>
              </div>
            </div>
          </div>
          <div className={s.progressBar}>
            <div className={s.progressTrack}>
              <div className={s.progressFill} style={{ width: `${uploadState.progress}%` }} />
            </div>
            <span className={s.progressText}>{uploadState.progress}%</span>
          </div>
          {uploadState.error && <div className={s.errorMessage}>{uploadState.error}</div>}
        </div>
      );
    }

    // Show error state
    if (uploadState.error) {
      return (
        <div className={s.errorContainer}>
          <div className={s.errorMessage}>{uploadState.error}</div>
          <button
            type="button"
            className={s.retryButton}
            onClick={() =>
              setUploadState({
                file: null,
                progress: 0,
                isUploading: false,
                isComplete: false,
                error: null,
              })
            }
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div {...getRootProps()} className={`${s.uploadArea} ${isDragActive ? s.dragActive : ''}`}>
        <input {...getInputProps()} />
        <div className={s.uploadIcon}>
          <FolderIcon />
        </div>
        <div className={s.uploadText}>
          <h4>Drag & Drop or Upload Your Pitch Video</h4>
          <p>Use multiple slides or full pitch deck presentation. Supported: MP4, MOV, WebM. Max 500 MB. Max 3 min.</p>
        </div>
        <button type="button" className={s.browseButton}>
          Browse
        </button>
      </div>
    );
  };

  if (existingFile) {
    const fileUrl = existingFile?.url ?? '';
    const fileName = existingFile?.filename ?? '';
    const fileSize = existingFile?.size ?? 0;

    const handleDelete = () => {
      // Report delete analytics
      analyticsHandlers?.onDeleted('video', fileName);

      // Reset upload state to show upload area again
      setUploadState({
        file: null,
        progress: 0,
        isUploading: false,
        isComplete: false,
        error: null,
      });
    };

    const handleView = () => {
      // Report view analytics
      analyticsHandlers?.onViewed('video', fileName);
    };

    return (
      <div className={s.materialUpload}>
        <MediaPreview
          url={fileUrl}
          type="video"
          title="Pitch Video"
          metadata={{
            fileName,
            fileSize,
            uploadDate: uploadState.isComplete ? 'Just now' : undefined,
          }}
          onDelete={handleDelete}
          onView={handleView}
          showDeleteButton={true}
          teamUid={teamUid}
        />
      </div>
    );
  }

  return <div className={s.materialUpload}>{renderUploadArea()}</div>;
};

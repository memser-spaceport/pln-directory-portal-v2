import React, { useState, useEffect } from 'react';
import { ImageIcon } from '@/components/page/demo-day/icons/DemoDayIcons';
import { useDeleteOnePager } from '@/services/demo-day/hooks/useDeleteOnePager';
import { useDeleteVideo } from '@/services/demo-day/hooks/useDeleteVideo';
import { ConfirmDialog } from '../ConfirmDialog';
import s from './MediaPreview.module.scss';
import { formatWalletAddress } from '@privy-io/js-sdk-core';
import { formatFileSize } from '@/utils/file.utils';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
const PdfViewer = dynamic(() => import('@/components/page/demo-day/FounderPendingView/components/PdfViewer/PdfViewer'));

interface MediaPreviewProps {
  url: string;
  type: 'document' | 'video';
  title: string;
  metadata?: {
    fileName?: string;
    fileSize?: string | number;
    uploadDate?: string;
  };
  showMetadata?: boolean;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

const ExpandIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 7L20 0M20 0H14M20 0V6M7 13L0 20M0 20H6M0 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 3H11.25V2.25C11.25 1.78587 11.0656 1.34075 10.7374 1.01256C10.4092 0.684374 9.96413 0.5 9.5 0.5H6.5C6.03587 0.5 5.59075 0.684374 5.26256 1.01256C4.93437 1.34075 4.75 1.78587 4.75 2.25V3H2.5C2.30109 3 2.11032 3.07902 1.96967 3.21967C1.82902 3.36032 1.75 3.55109 1.75 3.75C1.75 3.94891 1.82902 4.13968 1.96967 4.28033C2.11032 4.42098 2.30109 4.5 2.5 4.5H2.75V13C2.75 13.3315 2.8817 13.6495 3.11612 13.8839C3.35054 14.1183 3.66848 14.25 4 14.25H12C12.3315 14.25 12.6495 14.1183 12.8839 13.8839C13.1183 13.6495 13.25 13.3315 13.25 13V4.5H13.5C13.6989 4.5 13.8897 4.42098 14.0303 4.28033C14.171 4.13968 14.25 3.94891 14.25 3.75C14.25 3.55109 14.171 3.36032 14.0303 3.21967C13.8897 3.07902 13.6989 3 13.5 3ZM6.25 2.25C6.25 2.1837 6.27634 2.12011 6.32322 2.07322C6.37011 2.02634 6.4337 2 6.5 2H9.5C9.5663 2 9.62989 2.02634 9.67678 2.07322C9.72366 2.12011 9.75 2.1837 9.75 2.25V3H6.25V2.25ZM11.75 12.75H4.25V4.5H11.75V12.75ZM7.25 6.5V10.5C7.25 10.6989 7.17098 10.8897 7.03033 11.0303C6.88968 11.171 6.69891 11.25 6.5 11.25C6.30109 11.25 6.11032 11.171 5.96967 11.0303C5.82902 10.8897 5.75 10.6989 5.75 10.5V6.5C5.75 6.30109 5.82902 6.11032 5.96967 5.96967C6.11032 5.82902 6.30109 5.75 6.5 5.75C6.69891 5.75 6.88968 5.82902 7.03033 5.96967C7.17098 6.11032 7.25 6.30109 7.25 6.5ZM10.25 6.5V10.5C10.25 10.6989 10.171 10.8897 10.0303 11.0303C9.88968 11.171 9.69891 11.25 9.5 11.25C9.30109 11.25 9.11032 11.171 8.96967 11.0303C8.82902 10.8897 8.75 10.6989 8.75 10.5V6.5C8.75 6.30109 8.82902 6.11032 8.96967 5.96967C9.11032 5.82902 9.30109 5.75 9.5 5.75C9.69891 5.75 9.88968 5.82902 10.0303 5.96967C10.171 6.11032 10.25 6.30109 10.25 6.5Z"
      fill="#8897AE"
    />
  </svg>
);

export const MediaPreview = ({ url, type, title, metadata, showMetadata = true, onDelete, showDeleteButton = true }: MediaPreviewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteOnePagerMutation = useDeleteOnePager();
  const deleteVideoMutation = useDeleteVideo();

  const queryClient = useQueryClient();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isModalOpen) return;

      if (event.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Prevent body scroll when modal is open
  // useEffect(() => {
  //   if (isModalOpen) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = 'unset';
  //   }
  //
  //   return () => {
  //     document.body.style.overflow = 'unset';
  //   };
  // }, [isModalOpen]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (type === 'document') {
      deleteOnePagerMutation.mutate(undefined, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE] });
          onDelete?.();
        },
        onError: () => {
          setShowDeleteDialog(false);
        },
      });
    } else if (type === 'video') {
      deleteVideoMutation.mutate(undefined, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          queryClient.invalidateQueries({ queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE] });
          onDelete?.();
        },
        onError: () => {
          setShowDeleteDialog(false);
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const isPDF = (url: string) => {
    return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
  };

  const renderFilePreview = () => {
    if (type === 'video') {
      return (
        <div className={s.videoPreviewContainer}>
          <video src={url} className={s.previewMedia} muted playsInline preload="metadata" />
          <div className={s.videoOverlay}>
            <div className={s.playIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.5 12C22.5006 12.2546 22.4353 12.5051 22.3105 12.727C22.1856 12.949 22.0055 13.1348 21.7875 13.2665L8.28 21.5297C8.05227 21.6691 7.79144 21.7452 7.52445 21.7502C7.25746 21.7551 6.99399 21.6887 6.76125 21.5578C6.53073 21.4289 6.3387 21.2409 6.2049 21.0132C6.07111 20.7855 6.00039 20.5263 6 20.2622V3.73779C6.00039 3.47368 6.07111 3.21445 6.2049 2.98673C6.3387 2.75902 6.53073 2.57106 6.76125 2.44217C6.99399 2.31124 7.25746 2.24482 7.52445 2.24977C7.79144 2.25471 8.05227 2.33084 8.28 2.47029L21.7875 10.7334C22.0055 10.8651 22.1856 11.051 22.3105 11.2729C22.4353 11.4949 22.5006 11.7453 22.5 12Z"
                  fill="#455468"
                />
              </svg>
            </div>
          </div>
        </div>
      );
    } else if (isPDF(url)) {
      return (
        <div className={s.pdfPreviewContainer}>
          <PdfViewer fileUrl={url} isPreview={true} />
        </div>
      );
    } else {
      return (
        <div className={s.imagePreviewContainer}>
          <img src={url} alt="Preview" className={s.previewMedia} />
          <div className={s.imageOverlay}>
            <div className={s.imageLabel}>
              <ImageIcon />
              <span>IMAGE</span>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderModalContent = () => {
    if (type === 'video') {
      return <video src={url} className={s.modalMedia} controls autoPlay />;
    } else if (isPDF(url)) {
      return (
        <div className={`${s.modalMedia} ${s.pdfModal}`}>
          <PdfViewer fileUrl={url} isPreview={false} />
        </div>
      );
    } else {
      return <img src={url} alt="Media" className={s.modalMedia} />;
    }
  };

  return (
    <>
      <div className={s.mediaPreview}>
        <div className={s.mediaCard} onClick={openModal}>
          {renderFilePreview()}
          <button
            className={s.expandButton}
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
          >
            <ExpandIcon />
          </button>
        </div>

        {showMetadata && metadata && (
          <div className={s.metadataDetails}>
            {metadata.fileName && <span className={s.metadataItem}>{formatWalletAddress(metadata.fileName)}</span>}
            {metadata.fileSize && <span className={s.metadataItem}>&bull; {formatFileSize(+metadata.fileSize)}</span>}
            {metadata.uploadDate && <span className={s.metadataItem}>&bull; Uploaded {metadata.uploadDate}</span>}

            <button
              className={s.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
            >
              <DeleteIcon />
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div className={s.modal} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className={s.closeButton} onClick={closeModal}>
              <CloseIcon />
            </button>

            {/* Media Content */}
            <div className={s.mediaContainer}>{renderModalContent()}</div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title={`Delete This File?`}
        message={`You’ll be unlisted from Demo Day until you upload a new one.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteOnePagerMutation.isPending || deleteVideoMutation.isPending}
      />
    </>
  );
};

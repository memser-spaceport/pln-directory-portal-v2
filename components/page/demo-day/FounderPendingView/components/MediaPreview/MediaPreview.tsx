import React, { useState, useEffect } from 'react';
import { ImageIcon, VideoIcon } from '@/components/page/demo-day/icons/DemoDayIcons';
import s from './MediaPreview.module.scss';

interface MediaPreviewProps {
  url: string;
  type: 'document' | 'video';
  title: string;
  metadata?: {
    fileName?: string;
    fileSize?: string;
    uploadDate?: string;
  };
  showMetadata?: boolean;
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

const ChevronLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MediaPreview = ({ url, type, title, metadata, showMetadata = true }: MediaPreviewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
                <polygon points="5,3 19,12 5,21" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      );
    } else if (isPDF(url)) {
      return (
        <div className={s.pdfPreviewContainer}>
          <iframe src={`${url}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`} className={s.pdfPreviewFrame} title="PDF Preview" scrolling="no" />
          <div className={s.pdfOverlay}>
            <div className={s.pdfLabel}>
              <ImageIcon />
              <span>PDF</span>
            </div>
          </div>
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
      return <iframe src={`${url}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`} className={`${s.modalMedia} ${s.pdfModal}`} title="PDF Viewer" scrolling="no" />;
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
            {metadata.fileName && (
              <span className={s.metadataItem}>
                <span className={s.value}>{metadata.fileName}</span>
              </span>
            )}
            {metadata.fileSize && (
              <>
                &bull;
                <span className={s.metadataItem}>
                  <span className={s.value}>{metadata.fileSize}</span>
                </span>
              </>
            )}
            {metadata.uploadDate && (
              <>
                &bull;
                <span className={s.metadataItem}>
                  <span className={s.value}>Uploaded {metadata.uploadDate}</span>
                </span>
              </>
            )}
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
    </>
  );
};

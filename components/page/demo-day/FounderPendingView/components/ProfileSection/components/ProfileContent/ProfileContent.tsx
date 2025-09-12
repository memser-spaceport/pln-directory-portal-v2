import React, { useState, useEffect } from 'react';
import { ImageIcon, VideoIcon } from '@/components/page/demo-day/icons/DemoDayIcons';
import s from './ProfileContent.module.scss';

interface ProfileContentProps {
  pitchDeckUrl?: string;
  videoUrl?: string;
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

export const ProfileContent = ({ pitchDeckUrl, videoUrl }: ProfileContentProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const hasContent = pitchDeckUrl || videoUrl;
  const slides = [...(pitchDeckUrl ? [{ type: 'document' as const, url: pitchDeckUrl }] : []), ...(videoUrl ? [{ type: 'video' as const, url: videoUrl }] : [])];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (event.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          if (slides.length > 1) prevSlide();
          break;
        case 'ArrowRight':
          if (slides.length > 1) nextSlide();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, slides.length]);

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
    if (hasContent) {
      setIsModalOpen(true);
      setCurrentSlide(0);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const isPDF = (url: string) => {
    return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
  };

  const renderFilePreview = (url: string, type: 'document' | 'video') => {
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
          <img src={url} alt="Pitch deck preview" className={s.previewMedia} />
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
    if (slides.length === 0) return null;

    const currentSlideData = slides[currentSlide];

    if (currentSlideData.type === 'video') {
      return <video src={currentSlideData.url} className={s.modalMedia} controls autoPlay />;
    } else if (isPDF(currentSlideData.url)) {
      return <iframe src={`${currentSlideData.url}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`} className={`${s.modalMedia} ${s.pdfModal}`} title="PDF Viewer" scrolling="no" />;
    } else {
      return <img src={currentSlideData.url} alt="Pitch deck" className={s.modalMedia} />;
    }
  };

  return (
    <>
      <div className={s.profileContent}>
        {/* Pitch Deck Card */}
        <div className={s.mediaCard} onClick={pitchDeckUrl ? openModal : undefined}>
          {pitchDeckUrl ? (
            <>
              {renderFilePreview(pitchDeckUrl, 'document')}
              <button
                className={s.expandButton}
                onClick={(e) => {
                  e.stopPropagation();
                  openModal();
                }}
              >
                <ExpandIcon />
              </button>
            </>
          ) : (
            <div className={s.placeholder}>
              <ImageIcon />
              <span className={s.placeholderText}>Pitch Deck</span>
            </div>
          )}
        </div>

        {/* Video Card */}
        <div className={s.mediaCard} onClick={videoUrl ? openModal : undefined}>
          {videoUrl ? (
            <>
              {renderFilePreview(videoUrl, 'video')}
              <button
                className={s.expandButton}
                onClick={(e) => {
                  e.stopPropagation();
                  openModal();
                }}
              >
                <ExpandIcon />
              </button>
            </>
          ) : (
            <div className={s.placeholder}>
              <VideoIcon />
              <span className={s.placeholderText}>Pitch Video</span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div className={s.modal} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className={s.closeButton} onClick={closeModal}>
              <CloseIcon />
            </button>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button className={s.navButton} onClick={prevSlide} style={{ left: '20px' }}>
                  <ChevronLeftIcon />
                </button>
                <button className={s.navButton} onClick={nextSlide} style={{ right: '20px' }}>
                  <ChevronRightIcon />
                </button>
              </>
            )}

            {/* Media Content */}
            <div className={s.mediaContainer}>{renderModalContent()}</div>
          </div>
        </div>
      )}
    </>
  );
};

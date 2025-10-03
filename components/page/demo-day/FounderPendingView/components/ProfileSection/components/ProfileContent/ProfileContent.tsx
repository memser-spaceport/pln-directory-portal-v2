import React from 'react';
import { ImageIcon, VideoIcon } from '@/components/page/demo-day/icons/DemoDayIcons';
import { MediaPreview } from '../../../MediaPreview';
import s from './ProfileContent.module.scss';

interface ProfileContentProps {
  pitchDeckUrl?: string | null;
  videoUrl?: string | null;
  onPitchDeckView?: () => void;
  onPitchVideoView?: () => void;
}

const ExpandIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 7L20 0M20 0H14M20 0V6M7 13L0 20M0 20H6M0 20V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

export const ProfileContent = ({ pitchDeckUrl, videoUrl, onPitchDeckView, onPitchVideoView }: ProfileContentProps) => {
  return (
    <div className={s.profileContent}>
      {/* Pitch Deck Card */}
      {pitchDeckUrl ? (
        <MediaPreview
          url={pitchDeckUrl}
          type="document"
          title="Pitch Slide"
          showMetadata={false}
          onView={onPitchDeckView}
        />
      ) : (
        <div className={s.placeholder}>
          <ImageIcon />
          <span className={s.placeholderText}>No Pitch Slide Added</span>
        </div>
      )}

      {/* Video Card */}
      {videoUrl ? (
        <MediaPreview url={videoUrl} type="video" title="Pitch Video" showMetadata={false} onView={onPitchVideoView} />
      ) : (
        <div className={s.placeholder}>
          <VideoIcon />
          <span className={s.placeholderText}>No Pitch Video Added</span>
        </div>
      )}
    </div>
  );
};

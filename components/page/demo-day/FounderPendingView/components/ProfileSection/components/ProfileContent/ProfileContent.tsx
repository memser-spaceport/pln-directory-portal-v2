import React from 'react';
import { ImageIcon, VideoIcon } from '@/components/page/demo-day/icons/DemoDayIcons';
import { MediaPreview } from '../../../MediaPreview';
import s from './ProfileContent.module.scss';

interface ProfileContentProps {
  pitchDeckUrl?: string | null;
  videoUrl?: string | null;
  onPitchDeckView?: () => void;
  onPitchVideoView?: () => void;
  pitchDeckPreviewUrl?: string | null;
  pitchDeckPreviewSmallUrl?: string | null;
}

export const ProfileContent = ({
  pitchDeckUrl,
  videoUrl,
  onPitchDeckView,
  onPitchVideoView,
  pitchDeckPreviewUrl,
  pitchDeckPreviewSmallUrl,
}: ProfileContentProps) => {
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
          previewImageUrl={pitchDeckPreviewUrl || undefined}
          previewImageSmallUrl={pitchDeckPreviewSmallUrl || undefined}
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

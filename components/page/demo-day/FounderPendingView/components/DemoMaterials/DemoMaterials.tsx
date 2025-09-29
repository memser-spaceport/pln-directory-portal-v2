import React from 'react';
import { PitchDeckUpload } from '../PitchDeckUpload';
import { PitchVideoUpload } from '../PitchVideoUpload';
import s from './DemoMaterials.module.scss';
import { UploadInfo } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { DemoMaterialAnalyticsHandlers } from '../EditProfileDrawer/EditProfileDrawer';

interface DemoMaterialsProps {
  existingPitchDeck?: UploadInfo | null;
  existingVideo?: UploadInfo | null;
  analyticsHandlers?: DemoMaterialAnalyticsHandlers;
}

export const DemoMaterials = ({ existingPitchDeck, existingVideo, analyticsHandlers }: DemoMaterialsProps) => {
  return (
    <div className={s.demoMaterialsSection}>
      <h3 className={s.sectionTitle}>Demo Day Materials</h3>
      <div className={s.materialsContainer}>
        <PitchDeckUpload
          existingFile={existingPitchDeck}
          analyticsHandlers={analyticsHandlers}
        />
        <PitchVideoUpload
          existingFile={existingVideo}
          analyticsHandlers={analyticsHandlers}
        />
      </div>
    </div>
  );
};

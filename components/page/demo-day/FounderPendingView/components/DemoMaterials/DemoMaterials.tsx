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
  companyFundraiseParagraph?: React.ReactNode;
}

export const DemoMaterials = ({
  existingPitchDeck,
  existingVideo,
  analyticsHandlers,
  companyFundraiseParagraph,
}: DemoMaterialsProps) => {
  return (
    <div className={s.demoMaterialsSection}>
      <h3 className={s.sectionTitle}>Demo Day Materials</h3>
      <div className={s.materialsContainer}>
        <div className={s.materials}>
          <PitchDeckUpload existingFile={existingPitchDeck} analyticsHandlers={analyticsHandlers} />
          <PitchVideoUpload existingFile={existingVideo} analyticsHandlers={analyticsHandlers} />
        </div>
        {companyFundraiseParagraph && <div className={s.fundraiseParagraphContainer}>{companyFundraiseParagraph}</div>}
      </div>
    </div>
  );
};

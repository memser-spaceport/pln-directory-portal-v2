import React from 'react';
import Link from 'next/link';
import { PitchDeckUpload } from '../PitchDeckUpload';
import { PitchVideoUpload } from '../PitchVideoUpload';
import s from './DemoMaterials.module.scss';
import { UploadInfo } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { DemoMaterialAnalyticsHandlers } from '../EditProfileDrawer/EditProfileDrawer';

const ExternalLinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_9747_4433)">
      <path
        d="M14.344 4.5V11.8125C14.344 12.0363 14.2551 12.2509 14.0968 12.4091C13.9386 12.5674 13.724 12.6562 13.5002 12.6562C13.2764 12.6562 13.0618 12.5674 12.9036 12.4091C12.7454 12.2509 12.6565 12.0363 12.6565 11.8125V6.53906L5.09717 14.097C4.93866 14.2555 4.72368 14.3445 4.49951 14.3445C4.27535 14.3445 4.06036 14.2555 3.90185 14.097C3.74335 13.9384 3.6543 13.7235 3.6543 13.4993C3.6543 13.2751 3.74335 13.0601 3.90185 12.9016L11.4612 5.34375H6.18771C5.96394 5.34375 5.74933 5.25486 5.59109 5.09662C5.43286 4.93839 5.34396 4.72378 5.34396 4.5C5.34396 4.27622 5.43286 4.06161 5.59109 3.90338C5.74933 3.74514 5.96394 3.65625 6.18771 3.65625H13.5002C13.724 3.65625 13.9386 3.74514 14.0968 3.90338C14.2551 4.06161 14.344 4.27622 14.344 4.5Z"
        fill="#1B4DFF"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_9747_4433"
        x="-2"
        y="-1"
        width="22"
        height="22"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9747_4433" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9747_4433" result="shape" />
      </filter>
    </defs>
  </svg>
);

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
      <div className={s.sectionHeader}>
        <h3 className={s.sectionTitle}>Demo Day Materials</h3>
        <Link
          href="https://docs.google.com/document/d/1Rtrbs6684K5XMAlAUiqdt2XESrkAiSTzEYhl5j8coOI/edit?tab=t.0#heading=h.th9rcgmw87qq"
          target="_blank"
          rel="noopener noreferrer"
          className={s.prepDocLink}
        >
          <span>Materials prep doc</span>
          <ExternalLinkIcon />
        </Link>
      </div>
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

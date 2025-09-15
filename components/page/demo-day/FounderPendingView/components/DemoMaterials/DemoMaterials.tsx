import React from 'react';
import { PitchDeckUpload } from '../PitchDeckUpload';
import { PitchVideoUpload } from '../PitchVideoUpload';
import s from './DemoMaterials.module.scss';

interface DemoMaterialsProps {
  existingPitchDeck?: string | null;
  existingVideo?: string | null;
}

export const DemoMaterials = ({ existingPitchDeck, existingVideo }: DemoMaterialsProps) => {
  return (
    <div className={s.demoMaterialsSection}>
      <h3 className={s.sectionTitle}>Demo Day Materials</h3>
      <div className={s.materialsContainer}>
        <PitchDeckUpload existingFile={existingPitchDeck} />
        <PitchVideoUpload existingFile={existingVideo} />
      </div>
    </div>
  );
};

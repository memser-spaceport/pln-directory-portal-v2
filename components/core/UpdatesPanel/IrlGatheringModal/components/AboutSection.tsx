'use client';

import s from '../IrlGatheringModal.module.scss';

interface AboutSectionProps {
  description: string;
}

export function AboutSection({ description }: AboutSectionProps) {
  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>About this Gathering:</h3>
      <p className={s.sectionDescription}>{description}</p>
    </div>
  );
}


'use client';

import Image from 'next/image';
import { CloseIcon, CalendarDotsIcon } from '../icons';
import s from '../IrlGatheringModal.module.scss';

interface ModalHeaderProps {
  gatheringName: string;
  gatheringImage?: string;
  onClose: () => void;
}

export function ModalHeader({ gatheringName, gatheringImage, onClose }: ModalHeaderProps) {
  return (
    <div className={s.header}>
      <div className={s.headerContent}>
        <div className={s.iconWrapper}>
          {gatheringImage ? (
            <Image src={gatheringImage} alt="" width={40} height={40} />
          ) : (
            <CalendarDotsIcon />
          )}
        </div>
        <div className={s.headerText}>
          <h2 className={s.title}>{gatheringName}</h2>
        </div>
      </div>
      <button className={s.closeButton} onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>
    </div>
  );
}


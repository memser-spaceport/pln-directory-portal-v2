'use client';
import Image from 'next/image';
import { EVENTS } from '@/utils/constants';
import IconButton from '@/components/ui/popup-trigger-icon-button';

export default function DetailEditAction({ experience, closeModal }: { experience: any; closeModal: () => void }) {
  const handleEditExperience = () => {
    if (closeModal) {
      closeModal();
    }
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL, { detail: { experience: { ...experience, memberId: experience?.memberId } } }));
  };

  return (
    <>
      <IconButton iconImgUrl="/icons/edit-blue.svg" size={16} onClick={handleEditExperience} alt="edit" />
      <style jsx>{`
        .member-detail__experience__item__detail__button {
          background-color: transparent;
          border: none;
        }
      `}</style>
    </>
  );
}

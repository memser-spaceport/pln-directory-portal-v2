'use client';
import Image from 'next/image';
import { EVENTS } from '@/utils/constants';

export default function DetailEditAction({ experience, closeModal }: { experience: any, closeModal: () => void }) {
  const handleEditExperience = () => {
    if(closeModal){
      closeModal();
    }
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL, { detail: { experience: { ...experience, memberId: experience?.memberId } } }));
  };

  return (
    <>
      <button className="member-detail__experience__item__detail__button" onClick={handleEditExperience}>
        <Image src="/icons/edit-blue.svg" alt="edit" width={16} height={16} />
      </button>
      <style jsx>{`
        .member-detail__experience__item__detail__button {
          background-color: transparent;
          border: none;
        }
      `}</style>
    </>
  );
}

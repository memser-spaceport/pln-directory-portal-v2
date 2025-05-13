'use client';

import { EVENTS } from '@/utils/constants';
import Image from 'next/image';

const EmptyMemberExperience = ({ member }: { member: any }) => {
  return (
    <>
      <div className="member-detail__experience__list__empty" onClick={() => {
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL,
            { detail: {
             experience: {
               memberId: member?.id,
               title: '',
               company: '',
               start: { month: 0, year: 0 },
               end: { month: 0, year: 0 },
               isCurrent: false,
               location: '',
               uid: null
              } 
            }}  ));
      }}>
        <Image src="/icons/add-blue.svg" alt="arrow-right" width={16} height={16} />
        <p>Add Experience</p>
      </div>
      <style jsx>{`
        .member-detail__experience__list__empty {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          font-size: 14px;
          line-height: 24px;
          letter-spacing: 0px;
          gap: 8px;
          color: #156ff7;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default EmptyMemberExperience;

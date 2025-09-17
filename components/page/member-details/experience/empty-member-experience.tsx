'use client';

import PopupTriggerIconButton from '@/components/ui/popup-trigger-icon-button';
import { EVENTS } from '@/utils/constants';
import cookies from 'js-cookie';
const EmptyMemberExperience = ({ member }: { member: any }) => {
  const userInfo = cookies.get('userInfo');
  const addExperienceData = {
    experience: {
      memberId: member?.id,
      title: '',
      company: '',
      startDate: new Date(),
      endDate: new Date(),
      isCurrent: false,
      location: '',
      uid: null,
    },
  };

  return (
    <>
      <div className="member-detail__experience__list__empty">
        <PopupTriggerIconButton
          iconImgUrl="/icons/add-blue.svg"
          label="Add Experience"
          size={16}
          triggerEvent={EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL}
          data={addExperienceData}
          alt="add"
          analyticsData={{ method: 'onAddExperienceClicked', user: userInfo, member: member }}
        />
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
        }
      `}</style>
    </>
  );
};

export default EmptyMemberExperience;

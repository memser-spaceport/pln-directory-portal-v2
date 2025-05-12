import { EVENTS } from '@/utils/constants';
import Image from 'next/image';

export default function MemberDetailsExperienceDetail({ experience, isEditable, closeModal }: { experience: any, isEditable: boolean, closeModal: any }) {
  
  const getMonthName = (monthNumber: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber-1];
  };

  const getDuration = (startMonth: number, startYear: number, endMonth: number, endYear: number, isCurrent: boolean) => {
    const startDate = new Date(startYear, startMonth -1 , 1);
    let endDate;
    if (isCurrent) {
      endDate = new Date();
    } else {
      endDate = new Date(endYear, endMonth -1 , 1);
    }
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    const totalMonths = years * 12 + months;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    let result = '';
    if (y > 0) result += `${y} year${y > 1 ? 's' : ''} `;
    if (m > 0) result += `${m} month${m > 1 ? 's' : ''}`;
    return result.trim();
  };

  const handleEditExperience = () => {
    if(closeModal) {
      closeModal(); 
    }
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL, { detail: { experience: { ...experience, memberId: experience?.memberId } } }));
  };

  return (
    <>
      <div className="member-detail__experience__item__detail">
        <div className="member-detail__experience__item__detail__content--wrapper">
          <Image src={'/icons/member-details/experience-default.svg'} alt={experience?.company || 'Experience'} width={40} height={40} />
          <div className="member-detail__experience__item__detail__content">
            <p className="member-detail__experience__item__detail__title">{experience?.title}</p>
            <p className="member-detail__experience__item__detail__company">{experience?.company}</p>
            <p className="member-detail__experience__item__detail__duration">
              <span className="member-detail__experience__item__detail__duration__text">
                {getMonthName(experience?.start?.month)} {experience?.start?.year} - {experience?.isCurrent ? 'Present' : getMonthName(experience?.end?.month) + ' ' + experience?.end?.year}
              </span>
              <span className="member-detail__experience__item__detail__duration__dot">•</span>
              <span>{getDuration(experience?.start?.month, experience?.start?.year, experience?.end?.month, experience?.end?.year, experience?.isCurrent)}</span>
            </p>
            {experience?.location && <p className="member-detail__experience__item__detail__location">{experience?.location}</p>}
          </div>
        </div>
        {isEditable && (
          <button className="member-detail__experience__item__detail__button" onClick={handleEditExperience}>
            <Image src="/icons/edit-blue.svg" alt="edit" width={16} height={16} />
          </button>
        )}
      </div>
      
      <style jsx>
        {`
          .member-detail__experience__item__detail {
            display: flex;
            flex-direction: row;
            gap: 16px;
            align-items: center;
            justify-content: space-between;
          }
          .member-detail__experience__item__detail__content--wrapper {
            display: flex;
            flex-direction: row;
            gap: 16px;
            align-items: center;
          }
          .member-detail__experience__item__detail__title {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            letter-spacing: 0px;
            text-align: left;
          }
          .member-detail__experience__item__detail__company {
            font-weight: 500;
            font-size: 12px;
            line-height: 14px;
            letter-spacing: 1%;
          }
          .member-detail__experience__item__detail__duration {
            font-weight: 400;
            font-size: 12px;
            line-height: 14px;
            letter-spacing: 1%;
            color: #475569;
            display: flex;
            flex-direction: row;
            gap: 6px;
          }
          .member-detail__experience__item__detail__content {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .member-detail__experience__item__detail__location {
            font-size: 12px;
            font-weight: 400;
            line-height: 16px;
            letter-spacing: 0px;
            text-align: left;
            color: #475569;
          }
          .member-detail__experience__item__detail__duration__dot {
            color: #475569;
            width: 4px;
          }
          .member-detail__experience__item__detail__button {
            background-color: transparent;
            border: none;
          }
        `}
      </style>
    </>
  );
}

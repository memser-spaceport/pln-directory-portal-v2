import Image from 'next/image';
import styles from './list.module.css';
import PopupTriggerIconButton from '@/components/ui/popup-trigger-icon-button';
import { EVENTS } from '@/utils/constants';
export default function MemberDetailsExperienceDetail({ experience, isEditable, closeModal,member,userInfo }: { experience: any, isEditable: boolean, closeModal?: any, member: any, userInfo: any }) {
  
    const getMonthName = (date: Date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  };

  const getYear = (date: Date) => {
    return date.getFullYear();
  };

  const getDuration = (startDate: Date, endDate: Date, isCurrent: boolean) => {
    if (isCurrent) {
      endDate = new Date();
    } 
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    const totalMonths = years * 12 + months;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    let result = '';
    if (y > 0) result += `${y} year${y > 1 ? 's' : ''} `;
    if (m > 0) result += `${m} month${m > 1 ? 's' : ''}`;
    if (y === 0 && m === 0) result = 'Less than a month';
    return result.trim();
  };

  return (
    <>
      <div className={styles?.memberDetail__experience__item__detail}>
        <div className={styles?.memberDetail__experience__item__detail__content__wrapper}>
          <Image src={'/icons/member-details/experience-default.svg'} alt={experience?.company || 'Experience'} width={40} height={40} />
          <div className={styles?.memberDetail__experience__item__detail__content}>
            <p className={styles?.memberDetail__experience__item__detail__title}>{experience?.title}</p>
            <p className={styles?.memberDetail__experience__item__detail__company}>{experience?.company}</p>
            <p className={styles?.memberDetail__experience__item__detail__duration}>
              <span className={styles?.memberDetail__experience__item__detail__duration__text}>
                {getMonthName(experience?.startDate)} {getYear(experience?.startDate)} - {experience?.isCurrent ? 'Present' : getMonthName(experience?.endDate) + ' ' + getYear(experience?.endDate)}
              </span>
              <span className={styles?.memberDetail__experience__item__detail__duration__dot}>•</span>
              <span>{getDuration(experience?.startDate, experience?.endDate, experience?.isCurrent)}</span>
            </p>
            {experience?.location && <p className={styles?.memberDetail__experience__item__detail__location}>{experience?.location}</p>}
          </div>
        </div>
        {isEditable && (
          <PopupTriggerIconButton iconImgUrl="/icons/edit-blue.svg" size={16} triggerEvent={EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL} data={{experience: {...experience}}} alt="edit" callback={closeModal}
          analyticsData={{method: 'onEditExperienceClicked', user: userInfo, member: member}}
          />
        )}
      </div>
    </>
  );
}

import Image from 'next/image';
import styles from './list.module.css';
import PopupTriggerIconButton from '@/components/ui/popup-trigger-icon-button';
import { EVENTS } from '@/utils/constants';
import ExperienceDescription from './experience-description';
export default function MemberDetailsExperienceDetail({
  experience,
  isEditable,
  closeModal,
  member,
  userInfo,
}: {
  experience: any;
  isEditable: boolean;
  closeModal?: any;
  member: any;
  userInfo: any;
}) {
  const getMonthName = (date: string) => {
    const dateParts = date.split('T')[0].split('-');
    const month = parseInt(dateParts[1], 10);
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  };

  const getYear = (date: string) => {
    const dateParts = date.split('T')[0].split('-');
    return dateParts[0];
  };

  const getDuration = (startDate: string, endDate: string, isCurrent: boolean) => {
    if (isCurrent) {
      endDate = new Date().toISOString();
    }

    // Parse ISO strings to extract date parts
    const startParts = startDate.split('T')[0].split('-');
    const endParts = endDate.split('T')[0].split('-');

    // Get year and month as numbers
    const startYear = parseInt(startParts[0], 10);
    const startMonth = parseInt(startParts[1], 10);
    const endYear = parseInt(endParts[0], 10);
    const endMonth = parseInt(endParts[1], 10);

    // Calculate total months difference (add 1 to include both start and end months)
    let totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

    // If the difference is 0, but the years and months are the same, it's 1 month
    if (totalMonths === 0 && startYear === endYear && startMonth === endMonth) {
      totalMonths = 1;
    } else if (totalMonths >= 0) {
      // Add 1 to include both the start and end month in the count
      totalMonths += 1;
    }

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
          <div className={styles?.memberDetail__experience__item__detail__content__wrapper__image}>
            <Image
              src={'/icons/member-details/experience-default.svg'}
              alt={experience?.company || 'Experience'}
              width={40}
              height={40}
            />
          </div>
          <div className={styles?.memberDetail__experience__item__detail__content}>
            <p className={styles?.memberDetail__experience__item__detail__title}>{experience?.title}</p>
            <p className={styles?.memberDetail__experience__item__detail__company}>{experience?.company}</p>
            <p className={styles?.memberDetail__experience__item__detail__duration}>
              <span className={styles?.memberDetail__experience__item__detail__duration__text}>
                {getMonthName(experience?.startDate)} {getYear(experience?.startDate)} -{' '}
                {experience?.isCurrent
                  ? 'Present'
                  : getMonthName(experience?.endDate) + ' ' + getYear(experience?.endDate)}
              </span>
              <span className={styles?.memberDetail__experience__item__detail__duration__dot}>•</span>
              <span>{getDuration(experience?.startDate, experience?.endDate, experience?.isCurrent)}</span>
            </p>
            {experience?.location && (
              <p className={styles?.memberDetail__experience__item__detail__location}>{experience?.location}</p>
            )}
            {experience?.description?.length > 0 && <ExperienceDescription description={experience?.description} />}
          </div>
        </div>
        {isEditable && (
          <div className={styles?.memberDetail__experience__item__detail__actions}>
            <PopupTriggerIconButton
              iconImgUrl="/icons/edit-blue.svg"
              size={16}
              triggerEvent={EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL}
              data={{ experience: { ...experience } }}
              alt="edit"
              callback={closeModal}
              analyticsData={{ method: 'onEditExperienceClicked', user: userInfo, member: member }}
            />
          </div>
        )}
      </div>
    </>
  );
}

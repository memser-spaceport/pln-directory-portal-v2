import { getAllMemberExperiences } from '@/services/members-experience.service';
import styles from './list.module.css';
import EmptyMemberExperience from './empty-member-experience';
import { EVENTS } from '@/utils/constants';
import AllListModal from './all-list-modal';
import AddEditExperienceModal from './add-edit-experience-modal';
import MemberDetailsExperienceDetail from './experience-detail';
import PopupTriggerIconButton from '@/components/ui/popup-trigger-icon-button';

export default async function ExperienceList({ member, isEditable }: { member: any; isEditable: boolean }) {
  let experiences = [];
  let formattedExperiences = [];
  let seeAllExperienceData = null;
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
      }
  }



    const formatExperience = (experiences: any) => {
    return experiences.map((experience: any) => {
      return {
        memberId: experience?.memberUid,
        company: experience?.company,
        title: experience?.title,
        startDate: experience?.startDate ? new Date(experience?.startDate) : new Date(),
        endDate: experience?.endDate ? new Date(experience?.endDate) : new Date(),
        isCurrent: experience?.isCurrent,
        location: experience?.location,
        uid: experience?.uid ?? '',
        isFlaggedByUser: experience?.isFlaggedByUser ?? false,
      };
    });
  };

  try {
    experiences = await getAllMemberExperiences(member?.id);
    formattedExperiences = formatExperience(experiences);
    seeAllExperienceData = {
      experiences: formattedExperiences,
      isEditable: isEditable,
    }

  } catch (error) {
    return <></>;
  }

  return (
    <>
      {(formattedExperiences.length > 0 || isEditable) && (
        <div className={styles?.memberDetail__experience__list}>
          <div className={styles?.memberDetail__experience__list__header}>
            <h2 className={styles?.memberDetail__experience__header__title}>Experience</h2>
            <div className={styles?.memberDetail__experience__header__actions}>
            {
              (isEditable && formattedExperiences.length > 0) && (
                <PopupTriggerIconButton iconImgUrl="/icons/add-blue.svg" label="Add" size={16} triggerEvent={EVENTS.TRIGGER_ADD_EDIT_EXPERIENCE_MODAL} data={addExperienceData} alt="add" />
              )
            }
            {
              experiences.length > 4 && (
                <PopupTriggerIconButton label="See All" size={16} triggerEvent={EVENTS.TRIGGER_SEE_ALL_EXPERIENCE_MODAL} data={seeAllExperienceData} alt="seeall" />
              )
            }
            </div>
            </div>
          <div>
            {(formattedExperiences.length === 0 && isEditable) && (
              <div className={styles?.memberDetail__experience__list__empty}>
                <EmptyMemberExperience member={member} />
              </div>
            )}
            {experiences.length > 0 && (
              <div className={styles?.memberDetail__experience__list__content}>
                {formattedExperiences.slice(0, 4).map((experience: any, index: number) => (
                  <div key={index}>
                    <MemberDetailsExperienceDetail experience={experience} isEditable={isEditable} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <AddEditExperienceModal />
          <AllListModal />
        </div>
      )}
    </>
  );
}

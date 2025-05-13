import EmptyMemberExperience from './empty-member-experience';
import MemberDetailsExperienceDetail from './experience-detail';
import styles from './list.module.css';

export default function ExperienceListContent({ experiences, member, isEditable }: { experiences: any[]; member: any; isEditable: boolean }) {
  return (
    <>
      <div>
        {experiences.length === 0 && isEditable && (
          <div className={styles?.memberDetail__experience__list__empty}>
            <EmptyMemberExperience member={member} />
          </div>
        )}
        {experiences.length > 0 && (
          <div className={styles?.memberDetail__experience__list__content}>
            {experiences.slice(0, 4).map((experience) => (
              <div key={experience.id}>
                <MemberDetailsExperienceDetail experience={experience} isEditable={isEditable} closeModal={null}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

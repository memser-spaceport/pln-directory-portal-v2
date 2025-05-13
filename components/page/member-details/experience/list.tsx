import { getAllMemberExperiences } from '@/services/members-experience.service';
import styles from './list.module.css';
import ExperienceListHeader from './list-header';
import ExperienceListContent from './list-content';

export default async function ExperienceList({ member, isEditable }: { member: any, isEditable: boolean }) {
  let experiences = [];
  let formattedExperiences = [];

  
const formatExperience = (experiences: any) => {
    return experiences.map((experience: any) => {
      return {  
          'memberId': experience?.memberUid,
          'company': experience?.company,
          'title': experience?.title,
          "start": {
            "year": experience?.startDate?.year ?? 1970,
            "month": experience?.startDate?.month ?? 1,
            "day": experience?.startDate?.day ?? 1
          },
          'end': {
            'year': experience?.endDate?.year ?? 1970,
            'month': experience?.endDate?.month ?? 1,
            'day': experience?.endDate?.day ?? 1
          },
          'isCurrent': experience?.isCurrent,
          'location': experience?.location,
          'uid': experience?.uid ?? '',
          'isFlaggedByUser': experience?.isFlaggedByUser ?? false
        }
      })
  }


  try {
    experiences = await getAllMemberExperiences(member?.id);
    formattedExperiences = formatExperience(experiences);
  } catch (error) {
    return <></>;
  }

  return (
    <>
    {
        (formattedExperiences.length > 0 || isEditable) && (
            <div className={styles?.memberDetail__experience__list}>
                <ExperienceListHeader member={member} experiences={formattedExperiences} isEditable={isEditable}/>
                <ExperienceListContent experiences={formattedExperiences} member={member} isEditable={isEditable} />
            </div>
        )
    }
    </>
  );
}

import ListHeaderActions from './list-header-actions';
import styles from './list.module.css';

export default function ExperienceListHeader({ member, experiences, isEditable }: { member: any; experiences: any[]; isEditable: boolean }) {
  return (
    <>
      <div className={styles?.memberDetail__experience__list__header}>
        <h2 className={styles?.memberDetail__experience__header__title}>Experience</h2>
        <ListHeaderActions member={member} hasSeeAll={experiences.length > 4} experiences={experiences} isEditable={isEditable} />
      </div>
    </>
  );
}

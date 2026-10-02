import ActivitiesComponent from '@/components/page/aligement-assets/activities/activities-component';
import { PlaaBot } from '@/app/ClientDynamics';
import styles from './page.module.css';

export default function ActivitiesPage() {
  return (
    <div className={styles.activities}>
      <ActivitiesComponent />
      <PlaaBot />
    </div>
  );
}

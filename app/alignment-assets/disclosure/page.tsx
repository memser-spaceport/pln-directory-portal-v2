import Disclosure from '@/components/page/aligement-assets/disclosure/disclosure';
import DisclaimerSection from '@/components/page/aligement-assets/rounds/sections/disclaimer-section';
import SupportSection from '@/components/page/aligement-assets/rounds/sections/support-section';

import styles from './page.module.css';

const DisclosurePage = () => {
  return (
    <div className={styles.disclosure}>
      <div className={styles.disclosure__content}>
        <Disclosure />
        <DisclaimerSection />
      </div>
      <SupportSection />
    </div>
  );
};

export default DisclosurePage;

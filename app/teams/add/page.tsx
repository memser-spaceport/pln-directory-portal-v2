import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import StepsIndicatorDesktop from '@/components/core/register/steps-indicator-desktop';
import StepsIndicatorMobile from '@/components/core/register/steps-indicator-mobile';
import TeamRegisterForm from '@/components/page/team-form-info/team-register-form';
import TeamRegisterInfo from '@/components/page/team-form-info/team-register-info';
import styles from './page.module.css';
import LoginInfo from '@/components/page/team-form-info/team-login-info';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export default function AddTeam(props: any) {
  const steps = ['basic', 'project details', 'social', 'success'];

  const { userInfo } = getPageData();

  const showLoginInfo = !userInfo;
  

  return (
    <>
      {!showLoginInfo && (
        <div className={styles.teamReg}>
          <div className={styles.teamReg__cn}>
            <div className={styles.teamReg__cn__mobile}>
              <StepsIndicatorMobile steps={steps} />
            </div>
            <aside className={styles.teamReg__cn__desktopinfo}>
              <TeamRegisterInfo />
              <StepsIndicatorDesktop skip={['success']} steps={steps} />
            </aside>
            <section className={styles.teamReg__cn__content}>
              <RegsiterFormLoader />
              <TeamRegisterForm />
            </section>
          </div>
        </div>
      )}
      {showLoginInfo && (
        <div className={styles.loginPrompt}>
          <LoginInfo />
        </div>
      )}
    </>
  );
}

function getPageData() {
  const { userInfo } = getCookiesFromHeaders();

  return {
    userInfo
  };
}

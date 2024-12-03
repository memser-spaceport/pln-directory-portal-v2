import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { Metadata } from 'next';
import styles from './page.module.css';
import { getSkillsData } from '@/services/sign-up.service';
import SignUp from '@/components/core/sign-up/sign-up';

const getPageData = async () => {
  const memberInfo = await getSkillsData();
  if (memberInfo.isError) {
    return {
      isError: true,
    };
  }

  return {
    skillsInfo: memberInfo.skills,
  };
};

export default async function Page() {
  const { skillsInfo } = await getPageData();
  return (
    <>
      <div className={styles.signup}>
        <div className={styles.signup__cn}>
          <SignUp skillsInfo={skillsInfo} />
        </div>
      </div>
    </>
  );
}

export const metadata: Metadata = {
  title: 'Sign Up | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};

import React, { useMemo } from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import Image from 'next/image';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import s from './RepositoriesList.module.scss';
import { useMemberRepositories } from '@/services/members/hooks/useMemberRepositories';

interface Props {
  isEditable: boolean;
  member: IMember;
  userInfo: IUserInfo;
}

export const RepositoriesList = ({ isEditable, member }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { githubHandle } = member;

  const { data: repositories } = useMemberRepositories(member?.id);

  const { data, isError } = useMemo(() => {
    if (!repositories) {
      return {
        data: [],
        isError: false,
      };
    }

    if ('statusCode' in repositories) {
      return { data: [], isError: true };
    }

    return { data: repositories, isError: false };
  }, [repositories]);

  const scrollToId = (id: string) => {
    // Update the URL with the hash without page reload
    router.replace(`${pathname}#${id}`);

    // Scroll to the element with the ID after a tiny delay
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.title}>Repositories</h2>
        {!isError && githubHandle && (
          <Link href={`https://github.com/${githubHandle}`} className={s.profileLink}>
            <Image src="/icons/contact/github-contact-logo.svg" alt="GitHub" height={24} width={24} />
            Github Profile
            <LinkIcon />
          </Link>
        )}
      </div>
      {!!data?.length && (
        <ul className={s.list}>
          {data?.slice(0, 5).map((item) => (
            <li key={item.url} className={s.expItem}>
              <ExpIcon />
              <div className={s.details}>
                <div className={s.row}>
                  <div className={s.primaryLabel}>{item.name}</div>
                </div>
                <div className={s.row}>
                  <div className={s.secondaryLabel}>{item.description}</div>
                </div>
              </div>
              <Link href={item.url} target="_blank" className={s.link}>
                <LinkIcon />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!data?.length && (
        <div className={s.emptyData}>
          <span className={s.label}>
            {isError && isEditable && 'Unable to fetch repositories at the time.'}
            {isError && !isEditable && 'Not provided'}
            {!isError && githubHandle && 'No repositories to display, add new ones to your GitHub profile.'}
            {!isError && !githubHandle && isEditable && 'Add your Github handle in the Contact Details section to see your repositories.'}
            {!isError && !githubHandle && !isEditable && 'Not provided'}
          </span>
          {/*{!githubHandle && (*/}
          {/*  <button*/}
          {/*    className={s.connectButton}*/}
          {/*    onClick={() => {*/}
          {/*      scrollToId('contact-details');*/}
          {/*    }}*/}
          {/*  >*/}
          {/*    <Image src="/icons/contact/github-contact-logo.svg" alt="GitHub" height={24} width={24} />*/}
          {/*    Connect GitHub*/}
          {/*  </button>*/}
          {/*)}*/}
        </div>
      )}
    </div>
  );
};

const ExpIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.625 27.3008C10.1578 27.3008 9.69957 27.4214 9.29492 27.6504L9.125 27.7559C8.6812 28.0524 8.33521 28.4737 8.13086 28.9668C7.9265 29.4602 7.87238 30.0036 7.97656 30.5273C8.06776 30.9857 8.27635 31.4114 8.58008 31.7637L8.71582 31.9092C9.09342 32.2868 9.57488 32.5443 10.0986 32.6484C10.5567 32.7395 11.0293 32.71 11.4707 32.5645L11.6582 32.4951C12.0899 32.3163 12.4667 32.0286 12.7529 31.6621L12.8701 31.5C13.1666 31.0561 13.3252 30.5339 13.3252 30C13.3251 29.3736 13.1074 28.7694 12.7139 28.2891L12.5342 28.0908C12.0279 27.5846 11.341 27.3008 10.625 27.3008ZM11.1514 7.35254C10.6933 7.26148 10.2207 7.29092 9.7793 7.43652L9.5918 7.50586C9.0985 7.71019 8.67656 8.05608 8.37988 8.5C8.08328 8.9439 7.92489 9.46613 7.9248 10C7.9248 10.6266 8.14245 11.2315 8.53613 11.7119L8.71582 11.9092C9.22217 12.4155 9.90892 12.7002 10.625 12.7002C11.0922 12.7002 11.5504 12.5796 11.9551 12.3506L12.125 12.2451C12.569 11.9484 12.9148 11.5265 13.1191 11.0332C13.3234 10.5399 13.3776 9.99728 13.2734 9.47363C13.1693 8.94988 12.9118 8.46842 12.5342 8.09082C12.2037 7.76045 11.7939 7.52256 11.3457 7.39844L11.1514 7.35254ZM30.4082 7.50586C29.9767 7.32713 29.5072 7.26366 29.0459 7.32031L28.8486 7.35254C28.3904 7.44368 27.9645 7.65157 27.6123 7.95508L27.4658 8.09082C27.1355 8.42118 26.8976 8.83125 26.7734 9.2793L26.7266 9.47363C26.6354 9.93193 26.6648 10.4051 26.8105 10.8467L26.8809 11.0332C27.0852 11.5265 27.431 11.9484 27.875 12.2451C28.319 12.5418 28.841 12.7002 29.375 12.7002C30.0015 12.7002 30.6055 12.4825 31.0859 12.0889L31.2842 11.9092C31.7904 11.4029 32.0752 10.716 32.0752 10C32.0751 9.46613 31.9167 8.9439 31.6201 8.5C31.3605 8.11156 31.0051 7.79805 30.5898 7.58887L30.4082 7.50586ZM28.3252 14.6895L28.1748 14.6504C27.4142 14.454 26.7152 14.0744 26.1377 13.5469L25.8984 13.3125C25.2796 12.6623 24.8551 11.8508 24.6738 10.9717C24.5153 10.2025 24.5483 9.40786 24.7676 8.65723L24.873 8.33887C25.1454 7.60212 25.5936 6.94495 26.1768 6.42383L26.4346 6.20898C27.1441 5.6591 27.9937 5.31886 28.8867 5.22754C29.668 5.14765 30.4551 5.26162 31.1797 5.55566L31.4863 5.69238C32.1918 6.03796 32.8003 6.55054 33.2598 7.18359L33.4473 7.46191C33.8631 8.12826 34.108 8.88494 34.1631 9.66504L34.1748 10.001C34.1737 10.9986 33.8628 11.9695 33.2871 12.7803L33.1689 12.9395C32.5175 13.7808 31.6051 14.3828 30.5752 14.6504L30.4248 14.6895V17.5C30.4248 18.4415 30.0505 19.345 29.3848 20.0107C28.719 20.6763 27.8164 21.0508 26.875 21.0508H13.125C12.7885 21.0508 12.4641 21.1675 12.2061 21.3789L12.0996 21.4756C11.828 21.7474 11.6749 22.1157 11.6748 22.5V25.3115L11.8252 25.3506C12.9562 25.6427 13.942 26.3369 14.5977 27.3037C15.2533 28.2706 15.5339 29.4436 15.3867 30.6025C15.2487 31.689 14.7438 32.6935 13.959 33.4512L13.7979 33.5996C12.9213 34.3718 11.7932 34.7979 10.625 34.7979C9.52972 34.7978 8.46967 34.4234 7.61914 33.7402L7.45215 33.5996C6.63043 32.8757 6.08214 31.894 5.89551 30.8193L5.86328 30.6025C5.7253 29.5159 5.96348 28.4172 6.53418 27.4873L6.65234 27.3037C7.30799 26.3369 8.29379 25.6427 9.4248 25.3506L9.5752 25.3115V14.6895L9.4248 14.6504C8.36446 14.3766 7.43197 13.749 6.7793 12.875L6.65234 12.6973C6.03757 11.7907 5.75267 10.7027 5.84082 9.61523L5.86328 9.39844C6.00127 8.31202 6.50627 7.30744 7.29102 6.5498L7.45215 6.40137C8.32874 5.62912 9.45676 5.20313 10.625 5.20312C11.7203 5.20312 12.7803 5.57752 13.6309 6.26074L13.7979 6.40137C14.6196 7.12535 15.1679 8.10689 15.3545 9.18164L15.3867 9.39844C15.5247 10.4851 15.2865 11.5838 14.7158 12.5137L14.5977 12.6973C13.942 13.664 12.9562 14.3583 11.8252 14.6504L11.6748 14.6895V19.25L11.9424 19.1543C12.227 19.0529 12.5231 18.9885 12.8232 18.9629L13.125 18.9502H26.875C27.2115 18.9502 27.5359 18.8335 27.7939 18.6221L27.9004 18.5254C28.1722 18.2535 28.3252 17.8845 28.3252 17.5V14.6895Z"
      fill="#93C5FD"
      stroke="white"
      strokeWidth="0.4"
    />
  </svg>
);

const LinkIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={s.link}>
    <path
      d="M0.84375 8.93359C0.953125 9.07031 1.11719 9.125 1.28125 9.125C1.47266 9.125 1.63672 9.07031 1.74609 8.93359L8.0625 2.61719V7.59375C8.0625 7.97656 8.36328 8.25 8.71875 8.25C9.10156 8.25 9.375 7.97656 9.375 7.59375V1.03125C9.375 0.675781 9.10156 0.375 8.71875 0.375H2.15625C1.80078 0.375 1.5 0.675781 1.5 1.03125C1.5 1.41406 1.80078 1.6875 2.15625 1.6875H7.16016L0.84375 8.00391C0.570312 8.27734 0.570312 8.6875 0.84375 8.93359Z"
      fill="#0F172A"
    />
  </svg>
);

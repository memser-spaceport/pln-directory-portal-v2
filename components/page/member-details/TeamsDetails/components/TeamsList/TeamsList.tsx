import React from 'react';
import Image from 'next/image';
import { AddButton } from '@/components/page/member-details/components/AddButton';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { Separator } from '@base-ui-components/react/separator';

import s from './TeamsList.module.scss';
import { ITeam } from '@/types/teams.types';
import Link from 'next/link';

interface Props {
  isEditable: boolean;
  onAdd: () => void;
  onEdit: (item: ITeam) => void;
  member: IMember;
  userInfo: IUserInfo;
}

export const TeamsList = ({ isEditable, onAdd, onEdit, member }: Props) => {
  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.title}>Teams {member.teams?.length ? `(${member.teams.length})` : ''}</h2>
        {isEditable && <AddButton onClick={onAdd} />}
      </div>
      {!!member.teams?.length && (
        <ul className={s.list}>
          {member.teams?.map((item) => (
            <li key={item.id} className={s.expItem}>
              {item.logo ? (
                <Image
                  src={item.logo ?? '/icons/default-project.svg'}
                  alt={item.name ?? ''}
                  width={40}
                  height={40}
                  className={s.logo}
                />
              ) : (
                <ExpIcon />
              )}
              <div className={s.details}>
                <div className={s.row}>
                  <Link href={`/teams/${item.id}`} className={s.primaryLabel}>
                    {item.name}
                  </Link>
                </div>
                <div className={s.row}>
                  <div className={s.secondaryLabel}>{item.role}</div>
                </div>
              </div>
              <div className={s.tags}>{item.mainTeam && <div className={s.primaryTeamBadge}>Primary Team</div>}</div>
              {isEditable && (
                <button className={s.editBtn} onClick={() => onEdit(item)}>
                  <EditIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!member.teams?.length && (
        <div className={s.emptyData}>
          <span className={s.label}>{isEditable ? 'Add your team' : 'Not provided'}</span>
          {/*<button className={s.connectButton}>*/}
          {/*  <Image src="/icons/contact/linkedIn-contact-logo.svg" alt="Linkedin" height={24} width={24} />*/}
          {/*  Connect LinkedIn*/}
          {/*</button>*/}
        </div>
      )}
    </div>
  );
};

const ExpIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M33.75 8.75H27.5V7.5C27.5 6.50544 27.1049 5.55161 26.4017 4.84835C25.6984 4.14509 24.7446 3.75 23.75 3.75H16.25C15.2554 3.75 14.3016 4.14509 13.5983 4.84835C12.8951 5.55161 12.5 6.50544 12.5 7.5V8.75H6.25C5.58696 8.75 4.95107 9.01339 4.48223 9.48223C4.01339 9.95107 3.75 10.587 3.75 11.25V31.25C3.75 31.913 4.01339 32.5489 4.48223 33.0178C4.95107 33.4866 5.58696 33.75 6.25 33.75H33.75C34.413 33.75 35.0489 33.4866 35.5178 33.0178C35.9866 32.5489 36.25 31.913 36.25 31.25V11.25C36.25 10.587 35.9866 9.95107 35.5178 9.48223C35.0489 9.01339 34.413 8.75 33.75 8.75ZM15 7.5C15 7.16848 15.1317 6.85054 15.3661 6.61612C15.6005 6.3817 15.9185 6.25 16.25 6.25H23.75C24.0815 6.25 24.3995 6.3817 24.6339 6.61612C24.8683 6.85054 25 7.16848 25 7.5V8.75H15V7.5ZM33.75 11.25V17.752C29.5309 20.0484 24.8036 21.251 20 21.25C15.1966 21.2509 10.4694 20.0486 6.25 17.753V11.25H33.75ZM33.75 31.25H6.25V20.569C10.5312 22.6631 15.2343 23.7515 20.0002 23.7511C24.7662 23.7508 29.4691 22.6617 33.75 20.567V31.25ZM16.25 17.5C16.25 17.1685 16.3817 16.8505 16.6161 16.6161C16.8505 16.3817 17.1685 16.25 17.5 16.25H22.5C22.8315 16.25 23.1495 16.3817 23.3839 16.6161C23.6183 16.8505 23.75 17.1685 23.75 17.5C23.75 17.8315 23.6183 18.1495 23.3839 18.3839C23.1495 18.6183 22.8315 18.75 22.5 18.75H17.5C17.1685 18.75 16.8505 18.6183 16.6161 18.3839C16.3817 18.1495 16.25 17.8315 16.25 17.5Z"
      fill="#CDD4DE"
    />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.8789 1.35156L13.3984 1.87109C14 2.47266 14 3.42969 13.3984 4.03125L12.5781 4.85156L9.89844 2.17188L10.7188 1.35156C11.3203 0.75 12.2773 0.75 12.8789 1.35156ZM4.70312 7.36719L9.26953 2.80078L11.9492 5.48047L7.38281 10.0469C7.21875 10.2109 7 10.3477 6.78125 10.4297L4.34766 11.2227C4.12891 11.3047 3.85547 11.25 3.69141 11.0586C3.5 10.8945 3.44531 10.6211 3.52734 10.4023L4.32031 7.96875C4.40234 7.75 4.53906 7.53125 4.70312 7.36719ZM2.625 2.5H5.25C5.71484 2.5 6.125 2.91016 6.125 3.375C6.125 3.86719 5.71484 4.25 5.25 4.25H2.625C2.13281 4.25 1.75 4.66016 1.75 5.125V12.125C1.75 12.6172 2.13281 13 2.625 13H9.625C10.0898 13 10.5 12.6172 10.5 12.125V9.5C10.5 9.03516 10.8828 8.625 11.375 8.625C11.8398 8.625 12.25 9.03516 12.25 9.5V12.125C12.25 13.5742 11.0742 14.75 9.625 14.75H2.625C1.17578 14.75 0 13.5742 0 12.125V5.125C0 3.67578 1.17578 2.5 2.625 2.5Z"
      fill="#64748B"
    />
  </svg>
);

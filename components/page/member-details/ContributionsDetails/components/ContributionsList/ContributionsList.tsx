import React from 'react';

import { AddButton } from '@/components/page/member-details/components/AddButton';

import { IMember, IProjectContribution } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import Image from 'next/image';

import s from './ContributionsList.module.scss';

interface Props {
  isEditable: boolean;
  onAdd: () => void;
  onEdit: (item: IProjectContribution) => void;
  member: IMember;
  userInfo: IUserInfo;
}

export const ContributionsList = ({ isEditable, onAdd, onEdit, member }: Props) => {
  const allContributions = member?.projectContributions ?? [];
  const presentContributions = [...allContributions].filter((v) => v.endDate === null).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const pastContributions = [...allContributions].filter((v) => v.endDate !== null).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  const data = [...presentContributions, ...pastContributions];

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.title}>Project Contributions {data?.length ? `(${data.length})` : ''}</h2>
        {isEditable && <AddButton onClick={onAdd} />}
      </div>
      {!!data?.length && (
        <ul className={s.list}>
          {data?.map((item) => (
            <li key={item.uid} className={s.expItem}>
              <Image src={item.project.logo?.url ?? '/icons/default-project.svg'} alt={item.project.name} width={40} height={40} className={s.logo} />
              <div className={s.details}>
                <div className={s.row}>
                  <div className={s.primaryLabel}>{item.project.name}</div>
                </div>
                <div className={s.row}>
                  <div className={s.secondaryLabel}>{item.role}</div>
                </div>
              </div>
              {isEditable && (
                <button className={s.editBtn} onClick={() => onEdit(item)}>
                  <EditIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!data?.length && (
        <div className={s.emptyData}>
          <span className={s.label}>Add project experience & contribution details.</span>
          {/*<button className={s.connectButton}>*/}
          {/*  <AddIcon />*/}
          {/*  Add Project*/}
          {/*</button>*/}
        </div>
      )}
    </div>
  );
};

const AddIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.3438 7.09375C14.6992 7.09375 15 7.39453 15 7.75C15 8.13281 14.6992 8.40625 14.3438 8.40625H8.65625V14.0938C8.65625 14.4766 8.35547 14.75 7.97266 14.75C7.61719 14.75 7.31641 14.4766 7.31641 14.0938V8.40625H1.62891C1.27344 8.40625 0.972656 8.13281 0.972656 7.75C0.972656 7.39453 1.27344 7.09375 1.62891 7.09375H7.31641V1.40625C7.31641 1.05078 7.61719 0.75 7.97266 0.75C8.35547 0.75 8.65625 1.05078 8.65625 1.40625V7.09375H14.3438Z"
      fill="#0F172A"
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

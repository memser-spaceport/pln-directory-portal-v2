'use client';

import clsx from 'clsx';
import { getSocialLinkUrl, type LinkedinProfileKind } from '@/utils/common.utils';

import s from './TeamProfileSocialLink.module.scss';

interface Props {
  type: string;
  logo?: string;
  height?: number;
  width?: number;
  profile: string;
  handle?: string;
  callback: (type: string, url: string) => void;
  linkedinProfileKind?: LinkedinProfileKind;
}

export const TeamProfileSocialLink = (props: Props) => {
  const { callback, profile, type, logo, height, width, handle, linkedinProfileKind = 'company' } = props;

  const href = getSocialLinkUrl(profile, type, handle, linkedinProfileKind);

  return (
    <a
      title={profile}
      onClick={() => callback(type, href)}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      data-testid="profile-social-link"
      className={clsx(s.root, {
        [s.incomplete]: !handle,
      })}
    >
      <img loading="lazy" src={logo} alt={type} height={height} width={width} />
      {(profile || handle) && <p className={s.link}>{profile ? profile : handle}</p>}
    </a>
  );
};

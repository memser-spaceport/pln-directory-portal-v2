'use client';

import clsx from 'clsx';
import { getSocialLinkUrl } from '@/utils/common.utils';

import s from './TeamProfileSocialLink.module.scss';

interface Props {
  type: string;
  logo?: string;
  height?: number;
  width?: number;
  preferred?: boolean;
  profile: string;
  handle: string;
  callback: (type: string, url: string) => void;
}

export const TeamProfileSocialLink = (props: Props) => {
  const { callback, profile, type, logo, height, width, handle, preferred = false } = props;

  const href = getSocialLinkUrl(profile, type, handle);

  return (
    <a
      title={profile}
      onClick={() => callback(type, href)}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      data-testid="profile-social-link"
      className={clsx(s.root, preferred ? s.preferred : s.notPreferred)}
    >
      <img loading="lazy" src={logo} alt={type} height={height} width={width} />
      <p className={s.link}>{profile ? profile : handle}</p>
    </a>
  );
};

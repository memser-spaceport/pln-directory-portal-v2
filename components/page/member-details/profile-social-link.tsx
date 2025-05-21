'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getSocialLinkUrl } from '@/utils/common.utils';
import { ReactNode } from 'react';

interface IProfileSocialLink {
  type: string;
  logo?: string;
  height?: number;
  width?: number;
  preferred?: boolean;
  profile: string;
  handle: string;
  callback: (type: string, url: string) => void;
  isPreview?: boolean;
  suffix?: ReactNode;
}

export function ProfileSocialLink(props: IProfileSocialLink) {
  const { suffix, isPreview, profile, type, logo, height, width, handle, preferred = false, callback } = props;

  const href = getSocialLinkUrl(profile, type, handle);

  return (
    <>
      <Tooltip
        asChild
        trigger={
          <div className="profile-social-link__suffix">
            <a
              onClick={() => {
                callback(type, href);
              }}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              data-testid="profile-social-link"
              className={`profile-social-link ${preferred ? 'preffered' : 'not-preferred'} `}
            >
              <img loading="lazy" src={logo} alt={type} height={height} width={width} />
              <p className={`profile-social-link__link ${isPreview ? 'profile-social-link__link-preview' : ''}`}>{profile ? profile : handle}</p>
            </a>
            {suffix}
          </div>
        }
        content={profile}
      />

      <style jsx>
        {`
          .profile-social-link {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px;
            //background-color: #f1f5f9;
            cursor: pointer;
          }

          .profile-social-link__link {
            color: #0f172a;
            font-size: 12px;
            font-weight: 500;
            line-height: 14px;
            display: inline-block;
            overflow: hidden;
            text-wrap: nowrap;
            max-width: 100px;
            text-overflow: ellipsis;
          }

          .profile-social-link__suffix {
            display: inline-flex;
            align-items: center;
          }

          .profile-social-link__link-preview {
            filter: blur(4px);
          }

          .preffered {
            border-radius: 0 4px 4px 0;
          }

          .not-preferred {
            border-radius: 4px;
          }

          @media (min-width: 1024px) {
            .profile-social-link__link {
              max-width: 150px;
            }
          }
        `}
      </style>
    </>
  );
}

'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getSocialLinkUrl } from '@/utils/common.utils';

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
}

export function ProfileSocialLink(props: IProfileSocialLink) {
  const callback = props?.callback;
  const profile = props?.profile;
  const type = props?.type;
  const logo = props?.logo;
  const height = props?.height;
  const width = props?.width;
  const preferred = props?.preferred ?? false;
  const handle = props?.handle;
  const isPreview = props.isPreview;

  const href = getSocialLinkUrl(profile, type, handle);
  return (
    <>
      <Tooltip
        asChild
        trigger={
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
        }
        content={profile}
      />

      <style jsx>
        {`
        .profile-social-link {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background-color: #F1F5F9;
          cursor: pointer;
        }

        .profile-social-link__link {
            color: #0F172A;
            font-size: 12px;
            font-weight: 500;
            line-height: 14px;
            display: inline-block;
            overflow: hidden;
            text-wrap: nowrap;
            max-width: 100px;
            text-overflow: ellipsis;
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
        .`}
      </style>
    </>
  );
}

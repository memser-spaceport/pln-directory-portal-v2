'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getSocialLinkUrl } from '@/utils/common.utils';

/**
 * Props for the ProfileSocialLink component.
 * @interface IProfileSocialLink
 * @property {string} type - The type of social link (e.g., twitter, linkedin).
 * @property {string} [logo] - The logo image URL for the social link.
 * @property {number} [height] - The height of the logo image.
 * @property {number} [width] - The width of the logo image.
 * @property {boolean} [preferred] - Whether this is the preferred social link.
 * @property {string} profile - The profile name or identifier.
 * @property {string} handle - The handle or fallback identifier.
 * @property {(type: string, url: string) => void} callback - Callback when the link is clicked.
 */

interface IProfileSocialLink {
  type: string;
  logo?: string;
  height?: number;
  width?: number;
  preferred?: boolean;
  profile: string;
  handle: string;
  callback: (type: string, url: string) => void;
}

/**
 * Renders a social profile link with logo and profile/handle text.
 * Applies different styles based on the 'preferred' prop.
 *
 * @param {IProfileSocialLink} props - The props for the component.
 * @returns {JSX.Element} The rendered social link component.
 */

export function ProfileSocialLink(props: IProfileSocialLink) {
  // Section: Extract props for clarity and maintainability
  const callback = props?.callback;
  const profile = props?.profile;
  const type = props?.type;
  const logo = props?.logo;
  const height = props?.height;
  const width = props?.width;
  const preferred = props?.preferred ?? false;
  const handle = props?.handle;

  // Section: Compute the social link URL
  const href = getSocialLinkUrl(profile, type, handle);
  return (
    <>
      {/* <Tooltip
        trigger={ */}
      <a
        title={profile}
        onClick={() => callback(type, href)}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        data-testid="profile-social-link"
        className={`profile-social-link ${preferred ? 'preffered' : 'not-preferred'} `}
      >
        {/* Logo image for the social link */}
        <img loading="lazy" src={logo} alt={type} height={height} width={width} />
        {/* Display profile or fallback to handle */}
        <p className="profile-social-link__link">{profile ? profile : handle}</p>
      </a>
      {/* }
        content={href} */}
      {/* /> */}

      <style jsx>
        {`
        .profile-social-link {
          display: flex;
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
            display: inine-block;
            overflow: hidden;
            text-wrap: nowrap;
            max-width: 100px;
            text-overflow: ellipsis;
        }

        .preffered {
            border-radius: 0px 4px 4px 0px;
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

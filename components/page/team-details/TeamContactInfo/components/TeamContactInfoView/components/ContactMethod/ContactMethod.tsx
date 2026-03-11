'use client';

import { validateEmail } from '@/utils/common.utils';
import { TeamProfileSocialLink } from '../TeamProfileSocialLink';

interface Props {
  contactMethod: string;
  callback: (type: string, url: string) => void;
}

export const ContactMethod = (props: Props) => {
  const { contactMethod, callback } = props;
  const isEmail = validateEmail(contactMethod);
  const type = isEmail ? 'email' : 'website';

  if (!contactMethod) {
    return null;
  }

  return (
    <TeamProfileSocialLink
      callback={callback}
      profile={contactMethod}
      handle={contactMethod}
      logo={'/icons/contact/team-contact-logo.svg'}
      height={24}
      width={24}
      type={type}
      preferred={true}
    />
  );
};

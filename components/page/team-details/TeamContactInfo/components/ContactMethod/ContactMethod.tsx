'use client';

import Image from 'next/image';
import { validateEmail } from '@/utils/common.utils';
import { TeamProfileSocialLink } from '../TeamProfileSocialLink';

import s from './ContactMethod.module.scss';

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
    <div className={s.root}>
      <div className={s.pin} title="Preferred">
        <Image loading="lazy" alt="pin" src="/icons/pin.svg" height={24} width={24} />
      </div>
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
    </div>
  );
};

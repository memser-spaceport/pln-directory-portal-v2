'use client';

import { validateEmail } from '@/utils/common.utils';
import { ProfileSocialLink } from './profile-social-link';
import Image from 'next/image';

interface IContactMethod {
  contactMethod: string;
  callback: (type: string, url: string) => void;
}
const ContactMethod = (props: IContactMethod) => {
  const contactMethod = props?.contactMethod;
  const isEmail = validateEmail(contactMethod);
  const type = isEmail ? 'email' : '';
  const callback = props?.callback;
  return (
    <>
      {contactMethod && (
        <div className="contact-method">
          <div className="contact-method__pin" title='Preferred'>
            <Image loading="lazy" alt="pin" src="/icons/pin.svg" height={16} width={16} />
          </div>
          <ProfileSocialLink callback={callback} profile={contactMethod} handle={contactMethod} logo={'/icons/contact/team-contact-logo.svg'} height={14} width={14} type={type} preferred={true} />
        </div>
      )}

      <style jsx>
        {`
        .contact-method {
            border-radius: 4px;
            display: flex;
        }

        .contact-method__pin {
            width: 24px;
            justify-content: center;
            display: flex;
            align-items: center;
            height: 26px;
            background-color: #CFF2D2;
            border-radius: 4px 0  0px 4px;

        }
        .`}
      </style>
    </>
  );
};

export default ContactMethod;

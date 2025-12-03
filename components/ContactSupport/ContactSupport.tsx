'use client';

import { useEffect, useState } from 'react';

import { useContactSupportContext } from '@/components/ContactSupport/context/ContactSupportContext';

import { ModalBase } from '@/components/common/ModalBase';
import { QuestionCircleIcon } from '@/components/icons';
import { LabeledInput } from '@/components/common/LabeledInput';
import { IUserInfo } from '@/types/shared.types';

interface Props {
  userInfo?: IUserInfo;
}

export function ContactSupport(props: Props) {
  const { userInfo } = props;
  const { open, metadata, closeModal } = useContactSupportContext();

  const [email, setEmail] = useState(userInfo?.email);
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    setEmail(userInfo?.email);
  }, [userInfo?.email]);

  return (
    <ModalBase
      title="Contact Support"
      titleIcon={<QuestionCircleIcon />}
      description="No member with this email exists in the Protocol Labs Network. Double-check your email or try a different one. If you believe this is an error, our support team
can help."
      open={open}
      cancel={{
        onClick: closeModal,
      }}
      submit={{
        label: 'Submit',
        onClick: () => {},
      }}
    >
      <LabeledInput
        label="Email Address"
        input={{
          type: 'email',
          placeholder: 'Enter your email',
          value: email,
          onChange: (e) => setEmail(e.target.value),
        }}
      />

      <LabeledInput
        label="Name"
        input={{
          placeholder: 'Enter your name',
          value: name,
          onChange: (e) => setName(e.target.value),
        }}
      />

      <LabeledInput
        label="Describe the issue"
        input={{
          as: 'textarea',
          placeholder: 'I’m having an issue with...',
          value: details,
          onChange: (e) => setDetails(e.target.value),
        }}
      />
    </ModalBase>
  );
}

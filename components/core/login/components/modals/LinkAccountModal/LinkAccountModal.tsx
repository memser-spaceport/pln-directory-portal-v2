'use client';

import { useState } from 'react';

import { toast } from '@/components/core/ToastContainer';
import { reportLinkIssue } from '@/services/auth.service';
import { useAuthAnalytics } from '@/analytics/auth.analytics';

import { ModalBase } from '@/components/common/ModalBase';

import { WarningCircleIcon } from '@/components/icons';
import { LabeledInput } from '@/components/common/form/LabeledInput';

interface Props {
  open: boolean;
  toggleOpen: () => void;
}

export function LinkAccountModal(props: Props) {
  const { open, toggleOpen } = props;

  const { onLinkAccountSubmitClicked, onLinkAccountCancelClicked } = useAuthAnalytics();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const submit = async () => {
    onLinkAccountSubmitClicked();

    try {
      await reportLinkIssue({
        email,
        name,
      });

      toggleOpen();

      toast.success("Thanks! We've received your information and will be in touch soon.");
    } catch (error) {
      toast.error('An error occurred while submitting the form. Please try again later.');
    }
  };

  const cancel = () => {
    onLinkAccountCancelClicked();
    toggleOpen();
  };

  return (
    <ModalBase
      open={open}
      title="Help Us Link Your Account"
      titleIcon={<WarningCircleIcon />}
      description="We couldn`t automatically link this email to your Protocol Labs account. Please confirm your details below and our team will follow up within 24 hours."
      cancel={{
        onClick: cancel,
      }}
      submit={{
        label: 'Submit',
        onClick: submit,
        disabled: !email || !name,
      }}
    >
      <LabeledInput
        label="Email Address"
        input={{
          type: 'email',
          placeholder: 'Enter email',
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
    </ModalBase>
  );
}

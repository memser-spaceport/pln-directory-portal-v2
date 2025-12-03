'use client';

import { useContactSupportContext } from '@/components/ContactSupport/context/ContactSupportContext';

import { ModalBase } from '@/components/common/ModalBase';
import { QuestionCircleIcon } from '@/components/icons';

export function ContactSupport() {
  const { open, closeModal } = useContactSupportContext();

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
    />
  );
}

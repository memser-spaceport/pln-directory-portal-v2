import { useState } from 'react';

import { toast } from '@/components/core/ToastContainer';
import { reportLinkIssue } from '@/services/auth.service';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { WarningCircleIcon } from '@/components/icons';

import { LinkAccountInput } from './components/LinkAccountInput';

import s from './LinkAccountModal.module.scss';

interface Props {
  open: boolean;
  toggleOpen: () => void;
}

export function LinkAccountModal(props: Props) {
  const { open, toggleOpen } = props;

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const submit = async () => {
    try {
      await reportLinkIssue({
        email,
        name,
      });

      toggleOpen();
    } catch (error) {
      toast.error('An error occurred while submitting the form. Please try again later.');
    }
  };

  return (
    <Modal isOpen={open} onClose={toggleOpen}>
      <div className={s.root}>
        <div className={s.body}>
          <div className={s.iconContainer}>
            <WarningCircleIcon className={s.icon} />
          </div>

          <div className={s.description}>
            <div className={s.title}>Help Us Link Your Account</div>
            <div>
              We couldn`t automatically link this email to your Protocol Labs account. Please confirm your details below
              and our team will follow up within 24 hours.
            </div>
          </div>

          <LinkAccountInput
            label="Email Address"
            input={{
              type: 'email',
              placeholder: 'Enter email',
              value: email,
              onChange: (e) => setEmail(e.target.value),
            }}
          />

          <LinkAccountInput
            label="Name"
            input={{
              placeholder: 'Enter your name',
              value: name,
              onChange: (e) => setName(e.target.value),
            }}
          />
        </div>

        <div className={s.footer}>
          <Button className={s.btn} style="border" onClick={toggleOpen}>
            Cancel
          </Button>
          <Button className={s.btn} onClick={submit} disabled={!email || !name}>
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  );
}

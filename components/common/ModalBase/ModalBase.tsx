import { cloneElement, isValidElement, PropsWithChildren, ReactNode } from 'react';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

import s from './ModalBase.module.scss';

interface ModalBaseProps {
  title: ReactNode;
  titleIcon: ReactNode;
  description: ReactNode;
  footer?: ReactNode;
  open: boolean;
  cancel: {
    onClick: () => void;
  };
  submit: {
    label: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
}

export function ModalBase(props: PropsWithChildren<ModalBaseProps>) {
  const { open, title, titleIcon, description, cancel, submit, footer, children } = props;

  return (
    <Modal isOpen={open} onClose={cancel.onClick}>
      <div className={s.root}>
        <div className={s.body}>
          <div className={s.iconContainer}>
            {isValidElement(titleIcon) &&
              cloneElement(titleIcon, {
                // @ts-ignore
                className: s.icon,
              })}
          </div>

          <div className={s.description}>
            <div className={s.title}>{title}</div>
            <div>{description}</div>
          </div>

          {children}
        </div>

        <div className={s.footer}>
          <div className={s.footerBtns}>
            <Button className={s.btn} style="border" onClick={cancel.onClick}>
              Cancel
            </Button>
            <Button className={s.btn} onClick={submit.onClick} disabled={submit.disabled}>
              {submit.label}
            </Button>
          </div>
          {footer}
        </div>
      </div>
    </Modal>
  );
}

import clsx from 'clsx';
import { cloneElement, isValidElement, PropsWithChildren, ReactNode } from 'react';

import { CloseIcon } from '@/components/icons';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

import s from './ModalBase.module.scss';

interface ModalBaseProps {
  title: ReactNode;
  titleIcon: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  open: boolean;
  onClose?: () => void;
  cancel?: {
    onClick: () => void;
  };
  submit: {
    label: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
  };
  className?: string;
}

export function ModalBase(props: PropsWithChildren<ModalBaseProps>) {
  const { open, title, titleIcon, description, cancel, submit, footer, children, className, onClose } = props;

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className={clsx(s.root, className)}>
        {onClose && (
          <button className={s.close} onClick={onClose} type="button">
            <CloseIcon width={16} height={16} color="#455468" />
          </button>
        )}

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
            {description && <div>{description}</div>}
          </div>

          {children}
        </div>

        <div className={s.footer}>
          <div className={s.footerBtns}>
            {cancel && (
              <Button className={s.btn} style="border" onClick={cancel.onClick}>
                Cancel
              </Button>
            )}
            <Button onClick={submit.onClick} disabled={submit.disabled} className={clsx(s.btn, submit.className)}>
              {submit.label}
            </Button>
          </div>
          {footer}
        </div>
      </div>
    </Modal>
  );
}

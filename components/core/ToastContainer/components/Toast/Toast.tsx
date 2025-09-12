import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import { ToastContentProps } from 'react-toastify';

import { CloseIcon } from '@/components/icons';

import { getToastIcon } from './utils/getToastIcon';

import s from './Toast.module.scss';

export type Data = {
  withBg?: boolean;
};

export function Toast(props: PropsWithChildren<ToastContentProps<Data>>) {
  const { data, children, closeToast, toastProps } = props;
  const { withBg = false } = data || {};
  const { type } = toastProps;

  const Icon = getToastIcon(type);

  return (
    <div
      className={clsx(s.root, {
        [s.border]: !withBg,
        [s.default]: type === 'default',
        [s.error]: type === 'error',
        [s.info]: type === 'info',
        [s.success]: type === 'success',
        [s.warning]: type === 'warning',
      })}
    >
      <div className={s.body}>
        <Icon className={clsx(s.icon, s.statusIcon)} />
        <div className={s.content}>{children}</div>
      </div>
      <CloseIcon onClick={closeToast} className={clsx(s.icon, s.closeIcon)} />
    </div>
  );
}

import { clsx } from 'clsx';
import { PropsWithChildren } from 'react';

import { Button } from '@/components/common/Button';

import s from './HeaderActionBtn.module.scss';

interface Props {
  className?: string;
  onClick: () => void;
  disabled?: boolean;
}

export function HeaderActionBtn(props: PropsWithChildren<Props>) {
  const { className, onClick, children, disabled } = props;

  return (
    <Button variant="primary" style="link" onClick={onClick} className={clsx(s.root, className)} disabled={disabled}>
      {children}
    </Button>
  );
}

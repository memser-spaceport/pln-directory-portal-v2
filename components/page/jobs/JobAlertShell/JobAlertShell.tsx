import type { ReactNode } from 'react';

import { IconInfo, IconClose } from './components/Icons';

import s from './JobAlertShell.module.scss';

interface Props {
  children: ReactNode;
  onDismiss?: () => void;
}

export function JobAlertShell(props: Props) {
  const { children, onDismiss } = props;

  return (
    <div className={s.shell}>
      <IconInfo />
      <div className={s.inner}>{children}</div>
      {onDismiss && (
        <button type="button" className={s.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
          <IconClose />
        </button>
      )}
    </div>
  );
}

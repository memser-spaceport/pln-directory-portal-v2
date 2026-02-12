import { clsx } from 'clsx';
import { PropsWithChildren } from 'react';

import s from './MemberDetailsSection.module.scss';

interface Props {
  id?: string;
  editView?: boolean;
  missingData?: boolean;
  missingDataAlert?: boolean;
  classes?: {
    root?: string;
    editView?: string;
    missingDataAlert?: string;
  };
}

export function MemberDetailsSection(props: PropsWithChildren<Props>) {
  const { children, id, editView, missingData, missingDataAlert, classes } = props;

  return (
    <div
      id={id}
      className={clsx(s.root, classes?.root, {
        [s.editView]: editView,
        [s.missingData]: missingData,
        [s.missingDataAlert]: missingDataAlert,
        [classes?.editView || '']: editView && classes?.editView,
        [classes?.missingDataAlert || '']: missingDataAlert && classes?.missingDataAlert,
      })}
    >
      {children}
    </div>
  );
}

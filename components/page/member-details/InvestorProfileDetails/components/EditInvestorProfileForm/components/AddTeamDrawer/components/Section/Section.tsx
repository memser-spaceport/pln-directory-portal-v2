import React, { PropsWithChildren, ReactNode, useState } from 'react';
import { clsx } from 'clsx';

import s from './Section.module.scss';

interface Props {
  header: ReactNode;
  delimiter?: boolean;
  defaultExpanded?: boolean;
}

export function Section(props: PropsWithChildren<Props>) {
  const { header, children, delimiter = false, defaultExpanded = true } = props;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={s.root}>
      <button
        type="button"
        className={s.headerButton}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={s.headerContent}>
          <PlusIcon className={s.plusIcon} />
          <div className={s.headerText}>{header}</div>
          <ChevronIcon className={clsx(s.chevronIcon, isExpanded && s.chevronExpanded)} />
        </div>
      </button>
      {isExpanded && <div className={s.content}>{children}</div>}
      {delimiter && <div className={s.delimiter} />}
    </div>
  );
}

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 4.375V15.625M4.375 10H15.625"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="18.182"
    height="18.182"
    viewBox="0 0 18.182 18.182"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.0909 11.3636L9.09091 7.36364L5.09091 11.3636"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

'use client';

import React, { PropsWithChildren } from 'react';

interface Props {
  targetId: string;
  focusSelector?: string;
}

export function FaqScrollLink(props: PropsWithChildren<Props>) {
  const { targetId, focusSelector, children } = props;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });

      if (focusSelector) {
        setTimeout(() => {
          const focusElement = document.querySelector(focusSelector) as HTMLElement;
          if (focusElement) {
            focusElement.focus();
          }
        }, 500);
      }
    }
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick}>
      {children}
    </a>
  );
}

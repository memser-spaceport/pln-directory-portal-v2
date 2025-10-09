import React, { PropsWithChildren } from 'react';

interface Props {
  href: string;
}

export function FaqLink(props: PropsWithChildren<Props>) {
  const { href, children } = props;

  return (
    <a href={href} target="_blank">
      {children}
    </a>
  );
}

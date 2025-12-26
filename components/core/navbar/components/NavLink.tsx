import React from 'react';
import NextLink from 'next/link';
import { NavigationMenu } from '@base-ui-components/react';

interface Props extends Omit<NavigationMenu.Link.Props, 'className'> {
  className?: string;
}

export function NavLink(props: Props) {
  const { href = '', className, onClick, children, ...rest } = props;

  return (
    <NavigationMenu.Link
      render={() => (
        <NextLink href={href} className={className} onClick={onClick}>
          {children}
        </NextLink>
      )}
      {...rest}
    />
  );
}

import React from 'react';
import NextLink from 'next/link';
import { NavigationMenu } from '@base-ui-components/react';

export function NavLink(props: NavigationMenu.Link.Props) {
  const { href, className, onClick, children, ...rest } = props;

  return (
    <NavigationMenu.Link
      render={() => (
        <NextLink href={href ?? ''} className={(className as string) ?? ''} onClick={onClick}>
          {children}
        </NextLink>
      )}
      {...rest}
    />
  );
}

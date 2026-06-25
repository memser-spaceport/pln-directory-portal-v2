import React from 'react';
import { NavItemWithMenu } from '@/components/core/navbar/components/NavItemWithMenu';

import { useMoreNavItems } from './hooks/useMoreNavItems';

import { MoreIcon } from './components/Icons';

interface Props {
  onNavItemClickHandler: (url: string, name: string) => void;
}

export function MoreNavItems(props: Props) {
  const { onNavItemClickHandler } = props;

  const items = useMoreNavItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <NavItemWithMenu icon={<MoreIcon />} label="More" items={items} onNavItemClickHandler={onNavItemClickHandler} />
  );
}

import React from 'react';

import { StarFourIcon } from '@/components/core/navbar/components/icons';
import { NavItemWithMenu } from '@/components/core/navbar/components/NavItemWithMenu';

import { useGetPlInfraNavItems } from '@/components/core/navbar/components/navItems/PLInfraNavItems/hook/useGetPlInfraNavItems';

interface Props {
  onNavItemClickHandler: (url: string, name: string) => void;
}

export function PLInfraNavItems(props: Props) {
  const { onNavItemClickHandler } = props;

  const items = useGetPlInfraNavItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <NavItemWithMenu
      items={items}
      label="PL Infra"
      icon={<StarFourIcon />}
      onNavItemClickHandler={onNavItemClickHandler}
    />
  );
}

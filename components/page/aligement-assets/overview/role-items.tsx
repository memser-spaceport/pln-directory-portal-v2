import { Code, Flask, RocketLaunch, Strategy } from '@phosphor-icons/react';

export const ROLE_ITEMS = [
  { role: 'Founders', description: 'driving new ventures', icon: <RocketLaunch size={19} weight="regular" /> },
  { role: 'Researchers', description: 'accelerating frontier fields', icon: <Flask size={19} weight="regular" /> },
  {
    role: 'Builders',
    description: 'shipping tools, products, and experiments',
    icon: <Code size={19} weight="regular" />,
  },
  { role: 'Operators', description: 'coordinating teams and projects', icon: <Strategy size={19} weight="regular" /> },
];

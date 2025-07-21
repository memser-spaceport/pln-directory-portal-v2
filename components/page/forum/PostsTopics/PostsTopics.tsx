import React from 'react';
import { Tabs } from '@base-ui-components/react/tabs';

import s from './PostsTopics.module.scss';
import { useForumTopics } from '@/services/forum/hooks/useForumTopics';

const tabs = [
  {
    label: 'All',
    value: 'all',
  },
  {
    label: 'General',
    value: 'general',
  },
  {
    label: 'Launch',
    value: 'launch',
  },
  {
    label: 'Recruiting',
    value: 'recruiting',
  },
];

interface Props {
  value: string;
  onValueChange: (value: string, event?: Event) => void;
}

export const PostsTopics = ({ value, onValueChange }: Props) => {
  const { data } = useForumTopics();

  console.log(data);

  return (
    <div className={s.root}>
      <Tabs.Root className={s.Tabs} defaultValue="overview" value={value} onValueChange={onValueChange}>
        <Tabs.List className={s.List}>
          {tabs.map((item) => (
            <Tabs.Tab className={s.Tab} value={item.value} key={item.value}>
              {item.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className={s.Indicator} />
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
};

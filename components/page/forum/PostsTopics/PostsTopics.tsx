import React, { useMemo } from 'react';
import { Tabs } from '@base-ui-components/react/tabs';

import s from './PostsTopics.module.scss';
import { useForumTopics } from '@/services/forum/hooks/useForumTopics';

interface Props {
  value: string | undefined;
  onValueChange: (value: string, event?: Event) => void;
}

export const PostsTopics = ({ value, onValueChange }: Props) => {
  const { data } = useForumTopics();
  const tabs = useMemo(() => {
    return (
      data?.map((item) => ({
        label: item.name,
        value: item.cid.toString(),
      })) ?? []
    );
  }, [data]);

  return (
    <div className={s.root}>
      <Tabs.Root className={s.Tabs} value={value || '0'} onValueChange={onValueChange}>
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

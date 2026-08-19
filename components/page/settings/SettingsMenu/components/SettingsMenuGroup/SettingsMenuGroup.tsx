import { ReactNode } from 'react';

import { type onItemClick, type ISettingsMenuItem, SettingsMenuItem } from './components/SettingsMenuItem';

import s from './SettingsMenuGroup.module.scss';

interface Props {
  title: ReactNode;
  items: ISettingsMenuItem[];
  onItemClicked: onItemClick;
}

export function SettingsMenuGroup(props: Props) {
  const { title, items, onItemClicked } = props;

  return (
    <div className={s.root}>
      <h3 className={s.title}>{title}</h3>
      <div className={s.list}>
        {items.map((item) => (
          <SettingsMenuItem key={`settings-${item.name}`} item={item} onClick={onItemClicked} />
        ))}
      </div>
    </div>
  );
}

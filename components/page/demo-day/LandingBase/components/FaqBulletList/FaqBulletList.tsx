import map from 'lodash/map';
import { ReactNode } from 'react';

import s from './FaqBulletList.module.scss';

interface Props {
  items: ReactNode[];
}

export function FaqBulletList(props: Props) {
  const { items } = props;

  return (
    <ul className={s.root}>
      {map(items, (item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

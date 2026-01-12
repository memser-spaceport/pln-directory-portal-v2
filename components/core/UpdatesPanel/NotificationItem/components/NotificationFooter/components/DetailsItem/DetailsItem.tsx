import React from 'react';
import isEmpty from 'lodash/isNil';

import s from './DetailsItem.module.scss';

interface Props {
  data: string | null;
}

export function DetailsItem(props: Props) {
  const { data } = props;

  if (isEmpty(data)) {
    return null;
  }

  return (
    <>
      <div className={s.data}>{data}</div>
      <div className={s.delimiter}>·</div>
    </>
  );
}

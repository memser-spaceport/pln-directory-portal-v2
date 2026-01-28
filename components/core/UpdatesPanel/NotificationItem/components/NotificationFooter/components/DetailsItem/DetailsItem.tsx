import React from 'react';

import s from './DetailsItem.module.scss';

import { Detail } from '../../types';

interface Props {
  data: Detail;
  showIcon?: boolean;
  showLabel?: boolean;
}

export function DetailsItem(props: Props) {
  const { data, showIcon = false, showLabel = true } = props;

  const { icon, value, label } = data;

  return (
    <>
      <div className={s.data}>
        {showIcon && icon} {value + ''} {showLabel && label}
      </div>
      <div className={s.delimiter}>·</div>
    </>
  );
}

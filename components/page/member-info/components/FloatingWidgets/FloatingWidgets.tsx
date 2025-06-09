import React, { PropsWithChildren } from 'react';

import s from './FloatingWidgets.module.scss';

export const FloatingWidgets = ({ children }: PropsWithChildren) => {
  return <div className={s.root}>{children}</div>;
};

import React, { PropsWithChildren } from 'react';

import s from './HighlightsBar.module.scss';

export const HighlightsBar = ({ children }: PropsWithChildren) => {
  return <div className={s.root}>{children}</div>;
};

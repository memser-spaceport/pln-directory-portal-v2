import { ComponentType, PropsWithChildren, ReactNode, SVGProps } from 'react';

import s from './SingleTip.module.scss';

interface Props {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: ReactNode;
}

export function SingleTip(props: PropsWithChildren<Props>) {
  const { Icon, title, children } = props;

  return (
    <div className={s.root}>
      <Icon color="#1B4DFF" />
      <div className={s.content}>
        <div className={s.title}>{title}</div>
        {children}
      </div>
    </div>
  );
}

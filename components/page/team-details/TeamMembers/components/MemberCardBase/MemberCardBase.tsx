import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { OhBadge } from '@/components/core/OhBadge/OhBadge';

import s from './MemberCardBase.module.scss';

interface Props {
  name: string;
  role?: string;
  image?: string | null;
  isAvailableToConnect?: boolean;
  className?: string;
}

export function MemberCardBase(props: PropsWithChildren<Props>) {
  const { name, role, image, className, isAvailableToConnect, children } = props;

  const defaultAvatar = useDefaultAvatar(name);
  const logo = image || defaultAvatar;

  return (
    <div className={clsx(s.root, className)}>
      <div className={s.left}>
        <img
          loading="lazy"
          className={s.avatar}
          alt={name}
          src={logo}
          width={40}
          height={40}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultAvatar;
          }}
        />
        <div className={s.text}>
          <div className={s.nameRole}>
            <p className={s.name}>{name}</p>
            {role && <p className={s.role}>{role}</p>}
          </div>
          {isAvailableToConnect && <OhBadge variant="secondary" />}
        </div>
      </div>

      {children && <div className={s.right}>{children}</div>}
    </div>
  );
}

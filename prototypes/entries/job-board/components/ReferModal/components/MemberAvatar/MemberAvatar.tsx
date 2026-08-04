import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './MemberAvatar.module.scss';

interface MemberAvatarProps {
  name: string;
  size: number;
  image?: string | null;
}

export function MemberAvatar({ name, size, image }: MemberAvatarProps) {
  return (
    <img
      src={image || getDefaultAvatar(name)}
      alt=""
      width={size}
      height={size}
      className={s.avatar}
      aria-hidden="true"
    />
  );
}

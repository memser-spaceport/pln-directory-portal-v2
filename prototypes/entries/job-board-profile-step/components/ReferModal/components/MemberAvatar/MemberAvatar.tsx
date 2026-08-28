import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './MemberAvatar.module.scss';

interface MemberAvatarProps {
  name: string;
  size: number;
  image?: string | null;
  /** Extra classes for the image itself — a caller stacking these into a
   *  facepile needs the ring and the overlap on the `<img>`, not on a wrapper
   *  that would sit between it and its neighbour. */
  className?: string;
}

export function MemberAvatar({ name, size, image, className }: MemberAvatarProps) {
  return (
    <img
      src={image || getDefaultAvatar(name)}
      alt=""
      width={size}
      height={size}
      className={className ? `${s.avatar} ${className}` : s.avatar}
      aria-hidden="true"
    />
  );
}

import { Avatar } from '@base-ui-components/react/avatar';
import Link from 'next/link';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './ForumAvatar.module.scss';

interface Props {
  src?: string | null;
  name: string;
  memberUid?: string;
  size?: 'sm' | 'md' | 'lg';
  linkToProfile?: boolean;
}

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 48,
};

export function ForumAvatar(props: Props) {
  const { src, name, memberUid, size = 'md', linkToProfile = false } = props;

  const pixelSize = sizeMap[size];
  const avatarSrc = src || getDefaultAvatar(name);

  const avatar = (
    <Avatar.Root className={s.root} data-size={size}>
      <Avatar.Image src={avatarSrc} width={pixelSize} height={pixelSize} className={s.image} alt={name} />
      <Avatar.Fallback className={s.fallback}>{name?.substring(0, 1)}</Avatar.Fallback>
    </Avatar.Root>
  );

  if (linkToProfile && memberUid) {
    return (
      <Link href={`/members/${memberUid}`} onClick={(e) => e.stopPropagation()}>
        {avatar}
      </Link>
    );
  }

  return avatar;
}

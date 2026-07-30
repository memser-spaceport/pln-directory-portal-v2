import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './MemberAvatar.module.scss';

export function MemberAvatar({ name, size }: { name: string; size: number }) {
  return <img src={getDefaultAvatar(name)} alt="" width={size} height={size} className={s.avatar} aria-hidden="true" />;
}

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './ForumAvatar.module.scss';

interface Props {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 48,
};

export function ForumAvatar(props: Props) {
  const { src, name, size = 'md' } = props;
  const [hasError, setHasError] = useState(false);

  const pixelSize = sizeMap[size];
  const avatarSrc = src || getDefaultAvatar(name);

  return (
    <div className={s.root} data-size={size}>
      {!hasError ? (
        <Image
          src={avatarSrc}
          width={pixelSize}
          height={pixelSize}
          className={s.image}
          alt={name}
          onError={() => setHasError(true)}
          unoptimized
        />
      ) : (
        <div className={s.fallback}>{name?.substring(0, 1)}</div>
      )}
    </div>
  );
}

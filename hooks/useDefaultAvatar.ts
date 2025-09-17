import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { shapes } from '@dicebear/collection';

export function getDefaultAvatar(seed: string | undefined) {
  if (!seed) {
    return '/icons/default-user-profile.svg';
  }

  const avatar = createAvatar(shapes, {
    seed,
  });

  return avatar.toDataUri();
}

export function useDefaultAvatar(seed: string | undefined) {
  return useMemo(() => {
    return getDefaultAvatar(seed);
  }, [seed]);
}

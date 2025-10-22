import { MutableRefObject, Ref, RefCallback } from 'react';

export function mergeRefs<T = any>(refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (value: T) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(value);
      } else {
        (ref as MutableRefObject<T | null>).current = value;
      }
    });
  };
}

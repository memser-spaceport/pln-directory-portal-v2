type Type = 'progress' | 'watched' | 'length';

export function getVideoDataStorageKey(src: string, type: Type): string {
  return `video-${type}-${src}`;
}

/** Deterministic palette color per name, so avatars aren't all the same flat color. */
const PALETTE = ['#1B4DFF', '#F97316', '#0D9488', '#DB2777', '#7C3AED', '#059669', '#DC2626', '#0891B2'];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

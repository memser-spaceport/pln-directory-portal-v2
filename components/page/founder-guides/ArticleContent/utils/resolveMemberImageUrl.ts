export function resolveMemberImageUrl(image: string | { url: string } | null | undefined): string | null {
  if (image == null) return null;
  if (typeof image === 'string') return image;
  return image.url ?? null;
}

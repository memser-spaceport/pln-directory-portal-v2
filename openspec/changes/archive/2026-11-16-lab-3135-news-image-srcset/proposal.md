# Proposal

## Why

LAB-3135 (https://linear.app/protocollabs/issue/LAB-3135): news images load the full-size og:image from third-party hosts. The files are heavy on phones. Backend PR memser-spaceport/pln-directory-portal#3712 now stores resized 16:9 JPEG copies and returns them as `image: { width, height, variants: [{ width, url }] } | null` next to `imageUrl`.

## What Changes

- `ITeamNewsItem` gets the optional, nullable `image` field.
- `getNewsImageSources` turns `image.variants` into a `srcset` string and uses the largest copy as `src`. When `image` is null, it returns the plain `imageUrl`.
- `NewsImage` takes an optional `srcSet` and sets `sizes` for its place: `thumb` `(min-width: 640px) 168px, 100vw`, `wide` `(min-width: 640px) 592px, 100vw`, `hero` `(min-width: 640px) 632px, 100vw`.
- The stream card (`NewsCardFull`), the News page card (`NewsCard`) and the story dialog (`NewsDetailBody`) use it.
- The load states and the gradient fallback do not change.

## Impact

- Code: `types/team-news.types.ts`, `components/page/home/TeamNews/components/NewsImage/`, `NewsCard.tsx`, `NewsCardFull.tsx`, `NewsDetailBody.tsx`.
- The frontend has no digest page news image today, so no digest change.

import { IMAGE_FLOATS } from '@/utils/richText/imageFloats';

import { decodeImageLayoutFromSrc } from './decodeImageLayoutFromSrc';

const PERCENT_WIDTH = /^(\d{1,3})%$/;

/**
 * A forum body is stored in NodeBB as markdown — `replaceImagesWithMarkdown`
 * rewrites every `<img>` as `![alt](src)` on the way out — and markdown image
 * syntax has nowhere to carry an attribute, so an author's chosen size and
 * text wrap would be dropped at that boundary.
 *
 * They therefore ride in the URL fragment. A fragment is stripped by the
 * browser before the image is requested, so an encoded src stays a working src
 * for every reader that doesn't decode it (NodeBB's own UI included), and old
 * content without one decodes to "no layout set".
 *
 * The two values are separated by a comma and NOT by `&`: an `&` inside a src
 * attribute comes back out of `innerHTML` as `&amp;`, which stopped the
 * fragment being recognised on the way back in — so the layout was lost on
 * save and a fresh fragment was appended on top of the old one every time.
 */
export function encodeImageLayoutInSrc(src: string, layout: { width?: string | null; float?: string | null }): string {
  // Whatever this src already carries of ours comes off first, including a
  // chain left by that older separator.
  const bare = decodeImageLayoutFromSrc(src).src;

  const params: string[] = [];
  const percent = layout.width?.match(PERCENT_WIDTH)?.[1];
  if (percent) {
    params.push(`w=${percent}`);
  }
  if (IMAGE_FLOATS.some((float) => float === layout.float)) {
    params.push(`f=${layout.float}`);
  }

  return params.length > 0 ? `${bare}#${params.join(',')}` : bare;
}

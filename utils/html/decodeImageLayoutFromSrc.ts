import { ImageFloat } from '@/utils/richText/imageFloats';

const PARAM = '(?:w=\\d{1,3}|f=(?:left|right))';
// `,` is what `encodeImageLayoutInSrc` writes. `&` and `&amp;` are what earlier
// versions wrote: `&` in a src attribute comes back from `innerHTML` as
// `&amp;`, which is exactly why the separator is a comma now.
const SEPARATOR = '(?:&amp;|[&,])';
const FRAGMENT = new RegExp(`#(${PARAM}(?:${SEPARATOR}${PARAM})*)$`);

/**
 * Reads back the size and text wrap `encodeImageLayoutInSrc` put in a markdown
 * image's URL fragment, and hands back the src to actually render — the
 * fragment is ours, not part of the image's address. A fragment we didn't
 * write is left on the src untouched.
 *
 * Content saved by the version that separated the two values with `&` can
 * carry a whole CHAIN of these, because that separator returned escaped and
 * stopped matching, so each save appended another one instead of replacing it.
 * The last in the chain is the layout that was saved last; the rest are
 * history, and all of them come off the src — which heals the content the next
 * time it is saved.
 */
export function decodeImageLayoutFromSrc(src: string): { src: string; width?: string; float?: ImageFloat } {
  let bare = src;
  let newest: string | null = null;

  for (;;) {
    const match = bare.match(FRAGMENT);
    if (!match) {
      break;
    }
    if (newest == null) {
      newest = match[1];
    }
    bare = bare.slice(0, bare.length - match[0].length);
  }

  if (newest == null) {
    return { src };
  }

  let width: string | undefined;
  let float: ImageFloat | undefined;
  for (const param of newest.split(/&amp;|[&,]/)) {
    const [key, value] = param.split('=');
    if (key === 'w') {
      width = `${value}%`;
    }
    if (key === 'f' && (value === 'left' || value === 'right')) {
      float = value;
    }
  }

  return { src: bare, ...(width && { width }), ...(float && { float }) };
}

import { ImageFloat } from './imageFloats';

/**
 * The class a wrapped image carries. It lives on the `<img>` (rather than in a
 * style attribute) because every sanitizer in the app already lets `class`
 * through, and because the forum's markdown round-trip can rebuild a class
 * from the layout it stores in the image URL.
 */
export function imageFloatClass(float: ImageFloat): string {
  return `ql-img-float-${float}`;
}

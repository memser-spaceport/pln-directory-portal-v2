import { hasAnyAnnotation, parseAnnotations, type AnnotationState } from '../../components/screenshot-feedback/types';

export type FeedbackImage = {
  src: string;
  alt: string;
  annotations: AnnotationState | null;
  hasVisibleAnnotations: boolean;
};

export type FeedbackMedia = {
  /** The body with every `<img>` taken out of it. May be empty — image-only feedback is allowed. */
  textHtml: string;
  images: FeedbackImage[];
};

const IMG_TAG = /<img\b[^>]*>/gi;
/** A paragraph left holding nothing once its image was lifted out. */
const EMPTY_BLOCK = /<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi;

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}=("([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[2] ?? match[3] ?? '') : null;
}

/**
 * Undoes DOMPurify's attribute escaping.
 *
 * The value reaches us from DOMPurify's re-serializer rather than the browser's
 * attribute decoder, so any `&` in it arrives as `&amp;` and the payload stops
 * parsing — silently, costing the screenshot its badge, its outline and its
 * replay in the lightbox.
 *
 * Nothing `serializeAnnotations` writes today can trigger that: encodeURIComponent
 * turns `&` into `%26` first. It matters for the other payload shape the parser
 * accepts — raw JSON, which decodeURIComponent passes through untouched — and it
 * is what keeps that shape working if the writer ever stops URL-encoding.
 */
function decodeAttr(value: string | null): string | null {
  return value === null ? null : value.replace(/&amp;/g, '&');
}

/**
 * Splits already-sanitized feedback HTML into its text and its images.
 *
 * Regex rather than `DOMParser`: this runs inside a client component that the
 * App Router still prerenders in Node, where `DOMParser` does not exist. The
 * markup being matched is our own (`annotatedScreenshotHtml`) or Quill's, not
 * arbitrary input, and it has already been through DOMPurify.
 */
export function splitFeedbackMedia(sanitizedHtml: string): FeedbackMedia {
  const images: FeedbackImage[] = [];

  const withoutImages = sanitizedHtml.replace(IMG_TAG, (tag) => {
    const src = attr(tag, 'src');
    if (!src) return '';
    const annotations = parseAnnotations(decodeAttr(attr(tag, 'data-annotations')));
    images.push({
      src,
      alt: attr(tag, 'alt') ?? '',
      annotations,
      hasVisibleAnnotations: hasAnyAnnotation(annotations),
    });
    return '';
  });

  return { textHtml: withoutImages.replace(EMPTY_BLOCK, ''), images };
}

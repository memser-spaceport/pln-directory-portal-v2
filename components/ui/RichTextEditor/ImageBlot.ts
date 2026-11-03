import { Quill } from 'react-quill-new';

import { IMAGE_FLOATS } from '@/utils/richText/imageFloats';
import { imageFloatClass } from '@/utils/richText/imageFloatClass';

/** Same attribute the feedback screenshot list writes. Kept here so the editor blot does not import the page module. */
export const IMAGE_ANNOTATIONS_ATTR = 'data-annotations';

const Image = Quill.import('formats/image') as any;

/**
 * Quill's own Image blot with one format added: `float`, the text wrap.
 *
 * The wrap has to be a class on the `<img>` rather than a registered inline
 * attributor, because Parchment applies an attributor to an embed by wrapping
 * it in a `<span>` and formatting that wrapper instead (see
 * `ShadowBlot.formatAt`) — a wrapper that every renderer downstream, the
 * forum's markdown conversion included, would then have to understand. A class
 * on the image travels as part of the image.
 *
 * `formats()` is what makes it survive a round-trip: Quill's clipboard reads an
 * embed's formats off the DOM when HTML is loaded into an editor, and writes
 * them back through `format()` when the document is rendered.
 */
export class ImageBlot extends Image {
  static formats(domNode: HTMLElement) {
    const parentFormats = Object.getPrototypeOf(ImageBlot).formats as
      | ((node: HTMLElement) => Record<string, unknown>)
      | undefined;
    const formats = typeof parentFormats === 'function' ? parentFormats(domNode) : {};
    const float = IMAGE_FLOATS.find((value) => domNode.classList.contains(imageFloatClass(value)));
    const annotations = domNode.getAttribute(IMAGE_ANNOTATIONS_ATTR);
    return {
      ...formats,
      ...(float ? { float } : {}),
      ...(annotations ? { annotations } : {}),
    };
  }

  format(name: string, value: unknown) {
    if (name === 'annotations') {
      if (typeof value === 'string' && value) {
        this.domNode.setAttribute(IMAGE_ANNOTATIONS_ATTR, value);
      } else {
        this.domNode.removeAttribute(IMAGE_ANNOTATIONS_ATTR);
      }
      return;
    }

    if (name !== 'float') {
      super.format(name, value);
      return;
    }

    IMAGE_FLOATS.forEach((float) => this.domNode.classList.remove(imageFloatClass(float)));

    const next = IMAGE_FLOATS.find((float) => float === value);
    if (next) {
      this.domNode.classList.add(imageFloatClass(next));
    }
  }
}

export function registerImageBlot(): void {
  Quill.register('formats/image', ImageBlot, true);
}

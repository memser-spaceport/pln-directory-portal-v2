import { Quill } from 'react-quill-new';

import { IMAGE_FLOATS } from '@/utils/richText/imageFloats';
import { imageFloatClass } from '@/utils/richText/imageFloatClass';

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
class ImageBlot extends Image {
  static formats(domNode: HTMLElement) {
    const formats = super.formats(domNode);
    const float = IMAGE_FLOATS.find((value) => domNode.classList.contains(imageFloatClass(value)));
    return float ? { ...formats, float } : formats;
  }

  format(name: string, value: unknown) {
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

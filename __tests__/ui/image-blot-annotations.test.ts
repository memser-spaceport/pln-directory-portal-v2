import { ImageBlot, IMAGE_ANNOTATIONS_ATTR } from '@/components/ui/RichTextEditor/ImageBlot';

describe('ImageBlot annotations', () => {
  function blotFor(node: HTMLElement) {
    return Object.assign(Object.create(ImageBlot.prototype), { domNode: node }) as {
      format: (name: string, value: unknown) => void;
      domNode: HTMLElement;
    };
  }

  it('stores drawing data on the image and reads it back', () => {
    const node = document.createElement('img');
    const blot = blotFor(node);

    blot.format('annotations', '%7B%22version%22%3A1%7D');

    expect(node.getAttribute(IMAGE_ANNOTATIONS_ATTR)).toBe('%7B%22version%22%3A1%7D');
    expect(ImageBlot.formats(node).annotations).toBe('%7B%22version%22%3A1%7D');
  });

  it('removes the drawing data when the format is cleared', () => {
    const node = document.createElement('img');
    node.setAttribute(IMAGE_ANNOTATIONS_ATTR, 'keep');
    const blot = blotFor(node);

    blot.format('annotations', false);

    expect(node.hasAttribute(IMAGE_ANNOTATIONS_ATTR)).toBe(false);
    expect(ImageBlot.formats(node).annotations).toBeUndefined();
  });
});

/**
 * Where a float lands cannot be calculated from the text in front of it, so
 * the step is measured: every word boundary is tried in an offscreen copy of
 * the block and the first one that puts the image on a different line wins.
 *
 * jsdom has no layout, so it gets a stand-in with the property that matters —
 * the image sits one line lower for every line's worth of text in front of it
 * — which is enough to pin the search itself: direction, word boundaries, and
 * the skipping of positions that would not move the image at all.
 */
import { imageLineStepOffset } from '@/components/ui/RichTextEditor/utils/imageLineStepOffset';

const LINE_CHARS = 20;
const LINE_HEIGHT = 20;
const TEXT = 'aaa bbb ccc ddd eee fff ggg hhh iii jjj';

const realRect = Element.prototype.getBoundingClientRect;

function textBefore(image: Element): number {
  const range = document.createRange();
  range.setStart(image.parentElement as Node, 0);
  range.setEndBefore(image);
  return range.toString().length;
}

beforeAll(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const top = this.tagName === 'IMG' ? Math.floor(textBefore(this) / LINE_CHARS) * LINE_HEIGHT : 0;
    return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  };
});

afterAll(() => {
  Element.prototype.getBoundingClientRect = realRect;
});

/** A paragraph with the image at `offset` characters into the text. */
function blockWithImageAt(offset: number) {
  const editorRoot = document.createElement('div');
  const block = document.createElement('p');
  block.append(document.createTextNode(TEXT.slice(0, offset)));
  const image = document.createElement('img');
  block.append(image, document.createTextNode(TEXT.slice(offset)));
  editorRoot.append(block);
  document.body.append(editorRoot);
  return { editorRoot, block, image };
}

describe('imageLineStepOffset', () => {
  it('finds the first word ahead that drops the image a line', () => {
    const { editorRoot, block, image } = blockWithImageAt(0);

    expect(imageLineStepOffset({ editorRoot, block, image, direction: 1 })).toBe(20);
  });

  it('skips the words in between, which would not move it at all', () => {
    // 4, 8, 12 and 16 all leave the image on its first line; only 20 doesn't.
    const { editorRoot, block, image } = blockWithImageAt(0);

    expect(imageLineStepOffset({ editorRoot, block, image, direction: 1 })).not.toBe(4);
  });

  it('finds the nearest word behind that lifts it a line', () => {
    const { editorRoot, block, image } = blockWithImageAt(24);

    // 20 still leaves it on the same line as 24 does; 16 is the one that lifts it.
    expect(imageLineStepOffset({ editorRoot, block, image, direction: -1 })).toBe(16);
  });

  it('reports no step when the image already sits on the first line', () => {
    const { editorRoot, block, image } = blockWithImageAt(0);

    expect(imageLineStepOffset({ editorRoot, block, image, direction: -1 })).toBeNull();
  });

  it('reports no step when no word ahead moves it, so the caller can fall back', () => {
    const { editorRoot, block, image } = blockWithImageAt(TEXT.length);

    expect(imageLineStepOffset({ editorRoot, block, image, direction: 1 })).toBeNull();
  });

  it('leaves nothing of its measuring behind in the document', () => {
    const { editorRoot, block, image } = blockWithImageAt(0);
    const before = document.body.childElementCount;

    imageLineStepOffset({ editorRoot, block, image, direction: 1 });

    expect(document.body.childElementCount).toBe(before);
  });
});

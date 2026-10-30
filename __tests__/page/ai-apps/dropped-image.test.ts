import {
  readDroppedImage,
  SHOT_DRAG_TYPE,
  emptyAnnotations,
  type ScreenshotAttachment,
} from '@/components/page/ai-apps/components/screenshot-feedback';

const SHOT_A = 'data:image/jpeg;base64,QUFB';
const SHOT_B = 'data:image/png;base64,QkJC';

const shots: ScreenshotAttachment[] = [
  { id: 'shot-1', imageDataUrl: SHOT_A, annotations: emptyAnnotations(), source: 'auto' },
  { id: 'shot-2', imageDataUrl: SHOT_B, annotations: emptyAnnotations(), source: 'part' },
];

function transfer(entries: Record<string, string> = {}, files: File[] = []) {
  return { files, getData: (type: string) => entries[type] ?? '' } as unknown as DataTransfer;
}

describe('readDroppedImage', () => {
  it('finds the screenshot a preview named when the drag started', () => {
    expect(readDroppedImage(transfer({ [SHOT_DRAG_TYPE]: 'shot-2' }), shots)).toEqual({
      kind: 'shot',
      shot: shots[1],
    });
  });

  it('matches a natively dragged picture to its screenshot by the data URL', () => {
    expect(readDroppedImage(transfer({ 'text/uri-list': SHOT_A }), shots)).toEqual({ kind: 'shot', shot: shots[0] });
    expect(readDroppedImage(transfer({ 'text/html': `<meta charset="utf-8"><img src="${SHOT_B}">` }), shots)).toEqual({
      kind: 'shot',
      shot: shots[1],
    });
  });

  it('takes an image file as a new picture', () => {
    const file = new File(['x'], 'shot.png', { type: 'image/png' });
    expect(readDroppedImage(transfer({}, [file]), shots)).toEqual({ kind: 'file', file });
  });

  it('takes a data-URL picture that is not in the list as a new picture', () => {
    const other = 'data:image/png;base64,T1RIRVI=';
    expect(readDroppedImage(transfer({ 'text/html': `<img src="${other}">` }), shots)).toEqual({
      kind: 'src',
      src: other,
    });
  });

  it('leaves text, links and files that are not pictures to the editor', () => {
    expect(readDroppedImage(transfer({ 'text/plain': 'hello' }), shots)).toBeNull();
    expect(readDroppedImage(transfer({ 'text/uri-list': 'https://example.com/a.png' }), shots)).toBeNull();
    expect(readDroppedImage(transfer({ 'text/html': '<p>hi</p>' }), shots)).toBeNull();
    expect(readDroppedImage(transfer({}, [new File(['x'], 'a.txt', { type: 'text/plain' })]), shots)).toBeNull();
    expect(readDroppedImage(null, shots)).toBeNull();
  });

  it('ignores a preview id that is no longer in the list', () => {
    expect(readDroppedImage(transfer({ [SHOT_DRAG_TYPE]: 'gone' }), shots)).toBeNull();
  });
});

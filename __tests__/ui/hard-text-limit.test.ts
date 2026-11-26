import { insertedTextRanges, trimToTextLimit } from '@/components/ui/RichTextEditor/utils/hardTextLimit';
import { editorTextLength } from '@/components/form/FormEditor/FormEditor';

jest.mock('next/dynamic', () => () => () => null);

/* The opt-in hard stop of the rich text editor (LAB-3442), against a fake editor that holds one paragraph of text. */

function fakeEditor(text: string) {
  const editor = {
    text,
    getSemanticHTML: () => `<p>${editor.text.replace(/ /g, '&nbsp;')}</p>`,
    deleteText: jest.fn((index: number, length: number) => {
      editor.text = editor.text.slice(0, index) + editor.text.slice(index + length);
    }),
  };
  return editor;
}

describe('editorTextLength', () => {
  it('counts the text with no tags and each &nbsp; as one space', () => {
    expect(editorTextLength('<p>a&nbsp;b</p><p><strong>cd</strong></p>')).toBe(5);
    expect(editorTextLength('')).toBe(0);
  });
});

describe('insertedTextRanges', () => {
  it('finds the inserted text after retains, deletes and embeds', () => {
    expect(
      insertedTextRanges({ ops: [{ retain: 3 }, { insert: 'ab' }, { delete: 2 }, { insert: {} }, { insert: 'cde' }] }),
    ).toEqual([
      { index: 3, length: 2 },
      { index: 6, length: 3 },
    ]);
    expect(insertedTextRanges({ ops: [{ retain: 4, attributes: { bold: true } }] } as never)).toEqual([]);
  });
});

describe('trimToTextLimit', () => {
  it('removes a typed character at the limit', () => {
    const editor = fakeEditor('abcdeX');
    const length = trimToTextLimit(editor, { ops: [{ retain: 5 }, { insert: 'X' }] }, 5, editorTextLength);

    expect(editor.text).toBe('abcde');
    expect(length).toBe(5);
  });

  it('cuts a paste to the room that is left', () => {
    const editor = fakeEditor('ab12345cd');
    const length = trimToTextLimit(editor, { ops: [{ retain: 2 }, { insert: '12345' }] }, 6, editorTextLength);

    expect(editor.text).toBe('ab12cd');
    expect(length).toBe(6);
  });

  it('counts spaces as the counter does', () => {
    const editor = fakeEditor('a b c');
    trimToTextLimit(editor, { ops: [{ insert: 'a b c' }] }, 3, editorTextLength);

    expect(editor.text).toBe('a b');
  });

  it('keeps the text that was there before the change', () => {
    const editor = fakeEditor('Xabcdef');
    trimToTextLimit(editor, { ops: [{ insert: 'X' }] }, 3, editorTextLength);

    expect(editor.text).toBe('abcdef');
  });

  it('does nothing under the limit', () => {
    const editor = fakeEditor('abc');
    expect(trimToTextLimit(editor, { ops: [{ insert: 'abc' }] }, 10, editorTextLength)).toBe(3);
    expect(editor.deleteText).not.toHaveBeenCalled();
  });
});

import { insertAnnotatedImage, moveImageEmbed } from '@/components/ui/RichTextEditor/utils/moveImageEmbed';

describe('insertAnnotatedImage', () => {
  it('inserts the image and writes its drawing data', () => {
    const formatText = jest.fn();
    const editor = { insertEmbed: jest.fn(), formatText };

    insertAnnotatedImage(editor, 3, 'https://cdn.test/a.png', 'ENC');

    expect(editor.insertEmbed).toHaveBeenCalledWith(3, 'image', 'https://cdn.test/a.png', 'user');
    expect(formatText).toHaveBeenCalledWith(3, 1, 'annotations', 'ENC', 'user');
  });

  it('inserts a plain image when there are no drawings', () => {
    const formatText = jest.fn();
    const editor = { insertEmbed: jest.fn(), formatText };

    insertAnnotatedImage(editor, 1, 'https://cdn.test/a.png', null);

    expect(editor.insertEmbed).toHaveBeenCalledWith(1, 'image', 'https://cdn.test/a.png', 'user');
    expect(formatText).not.toHaveBeenCalled();
  });
});

describe('moveImageEmbed', () => {
  it('carries drawing data onto the image at its new place', () => {
    const image = document.createElement('img');
    image.setAttribute('src', 'https://cdn.test/a.png');
    image.setAttribute('data-annotations', 'ENC');
    const formatText = jest.fn();
    const editor = {
      deleteText: jest.fn(),
      insertEmbed: jest.fn(),
      formatText,
      setSelection: jest.fn(),
    };

    moveImageEmbed(editor, image, 2, 5);

    expect(editor.insertEmbed).toHaveBeenCalledWith(4, 'image', 'https://cdn.test/a.png', 'user');
    expect(formatText).toHaveBeenCalledWith(4, 1, 'annotations', 'ENC', 'user');
  });

  it('does not write a drawing format when the image has none', () => {
    const image = document.createElement('img');
    image.setAttribute('src', 'https://cdn.test/a.png');
    const formatText = jest.fn();
    const editor = {
      deleteText: jest.fn(),
      insertEmbed: jest.fn(),
      formatText,
      setSelection: jest.fn(),
    };

    moveImageEmbed(editor, image, 1, 0);

    expect(formatText).not.toHaveBeenCalled();
  });
});

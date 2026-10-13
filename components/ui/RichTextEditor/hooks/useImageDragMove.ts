import { Quill } from 'react-quill-new';
import { MutableRefObject, useEffect, useRef } from 'react';

import { moveImageEmbed } from '../utils/moveImageEmbed';
import { indexFromPoint } from '../utils/indexFromPoint';

interface Options {
  quillRef: MutableRefObject<any>;
}

/**
 * Drag an image in the editor body to a new place in the text.
 *
 * The browser can't do this for us: Quill's own uploader module calls
 * `preventDefault()` on every drop on the editor root, so a native drag of an
 * image inside the body ends with nothing moved. Moving the embed through the
 * document model is also what makes the new position part of the content that
 * gets saved, rather than a DOM change Quill never heard about.
 */
export function useImageDragMove(options: Options) {
  const { quillRef } = options;
  const draggedRef = useRef<{ image: HTMLImageElement; index: number } | null>(null);

  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    const root = editor?.root as HTMLElement | undefined;
    if (!editor || !root) {
      return;
    }

    const onDragStart = (event: DragEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName !== 'IMG') {
        return;
      }

      const image = target as HTMLImageElement;
      const blot = Quill.find(image);
      if (!blot) {
        return;
      }

      draggedRef.current = { image, index: editor.getIndex(blot) };
    };

    const onDragOver = (event: DragEvent) => {
      if (!draggedRef.current) {
        return;
      }

      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    };

    // Capture phase, so this runs before the drop listeners Quill's uploader
    // and quill-image-uploader attached to the same root on bubble. Neither
    // acts on a drag that carries no files, but the caret they compute is the
    // same one we want, and there is no reason to let them race us for it.
    const onDrop = (event: DragEvent) => {
      const dragged = draggedRef.current;
      draggedRef.current = null;
      if (!dragged) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const dropIndex = indexFromPoint(editor, event.clientX, event.clientY);
      if (dropIndex == null) {
        return;
      }

      moveImageEmbed(editor, dragged.image, dragged.index, dropIndex);
    };

    const onDragEnd = () => {
      draggedRef.current = null;
    };

    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('dragover', onDragOver);
    root.addEventListener('drop', onDrop, true);
    root.addEventListener('dragend', onDragEnd);

    return () => {
      root.removeEventListener('dragstart', onDragStart);
      root.removeEventListener('dragover', onDragOver);
      root.removeEventListener('drop', onDrop, true);
      root.removeEventListener('dragend', onDragEnd);
    };
  }, [quillRef]);
}

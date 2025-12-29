import { useEffect, RefObject } from 'react';
import ReactQuill from 'react-quill';

interface MentionState {
  isOpen: boolean;
  query: string;
  position: { top: number; left: number } | null;
  startIndex: number;
}

interface UseMentionDetectionParams {
  enableMentions: boolean;
  quillRef: RefObject<ReactQuill>;
  editorContainerRef: RefObject<HTMLDivElement>;
  mentionState: MentionState;
  setMentionState: (state: MentionState) => void;
  closeMentionDropdown: () => void;
  qlEditorClass: string;
}

/**
 * Hook to detect @ mentions in the editor and show the mention dropdown
 */
export function useMentionDetection({
  enableMentions,
  quillRef,
  editorContainerRef,
  mentionState,
  setMentionState,
  closeMentionDropdown,
  qlEditorClass,
}: UseMentionDetectionParams) {
  useEffect(() => {
    if (!enableMentions || !quillRef.current) {
      return;
    }

    const editor = quillRef.current.getEditor();

    const handleTextChange = () => {
      const selection = editor.getSelection();
      if (!selection) {
        return;
      }

      const [line] = editor.getLine(selection.index);
      if (!line) {
        return;
      }

      const text = editor.getText(0, selection.index);
      const lines = text.split('\n');
      const currentLine = lines[lines.length - 1];

      // Find @ symbol in current line
      const atIndex = currentLine.lastIndexOf('@');

      if (atIndex !== -1 && atIndex < currentLine.length) {
        const query = currentLine.substring(atIndex + 1);

        // Check if there's no space after @ (active mention)
        if (!query.includes(' ')) {
          const textBeforeCursor = text.substring(0, selection.index);
          const absoluteAtIndex = textBeforeCursor.lastIndexOf('@');

          // Get cursor position for dropdown
          const bounds = editor.getBounds(selection.index);
          const editorContainer = editorContainerRef.current;
          const editorElement = editorContainer?.querySelector(`.${qlEditorClass}`);

          if (bounds && editorContainer && editorElement) {
            const editorRect = editorElement.getBoundingClientRect();
            const containerRect = editorContainer.getBoundingClientRect();

            setMentionState({
              isOpen: true,
              query,
              position: {
                top: editorRect.top - containerRect.top + bounds.bottom + 5,
                left: editorRect.left - containerRect.left + bounds.left,
              },
              startIndex: absoluteAtIndex,
            });
          }
          return;
        }
      }

      // Close dropdown if @ not found or space after @
      if (mentionState.isOpen) {
        closeMentionDropdown();
      }
    };

    editor.on('text-change', handleTextChange);
    editor.on('selection-change', handleTextChange);

    return () => {
      editor.off('text-change', handleTextChange);
      editor.off('selection-change', handleTextChange);
    };
  }, [enableMentions, mentionState.isOpen, closeMentionDropdown, quillRef, editorContainerRef, setMentionState, qlEditorClass]);
}

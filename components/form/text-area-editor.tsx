import React, { useState, useRef, useEffect } from 'react';

/**
 * Props for the TextAreaEditor component.
 * @interface TextAreaEditorProps
 * @property {string} name - Name attribute for the hidden input (required).
 * @property {string} [placeholder] - Placeholder text for the editor.
 * @property {string} label - Label for the editor (required).
 * @property {string} value - Initial value for the editor (required).
 */
interface TextAreaEditorProps {
  name: string;
  placeholder?: string;
  label: string;
  value: string;
}

/**
 * TextAreaEditor is a content-editable rich text input with a label and hidden input for form submission.
 *
 * @component
 * @param {TextAreaEditorProps} props - The props for the component.
 * @returns {JSX.Element}
 */
const TextAreaEditor: React.FC<TextAreaEditorProps> = ({ name, value = '', label , placeholder }) => {
 
  // Ref for the content-editable div
  const editorRef = useRef<HTMLDivElement>(null);
  // Ref for the hidden input
  const inputRef = useRef<HTMLInputElement | null>(null);
  // State for the editor's content
  const [editorContent, setEditorContent] = useState(value)

  // Handle user input in the content-editable div
  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    if(editorRef.current) {
      setEditorContent(editorRef.current?.innerHTML)
    }
  };

  // Effect to sync value prop and handle form reset
  useEffect(() => {
    setEditorContent(value)
    if(editorRef.current) {
      editorRef.current.textContent = value;
      editorRef.current.innerHTML = value;
    }
    if(inputRef.current) {
      inputRef.current.value = value
    }
    // Handler for form reset event
    const handleFormReset = () => {
      setEditorContent(value)
      if(editorRef.current) {
        editorRef.current.textContent = value;
        editorRef.current.innerHTML = value;
      }
      if(inputRef.current) {
        inputRef.current.value = value
      }
    }
    // Attach reset event listener to the closest form
   if(editorRef.current) {
    const form = editorRef.current.closest('form')
    if (form) {
      form.addEventListener('reset', handleFormReset); // Add event listener to form reset event

      return () => {
        form.removeEventListener('reset', handleFormReset); // Cleanup: remove event listener
      };
    }
   }
  }, [value])



  return (
    <>
      <div>
        <label className='label'>{label}</label>
        <div data-placeholder={placeholder} ref={editorRef} className={`editor ${editorContent === '' ? 'placeholder' : ''}`} contentEditable role="textarea" onInput={handleInput}></div>
        <input ref={inputRef} type="hidden" name={name} value={editorContent} />
      </div>
      <style jsx>
        {`
          .label {
            font-size: 14px; 
            font-weight: 600;
            margin-bottom: 12px;
            display: block;

          }
          .editor {
            border: 1px solid #ccc;
            padding: 10px;
            min-height: 200px;
            white-space: pre-wrap;
            width: 100%;
            height: 200px;
            overflow-y: scroll;
            font-size: 14px;
            position: relative;
            outline: none;
            border-radius: 8px;
          }
          .editor.placeholder::before {
            content: attr(data-placeholder);
            color: #aaa;
            position: absolute;
            left: 10px;
            top: 10px;
            pointer-events: none;
            font-size: 14px;
          }

          .toolbar {
            margin-bottom: 10px;
          }

          .toolbar button {
            margin-right: 5px;
          }
        `}
      </style>
    </>
  );
};

export default TextAreaEditor;

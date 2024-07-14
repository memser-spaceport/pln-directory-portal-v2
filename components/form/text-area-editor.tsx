import React, { useState, useRef, useEffect } from 'react';

interface TextAreaEditorProps {
  name: string;
  placeholder?: string;
  label: string;
  value: string;
}

const TextAreaEditor: React.FC<TextAreaEditorProps> = ({ name, value = '', label , placeholder }) => {
 
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [editorContent, setEditorContent] = useState(value)

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    if(editorRef.current) {
      setEditorContent(editorRef.current?.innerHTML)
    }
  };
  useEffect(() => {
    setEditorContent(value)
    if(editorRef.current) {
      editorRef.current.textContent = value;
      editorRef.current.innerHTML = value;
    }
    if(inputRef.current) {
      inputRef.current.value = value
    }
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

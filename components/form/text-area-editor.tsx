import React, { useState, useRef, useEffect } from 'react';

interface TextAreaEditorProps {
  defaultValue?: string;
  name: string;
  placeholder?: string;
  label: string;
}

const TextAreaEditor: React.FC<TextAreaEditorProps> = ({ defaultValue = '', name, label , placeholder }) => {
  const [content, setContent] = useState<string>(defaultValue);
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEmpty, setIsEmpty] = useState<boolean>(!defaultValue);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = defaultValue;
    }
    if (inputRef.current) {
      inputRef.current.value = defaultValue;
    }
    setIsEmpty(!defaultValue);
  }, [defaultValue]);

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const newContent = event.currentTarget.innerHTML;
    setContent(newContent);
    setIsEmpty(newContent === '');
    if (inputRef.current) {
      inputRef.current.value = newContent;
    }
  };

  return (
    <>
      <div>
        <label className='label'>{label}</label>
        <div data-placeholder={placeholder} ref={editorRef} className={`editor ${isEmpty ? 'placeholder' : ''}`} contentEditable role="textarea" onInput={handleInput}></div>
        <input ref={inputRef} type="hidden" name={name} value={content} />
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

import { Editor } from '@tinymce/tinymce-react';
import React, { useState } from 'react';
import tinymce from 'tinymce';
// import tinymce from 'tinymce';

interface ITextEditorProps {
  text: string;
  setContent: (item: string) => void;
  id?: string;
  maxLength?: number;
}

const TextEditor = (props: ITextEditorProps) => {
  const [text, setText] = useState<string>(props.text);
  const [textOnly, setTextOnly] = useState<string>('');
  // const wordcount = tinymce.activeEditor?.plugins.wordcount;


  const maxLen = props.maxLength || 2000;
  return (
    <>
      <Editor
        apiKey={process.env.TEXT_EDITOR_API_KEY}
        value={props.text}
        id={props.id || 'editor'}
        init={{
          branding: false,
          // height:372,
          min_height: 200,
          menubar: false,
          toolbar_sticky: true,
          toolbar_mode: 'wrap',
          plugins: 'lists fullscreen link',
          toolbar: 'undo redo fullscreen  | bold italic underline strikethrough aligncenter alignleft alignright blockquote link bullist numlist removeformat',
        }}
        onInit={(evt, editor) => {
          setTextOnly(editor.getContent({format:'text'}));
        }}
        onEditorChange={(newValue, editor) => {
          
          setTextOnly(editor.getContent({format:'text'}));
          
          if (editor.getContent({format:'text'}).length <= maxLen) {
            props?.setContent(newValue);
            setText(newValue);
          } 
        }}

        onPaste={(e: ClipboardEvent, editor) => {
          e.preventDefault();
          const clipboardData = e.clipboardData;
          const pastedData = clipboardData?.getData('Text') || '';
          const newText = editor.getContent() + pastedData;
          if (newText.length <= maxLen) {
            editor.insertContent(pastedData);
            setText(editor.getContent());
            props?.setContent(editor.getContent());
          } else {
            const truncatedData = pastedData.substring(0, maxLen - textOnly.length);
            editor.insertContent(truncatedData);
            setText(editor.getContent({}));
            props?.setContent(editor.getContent());
          }

        }}
        
      />
      <div className='editor__count'>
        <div className='editor__count__txt'>{maxLen - textOnly.length}/{maxLen}</div>
      </div>
      <style jsx>{`
        .editor__save-changes {
          padding: 10px 24px;
          background: #156ff7;
          color: white;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          float: right;
          margin-top: 8px;
        }
          .editor__count{
            position: relative;
            display: flex;
            flex-direction: row-reverse;
          }
            .editor__count__txt{
              font-size: 12px;
              color: #6b7c93;
            }
      `}</style>
    </>
  );
};

export default TextEditor;

import { Editor } from '@tinymce/tinymce-react';
import React, { useState } from 'react';
// import tinymce from 'tinymce';

interface ITextEditorProps {
  text: string;
  setContent: (item: string) => void;
  id?: string;
  maxLength?: number;
}

const TextEditor = (props: ITextEditorProps) => {
  const [text, setText] = useState<string>(props.text);

  const maxLen = props.maxLength || 500;
  return (
    <>
      <Editor
        apiKey={process.env.TEXT_EDITOR_API_KEY}
        value={props.text}
        id={props.id || 'editor'}
        init={{
          branding: false,
          // height:372,
          menubar: false,
          toolbar_sticky: true,
          mobile: {
            toolbar_mode: 'wrap',
          },
          plugins: 'lists fullscreen link',
          toolbar: 'undo redo fullscreen  | bold italic underline strikethrough aligncenter alignleft alignright blockquote link bullist numlist removeformat',
        }}
        onEditorChange={(newValue, editor) => {
          if(maxLen - text.length){
            props?.setContent(newValue);
            setText(newValue);
          }
        }}
      />
      <div className='editor__count'>
        <div className='editor__count__txt'>{maxLen - text.length}/{maxLen}</div>
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

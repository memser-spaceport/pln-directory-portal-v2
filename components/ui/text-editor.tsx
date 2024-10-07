import { Editor } from '@tinymce/tinymce-react';
import React, { useState } from 'react';
// import tinymce from 'tinymce';

interface ITextEditorProps {
  text: string;
  setContent: (item: string) => void;
  id?: string;
}

const TextEditor = (props: ITextEditorProps) => {
  // const [text, setText] = useState<string>(props.text);


  return (
    <>
      
        <Editor
          apiKey="4r3lcidhwfoiq9msn7qrmrpa92d1321nikuor8492wdh98p5"
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
            onEditorChange={(newValue, editor) => props?.setContent(newValue)}
        />
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
      `}</style>
    </>
  );
};

export default TextEditor;

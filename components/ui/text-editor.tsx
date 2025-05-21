'use client';

import { Editor } from '@tinymce/tinymce-react';
import React, { useEffect, useRef, useState } from 'react';
import CustomLinkDialog from './link-dialog';

interface ITextEditorProps {
  text: string;
  setContent: (item: string) => void;
  id?: string;
  maxLength?: number;
  statusBar?: boolean;
  toolbarOptions?: string;
  isRequired?: boolean;
  height?: number;
  errorMessage?: string;
  isToolbarSticky?: boolean;
}

const TextEditor = (props: ITextEditorProps) => {
  const [text, setText] = useState<string>(props.text);
  const [textOnly, setTextOnly] = useState<string>('');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const isRequired = props?.isRequired ?? false;
  const errorMessage = props?.errorMessage;
  const isToolbarSticky  = props?.isToolbarSticky ?? true;

  const [linkObj, setlinkObj] = useState<{ text: string; url: string }>({ text: '', url: '' });
  // const wordcount = tinymce.activeEditor?.plugins.wordcount;

  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;

      // editor.on('NodeChange', (e:any) => {
      //   const selectedNode = editor.selection.getNode();
      //   if (selectedNode.nodeName === 'A') {
      //     editor.ui.registry.getAll().buttons.customlinkbutton.active = true;
      //   } else {
      //     editor.ui.registry.getAll().buttons.customlinkbutton.active = false;
      //   }
      // });

      // editor.on('click', (e:any) => {
      //   const selectedNode = editor.selection.getNode();
      //   if (selectedNode.nodeName === 'A') {
      //     e.preventDefault();
      //     console.log(editor.ui.registry.getAll().buttons.customlinkbutton);

      //     // openCustomDialog(selectedNode.innerText, selectedNode.getAttribute('href'));
      //     // setDialogOpen(true);
      //   }
      // });
    }
  }, [editorRef.current]);

  const maxLen = props.maxLength || 2000;
  return (
    <>
      <div className="editor">
        <Editor
          apiKey={process.env.TEXT_EDITOR_API_KEY}
          value={props.text}
          id={props.id || 'editor'}
          init={{
            branding: false,
            // height:372,
            height: props?.height ?? 400,
            menubar: false,
            toolbar_sticky: isToolbarSticky,
            statusbar: props?.statusBar ?? true,
            toolbar_mode: 'wrap',
            relative_urls: false,
            remove_script_host: false,
            convert_urls: true,
            plugins: 'lists fullscreen link',
            toolbar: props?.toolbarOptions ?? 'undo redo fullscreen  | bold italic underline strikethrough aligncenter alignleft alignright blockquote customLinkButton bullist numlist removeformat',
            setup: (editor) => {
              // Unregister the default link button
              editor.ui.registry.addToggleButton('customLinkButton', {
                icon: 'link',
                tooltip: 'Insert/edit link',
                onAction: () => {
                  const selectedText = editor.selection.getContent({ format: 'text' });
                  const selectedNode = editor.selection.getNode();
                  if (selectedNode.nodeName !== 'A') {
                    setlinkObj({ text: selectedText, url: '' });
                  } else {
                    setlinkObj({ text: selectedNode.innerText, url: selectedNode.getAttribute('href') || '' });
                  }
                  setDialogOpen(true);
                },
                onSetup: (buttonApi) => {
                  const nodeChangeHandler = (e: any) => {
                    const selectedNode = editor.selection.getNode();
                    if (selectedNode.nodeName === 'A') {
                      setlinkObj({ text: selectedNode.innerText, url: selectedNode.getAttribute('href') || '' });
                      buttonApi.setActive(true);
                    } else {
                      if (buttonApi.isActive()) {
                        buttonApi.setActive(false);
                      }
                    }
                  };
                  editor.on('NodeChange', nodeChangeHandler);
                  return () => editor.off('NodeChange', nodeChangeHandler);
                },
              });
              // editor.ui.registry.addButton('customDialogButton', {
              //   text: 'Open Custom Dialog',
              //   onAction: () => setDialogOpen(true),
              // });
            },
          }}
          onInit={(evt, editor) => {
            setTextOnly(editor.getContent({ format: 'text' }));
            editorRef.current = editor;
          }}
          onEditorChange={(newValue, editor) => {
            setTextOnly(editor.getContent({ format: 'text' }));
            if (editor.getContent({ format: 'text' }).length <= maxLen) {
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
        <CustomLinkDialog
          isOpen={isDialogOpen}
          linkObj={linkObj}
          onRequestClose={() => {
            setlinkObj({ text: '', url: '' });
            setDialogOpen(false);
          }}
          onSave={(txt, link) => {
            setDialogOpen(false);
            if (editorRef.current) {
              const editor = editorRef.current;
              const selectedNode = editor.selection.getNode();
              if (selectedNode.nodeName === 'A') {
                // Use TinyMCE's API to update the link properly
                editor.dom.setAttrib(selectedNode, 'href', link);
                editor.dom.setAttrib(selectedNode, 'target', '_blank');
                editor.dom.setHTML(selectedNode, txt); // Updates the text inside <a>
          
                // Force TinyMCE to recognize the change
                editor.undoManager.add(); // Add to the undo stack
              } else {
                // Insert new link
                const linkMarkup = `<a href="${link}" target="_blank" rel="noopener noreferrer">${txt}</a>`;
                editor.execCommand('mceInsertContent', false, linkMarkup);
              }
          
              // Ensure the new link is stored in state
              setlinkObj({ text: txt, url: link });
            }
          }}
          
        />
      </div>
      <div className="editor__count">
        <div>{errorMessage && <span className="error">{errorMessage}</span>}</div>
        <div className="editor__count__txt">
          {maxLen - textOnly.length}/{maxLen}
        </div>
      </div>
      <input type="hidden" name="rich-text-editor" value={text} />
      <style jsx>{`
        .editor {
          outline: ${isRequired ? '1px solid red' : ''};
          border-radius: 8px;
        }

        .error {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: red;
        }
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
        .editor__count {
          position: relative;
          display: flex;
          margin-top: 4px;
          justify-content: space-between;
          align-items: center;
        }
        .editor__count__txt {
          font-size: 12px;
          color: #6b7c93;
        }
      `}</style>
    </>
  );
};

export default TextEditor;

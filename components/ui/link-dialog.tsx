import { useEffect, useState } from 'react';
import TextField from '../form/text-field';

interface CustomLinkDialogProps {
  isOpen: boolean;
  linkObj: {text:string,url:string};
  onRequestClose: () => void;
//   onSave: () => void;
    onSave: (text: string, url: string) => void;
}

const CustomLinkDialog = ({ isOpen, onRequestClose, onSave,linkObj }: CustomLinkDialogProps) => {
  const [url, setUrl] = useState(linkObj?.url ?? '');
  const [text, setText] = useState(linkObj?.text ?? '');

  const handleSave = () => {
      onSave(text, url);
    // onSave();
    setUrl('');
    setText('');
    onRequestClose();
  };

  useEffect(() => {
    // if(isOpen){
        setUrl(linkObj?.url ?? '');
        setText(linkObj?.text ?? '');
    // }
  }, [isOpen,linkObj.url,linkObj.text]);

  return (
    <>
      <dialog
        open={isOpen}
        className="custom-link-dialog"
        // onRequestClose={onRequestClose}
        // contentLabel="Custom Link Dialog"
      >
        <div className="custom-link-dialog__contatiner">
          <h2>Insert Link</h2>
          <div className="custom-link-dialog__contatiner__inputs">
            <div className='custom-link-dialog__contatiner__inputs__label'>Text</div>
            <input className='custom-link-dialog__contatiner__inputs__text' name="linkTxt" placeholder="Enter link text" value={text} onChange={(e) => setText(e.target.value)}/>
            
            <div className='custom-link-dialog__contatiner__inputs__label'>URL</div>
            <input className='custom-link-dialog__contatiner__inputs__text' name="linkURL" placeholder="Enter link URL" value={url} onChange={(e) => setUrl(e.target.value)}/>
            
            {/* <TextField id="link-text" label="Text" name="linkText" type="text" placeholder="Enter link text" defaultValue={text} onChange={(e) => setText(e.target.value)} />
            <TextField id="link-url" label="URL" name="linkURL" type="url" placeholder="Enter link URL" defaultValue={url} onChange={(e) => setUrl(e.target.value)} /> */}
            {/* <label>
            Link Text:
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter link text..."
            />
          </label>
          <label>
            URL:
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL..."
            />
          </label> */}
          </div>
          <div className="desc__header__action">
            <button className="desc__header__action__cancel" onClick={onRequestClose}>
              <span className="desc__header__action__cancel__txt">Cancel</span>
            </button>
            <button className="desc__header__action__save" onClick={handleSave}>
              <span className="desc__header__action__save__txt">Insert Link</span>
            </button>
          </div>
        </div>
      </dialog>
      <style jsx>
        {`
          .custom-link-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;

            padding: 20px;
            border-radius: 8px;
            border: 1px solid #ccc;
            width: 400px;
            max-width: 100%;
            z-index: 1000;
          }
          .custom-link-dialog__contatiner {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .custom-link-dialog__contatiner__inputs {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .desc__header__action__cancel {
            padding: 8px 16px;
            background: white;
            border: 1px solid #156ff7;
            border-radius: 8px;
          }

          .desc__header__action__cancel__txt {
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            text-align: left;
            color: #156ff7;
          }

          .desc__header__action__save {
            padding: 8px 16px;
            background: white;
            border: 1px solid #156ff7;
            border-radius: 8px;
            background: #156ff7;
          }

          .desc__header__action__save__txt {
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            text-align: left;
            color: white;
          }
          .desc__header__action {
            display: flex;
            gap: 8px;
            justify-content: space-between;
          }

          .custom-link-dialog__contatiner__inputs__text{
          width: 100%;
            padding: 8px 12px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            min-height:40px;
            font-size: 14px;
          }

          .custom-link-dialog__contatiner__inputs__label{
            font-weight: 600;
            font-size: 14px;
          }
        `}
      </style>
    </>
  );
};

export default CustomLinkDialog;
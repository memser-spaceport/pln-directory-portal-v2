import { useEffect, useState } from 'react';

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

  const [error, setError] = useState('');

  const validateUrl = (url: string) => {
    const urlPattern = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/mg
    
    return !!url.match(urlPattern);
  };

  const handleSave = () => {
    
    if (text === '') {
      setError('Text field cannot be empty');
      return;
    }
    if (url === '') {
      setError('URL field cannot be empty');
      return;
    }
    
    if (!validateUrl(url)) {
      setError('Please enter a valid URL.');
      return;
    }
    // onSave();
    onSave(text, url);
    setUrl('');
    setText('');
    onRequestClose();
  };

  useEffect(() => {
    // if(isOpen){
        setUrl(linkObj?.url ?? '');
        setText(linkObj?.text ?? '');
        setError('');
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
          <div className="custom-link-dialog__contatiner__error">{error}</div>
          <div className="custom-link-dialog__contatiner__inputs">
            <div className="custom-link-dialog__contatiner__inputs__label">Text</div>
            <input
              className="custom-link-dialog__contatiner__inputs__text"
              placeholder="Enter link text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />

            <div className="custom-link-dialog__contatiner__inputs__label">URL</div>
            <input
              className="custom-link-dialog__contatiner__inputs__text"
              placeholder="Enter link URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />

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
            <button className="desc__header__action__cancel" onClick={onRequestClose} type="button">
              <span className="desc__header__action__cancel__txt">Cancel</span>
            </button>
            <button className="desc__header__action__save" onClick={handleSave} type="button">
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

          .custom-link-dialog__contatiner__inputs__text {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            min-height: 40px;
            font-size: 14px;
          }

          .custom-link-dialog__contatiner__inputs__label {
            font-weight: 600;
            font-size: 14px;
          }

          .custom-link-dialog__contatiner__error {
            color: red;
          }
        `}
      </style>
    </>
  );
};

export default CustomLinkDialog;

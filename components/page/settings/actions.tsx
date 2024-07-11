import { useEffect, useState } from "react";

function SettingsAction() {
  const [isFormChanged, setIsFormChanged] = useState(false);
  const onResetForm = () => {
    document.dispatchEvent(new CustomEvent('reset-member-register-form'));
    setIsFormChanged(false)
  }
  useEffect(() => {
    function handler(e: any) {
      console.log(e.detail, ' setting actions')
      setIsFormChanged(e.detail);
    }
    document
    document.addEventListener('settings-form-changed', handler);
    return function () {
      document.removeEventListener('settings-form-changed', handler);
    }
  }, [])

  return (
    <>
      <div className={`fa ${isFormChanged === false ? 'hidden': ''}`}>
        <div className="fa__info">
          <img alt="save icon" src="/icons/save.svg" width="16" height="16" />
          <p>Attention! You have unsaved changes!</p>
        </div>
        <div className="fa__action">
          <div className="fa__action__cancel" onClick={onResetForm}>
            Cancel
          </div>
          <button className="fa__action__save" type="submit">
            Save Changes
          </button>
        </div>
      </div>
      <style jsx>
        {`
         .hidden {
            visibility: hidden;
            height: 0;
            overflow: hidden;
          }
          .fa {
            height: 98px;
            position: sticky;
            border-top: 2px solid #ff820e;
            margin: 0;
            width: 100%;
            flex-direction: column;
            bottom: 0px;
            padding: 16px;
            left: auto;
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .fa__info {
            display: flex;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            align-items: center;
            gap: 6px;
          }

          .fa__action {
            display: flex;
            gap: 6px;
          }
          .fa__action__save {
            padding: 10px 24px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
          }
          .fa__action__cancel {
            padding: 10px 24px;
            background: white;
            color: #0f172a;
            font-size: 14px;
            border: 1px solid #cbd5e1;
            font-weight: 500;
            border-radius: 8px;
          }

          @media (min-width: 1024px) {
            .fa {
              height: 72px;
              bottom: 16px;
              flex-direction: row;
              left: auto;
              border-radius: 8px;
              justify-content: space-between;
              align-items: center;
              width: calc(100% - 48px);
              margin: 0 24px;
              border: 2px solid #ff820e;
            }
          }
        `}
      </style>
    </>
  );
}

export default SettingsAction;

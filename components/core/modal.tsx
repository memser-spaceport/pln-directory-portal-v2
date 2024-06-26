import { ReactNode } from "react";

interface IModal {
  onClose : () => void;
  children: ReactNode;
}
const Modal = (props: IModal) => {
  const onClose = props?.onClose ?? props?.onClose;
  const children = props?.children;

  return (
    <>
      <div className="modal">
        <div className="modal__cn">
          <button className="modal__cn__closebtn" onClick={onClose}>
            <img loading="lazy" src="/icons/close.svg"/>
          </button>
          {children}
        </div>
      </div>
      <style jsx>
        {`
          .modal {
            position: fixed;
            top: 0;
            right: 0;
            left: 0;
            z-index: 5;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100vw;
            background-color: rgba(0, 0, 0, 0.6);
          }

          .modal__cn {
            position: relative;
          }

          .modal__cn__closebtn {
            position: absolute;
            border: none;
            top: 24px;
            z-index: 5;
            right: 24px;
            user-select: none;
            background: #fff;
          }
        `}
      </style>
      <style global jsx>
        {`
        html {
          height: 80vh;
          overflow: hidden;
        }
        `}
      </style>
    </>
  );
};

export default Modal;

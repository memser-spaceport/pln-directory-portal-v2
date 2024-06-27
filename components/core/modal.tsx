import Image from 'next/image';
import { ReactNode } from 'react';

interface IModal {
  onClose: () => void;
  children: ReactNode;
  modalRef: any;
}
const Modal = (props: IModal) => {
  const onClose = props?.onClose ?? props?.onClose;
  const children = props?.children;
  const ref = props?.modalRef;

  return (
    <>
      <dialog onClose={onClose} ref={ref} className="modal">
        <div className="modal__cn">
          <button className="modal__cn__closebtn" onClick={onClose}>
            <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
          </button>
          {children}
        </div>
      </dialog>
      <style jsx>
        {`
          .modal {
            border: none;
            margin: auto;
            border-radius: 12px;
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

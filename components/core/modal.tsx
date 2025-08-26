'use client';
import Image from 'next/image';
import { ReactNode, useEffect, useRef } from 'react';
import DialogLoader from './dialog-loader';
interface IModal {
  onClose: (e?: any) => void;
  children: ReactNode;
  modalRef: any;
}
const Modal = (props: IModal) => {
  const onClose = props?.onClose ?? props?.onClose;
  const children = props?.children;
  const ref = props?.modalRef;

  return (
    <>
      <dialog autoFocus={true} ref={ref} className="modal">
        <DialogLoader />
        {/* for skip button focus */}
        <button className="modal__cn__hidden"></button>
        <div className="modal__cn">
          <button type="button" className="modal__cn__closebtn" onClick={onClose}>
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
            border-radius: 24px;
          }

          .modal__cn {
            position: relative;
            overflow: hidden;
          }

          .modal__cn__hidden {
            display: hidden;
            position: absolute;
            height: 0px;
            width: 0px;
          }

          .modal__cn__closebtn {
            position: absolute;
            border: none;
            top: 12px;
            right: 12px;
            background: transparent;
            user-select: none;
            outline: none;
            z-index: 1;
          }
        `}
      </style>
    </>
  );
};

export default Modal;

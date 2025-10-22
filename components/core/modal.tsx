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
            user-select: none;
            outline: none;
            z-index: 1;

            display: flex;
            padding: 6px;
            justify-content: center;
            align-items: center;
            gap: 0;

            border-radius: 50%;
            background: rgba(14, 15, 17, 0.04);

            /* Button/regular/light */
            box-shadow: 0 -2px 4px 0 rgba(14, 15, 17, 0.02) inset;
          }
        `}
      </style>
    </>
  );
};

export default Modal;

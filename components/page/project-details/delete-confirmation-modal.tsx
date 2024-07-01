"use client";

import Modal from "@/components/core/modal";
import ModalButton from "@/components/ui/modal-button";
import { useRef } from "react";

interface IDeleteConfirmationModal {
  onClose: () => void;
  onDeleteProject: () => void;
}

const DeleteConfirmationModal = (props: IDeleteConfirmationModal) => {
  const onClose = props?.onClose;
  const onDeleteProject = props?.onDeleteProject;
  const modalRef = useRef(null);

  return (
    <>
      <Modal modalRef={modalRef} onClose={onClose}>
        <div className="dcm">
          <div className="dcm__header">Confirm Delete</div>
          <div className="dcm__body">
            <p className="dcm__body__desc">
              Are you sure you want to delete the project?
            </p>
          </div>
          <div className="dcm__footer">
            <ModalButton
              variant="secondary"
              type="button"
              callBack={onClose}
              value="Cancel"
            />
            <ModalButton
              variant="primary"
              type="button"
              callBack={onDeleteProject}
              value="Confirm"
            />
          </div>
        </div>
      </Modal>
      <style jsx>{`
        .dcm {
          padding: 24px;
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          //   height: 60vh;
          overflow: auto;
          border-radius: 12px;
          background: #fff;
        }

        .dcm__header {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          letter-spacing: 0em;
          color: #0f172a;
        }

        .dcm__body__desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          letter-spacing: 0px;
          color: #0f172a;
        }

        .dcm__footer {
          display: flex;
          flex-direction: column-reverse;
          gap: 10px;
          padding: 10px 0px;
        }

        @media (min-width: 1024px) {
          .dcm {
            width: 656px;
          }

          .dcm__footer {
            flex-direction: row;
            justify-content: end;
            gap: 10px;
          }
        }
      `}</style>
    </>
  );
};

export default DeleteConfirmationModal;

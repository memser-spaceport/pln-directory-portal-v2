'use client';

import Modal from '@/components/core/modal';
import ModalButton from '@/components/ui/modal-button';
import { EVENTS } from '@/utils/constants';
import { useEffect, useRef } from 'react';

/**
 * @typedef IDeleteConfirmationModal
 * @property {Function} onClose - The callback function to be called when the modal is closed.
 * @property {Function} onDeleteProject - The callback function to be called when the project is deleted.
 * @description The DeleteConfirmationModal component props.
 */
interface IDeleteConfirmationModal {
  onClose: () => void;
  onDeleteProject: () => void;
}
/**
 * DeleteConfirmationModal component displays a modal for confirming the deletion of a project.
 *
 * @component
 * @example
 * // Usage:
 * <DeleteConfirmationModal
 *   onClose={() => handleModalClose()}
 *   onDeleteProject={() => handleDeleteProject()}
 * />
 *
 * @param {Object} props - The component props.
 * @param {Function} props.onClose - The callback function to be called when the modal is closed.
 * @param {Function} props.onDeleteProject - The callback function to be called when the project is deleted.
 * @returns {JSX.Element} The DeleteConfirmationModal component.
 */
const DeleteConfirmationModal = (props: IDeleteConfirmationModal) => {
  const onClose = props?.onClose;
  const onDeleteProject = props?.onDeleteProject;
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    document.addEventListener(EVENTS.PROJECT_DETAIL_DELETE_MODAL_OPEN_AND_CLOSE, (e: any) => {
      if (e.detail) {
        modalRef?.current?.showModal();
        return;
      }
      modalRef?.current?.close();
      return;
    });

    return document.removeEventListener(EVENTS.PROJECT_DETAIL_DELETE_MODAL_OPEN_AND_CLOSE, () => {});
  }, []);

  return (
    <>
      <Modal modalRef={modalRef} onClose={onClose}>
        <div className="dcm">
          <div className="dcm__header">Confirm Delete</div>
          <div className="dcm__body">
            <p className="dcm__body__desc">Are you sure you want to delete the project?</p>
          </div>
          <div className="dcm__footer">
            <ModalButton variant="secondary" type="button" callBack={onClose} value="Cancel" />
            <ModalButton variant="primary" type="button" callBack={onDeleteProject} value="Confirm" />
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

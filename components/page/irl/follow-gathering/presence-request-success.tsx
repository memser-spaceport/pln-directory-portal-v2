import Modal from '@/components/core/modal';
import { EVENTS } from '@/utils/constants';
import { useEffect, useRef } from 'react';

const PresenceRequestSuccess = () => {
  const modalRef = useRef<HTMLDialogElement>(null);

  const onClose = () => {
    if (modalRef.current) {
      modalRef.current.close();
    }
  };

  useEffect(() => {
    document.addEventListener(EVENTS.MARK_MY_PRESENCE_SUBMIT_SUCCESS_POPUP, () => {
      if (modalRef.current) {
        modalRef.current.showModal();
      }
    });
    return () => {
      document.removeEventListener(EVENTS.MARK_MY_PRESENCE_SUBMIT_SUCCESS_POPUP, () => {});
    };
  }, []);

  return (
    <Modal onClose={onClose} modalRef={modalRef}>
      <div className="success-modal">
        <h2 className="success-modal__title">Request Submitted</h2>
        <p className="success-modal__message">Your request has been submitted! An admin will review it soon.</p>
        <div>
          <button onClick={onClose} className="success-modal__button">
            Close
          </button>
        </div>
      </div>
      <style jsx>{`
        .success-modal {
          padding: 24px;
          text-align: left;
          width: 656px;
          background: white;
          border-radius: 8px;
          height: 200px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .success-modal__title {
          font-weight: 700;
          font-size: 24px;
          line-height: 32px;
          letter-spacing: 0%;
          padding-block: 10px;
        }

        .success-modal__message {
          font-size: 14px;
          line-height: 20px;
          color: #000000;
          margin-bottom: 16px;
        }

        .success-modal__button {
          background: #0066ff;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          float: right;
          height: 40px;
        }

        .success-modal__button:hover {
          background: #0052cc;
        }
      `}</style>
    </Modal>
  );
};

export default PresenceRequestSuccess;

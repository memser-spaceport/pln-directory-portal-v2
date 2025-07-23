'use client';

import React, { FC } from 'react';
import Image from 'next/image';

interface DeleteEventModalProps {
  isOpen: boolean;
  eventName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteEventModal: FC<DeleteEventModalProps> = ({ 
  isOpen, 
  eventName, 
  onClose, 
  onConfirm, 
  isDeleting = false 
}) => {
  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="modal">
          <div className="modalContent">
            <button type="button" className="closeButton" onClick={onClose} disabled={isDeleting}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            
            <h2 className="title">
              Are you sure do you want to delete this Event?
            </h2>
          
            <div className="dialogControls">
              <button 
                type="button" 
                className="secondaryButton" 
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="errorButton" 
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        /* Mobile-first design (default styles) */
        .modal {
          position: fixed;
          top: 0;
          right: 0;
          left: 0;
          bottom: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #00000066;
          padding: 16px;
        }

        .closeButton {
          position: absolute;
          border: none;
          top: 12px;
          right: 12px;
          background: transparent;
          user-select: none;
          outline: none;
          cursor: pointer;
          z-index: 1;
        }

        .closeButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modalContent {
          background: white;
          border-radius: 12px;
          position: relative;
          padding: 20px;
          width: 100%;
          max-width: 400px;
        }

        .title {
          font-size: 16px;
          font-weight: 600;
          line-height: 22px;
          color: #0f172a;
          margin: 0 0 20px 0;
          padding-right: 32px;
        }

        .dialogControls {
          display: flex;
          flex-direction: column-reverse;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
        }

        .secondaryButton {
          padding: 10px 24px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 1px 1px 0 #0f172a14;
          background: inherit;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #0f172a;
          cursor: pointer;
          width: 100%;
          display: flex;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .secondaryButton:hover {
          background: #f8fafc;
        }

        .secondaryButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .errorButton {
          padding: 10px 24px;
          border: 1px solid #dd2c5a;
          color: #ffffff;
          box-shadow: 0 1px 1px 0 #0f172a14;
          background: #dd2c5a;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          cursor: pointer;
          width: 100%;
          display: flex;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .errorButton:hover {
          background: #b91c1c;
          border-color: #b91c1c;
        }

        .errorButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Tablet Portrait and above (640px+) */
        @media (min-width: 640px) {
          .modal {
            padding: 20px;
          }
          
          .modalContent {
            padding: 24px;
            max-width: 480px;
          }
          
          .title {
            font-size: 18px;
            line-height: 24px;
            margin-bottom: 24px;
          }
          
          .dialogControls {
            flex-direction: row;
            justify-content: flex-end;
            gap: 12px;
          }
          
          .secondaryButton,
          .errorButton {
            width: auto;
          }
        }

        /* Desktop and above (1200px+) */
        @media (min-width: 1200px) {
          .modalContent {
            max-width: 520px;
          }
        }
      `}</style>
    </>
  );
};

export default DeleteEventModal; 
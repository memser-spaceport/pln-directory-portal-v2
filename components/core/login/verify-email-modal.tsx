// This component renders a modal for verifying email with error messages and actions.
import { RefObject, useEffect, } from 'react';

interface IVerifyEmailModalProps {
  handleModalClose: () => void;
  content: { title: string; errorMessage: string; description: string };
  dialogRef: RefObject<HTMLDialogElement>;
}

// VerifyEmailModal component displays a modal for email verification
export function VerifyEmailModal({ content, handleModalClose, dialogRef }: IVerifyEmailModalProps) {
  const description = content?.description ?? '';
  const title = content?.title ?? '';
  const errorMessage = content?.errorMessage ?? '';

  return (
    <>
      <dialog onClose={handleModalClose} ref={dialogRef} className="verifyEmail" data-testid="verify-email-modal">
        <div className="verifyEmail__cn">
          <div className="verifyEmail__cn__box">
            <div className="verifyEmail__cn__box__info">
              <div className="verifyEmail__cn__box__info__hdr">
                <h6 className="verifyEmail__cn__box__info__hdr__ttl" data-testid="modal-title">{title}</h6>
                <button onClick={handleModalClose} className="verifyEmail__cn__box__info__hdr__clsBtn" data-testid="close-button">
                  <img width={22} height={22} src="/icons/close.svg" alt="close" />
                </button>
              </div>
              <div className="verifyEmail__cn__box__info__errmsg">
                <img width={16} height={16} src="/icons/warning-red.svg" alt="warn icon" />
                <p className="verifyEmail__cn__box__info__errmsg__text" data-testid="error-message">{errorMessage}</p>
              </div>
              {description && <p className="verifyEmail__cn__box__info__text" data-testid="description-text">{description}</p>}
              <div className="verifyEmail__cn__box__info__actions">
                <button onClick={handleModalClose} className="verifyEmail__cn__box__info__actions__cls__btn" data-testid="close-action-button">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
      <style jsx>
        {`
          .verifyEmail {
            background: white;
            border-radius: 8px;
            border: none;
            width: 656px;
            margin: auto;
            outline: none;
          }
          .verifyEmail__cn {
            width: 100%;
            height: 100%;
            position: relative;
          }
          .verifyEmail__cn__box {
            // width: 90svw;
            background: white;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
          }
          .verifyEmail__cn__box__close {
            display: none;
          }
          .verifyEmail__cn__box__info {
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
          }
          .verifyEmail__cn__box__info__hdr {
            position: relative;
            display: flex;
            align-items: center;
            flex-direction: row;
            gap: 8px;
            width: 100%;
          }
          .verifyEmail__cn__box__info__hdr__ttl {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
          }

          .verifyEmail__cn__box__info__text {
            font-weight: 400;
            padding-bottom: 16px;
            padding: 10px 0px 0px 0px;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .verifyEmail__cn__box__info__hdr__clsBtn {
            position: absolute;
            right: 0;
            top: 0;
            background: transparent;
          }

          .verifyEmail__cn__box__info__errmsg {
            display: flex;
            gap: 10px;
            align-items: center;
            background-color: #dd2c5a1a;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 20px;
            width: 100%;
          }

          .verifyEmail__cn__box__info__errmsg__text {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: #0f172a;
          }
          .verifyEmail__cn__box__info__actions {
            background: white;
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 0 0 8px 8px;
            width: 100%;
            justify-content: center;
            margin-top: 20px;
          }

          .verifyEmail__cn__box__info__actions__cls__btn {
            padding: 8px 24px;
            border-radius: 8px;
            border: 1px solid #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
            background-color: #156ff7;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
          }

          @media (min-width: 1024px) {
            .verifyEmail__cn__box__info__actions {
              justify-content: end;
            }

            .verifyEmail__cn__box__info__actions__cls__btn {
              width: 86px;
            }

            .verifyEmail__cn__box__info__text {
              text-align: left;
              width: 600px;
            }

            .verifyEmail__cn__box__info__hdr {
              width: 100%;
            }

            .verifyEmail__cn__box {
              flex-direction: row;
              max-height: 598px;
              width: 656px;
              overflow: hidden;
            }

            .verifyEmail__cn__box__close {
              position: absolute;
              top: 16px;
              right: 16px;
              display: block;
              cursor: pointer;
              height: 12px;
              width: 12px;
            }
          }
        `}
      </style>
    </>
  );
}

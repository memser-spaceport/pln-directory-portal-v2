// This component renders a modal for verifying email with error messages and actions.
import { RefObject, useEffect } from 'react';

import s from './VerifyEmailModal/VerifyEmailModal.module.scss';

interface IVerifyEmailModalProps {
  handleModalClose: () => void;
  content: { title: string; errorMessage: string; description: string; variant: string };
  dialogRef: RefObject<HTMLDialogElement>;
}

// VerifyEmailModal component displays a modal for email verification
export function VerifyEmailModal({ content, handleModalClose, dialogRef }: IVerifyEmailModalProps) {
  const description = content?.description ?? '';
  const title = content?.title ?? '';
  const errorMessage = content?.errorMessage ?? '';
  const variant = content?.variant ?? 'regular';

  return (
    <>
      <dialog onClose={handleModalClose} ref={dialogRef} className="verifyEmail" data-testid="verify-email-modal">
        <div className="verifyEmail__cn">
          <div className="verifyEmail__cn__box">
            <div className="verifyEmail__cn__box__info">
              {variant === 'access_denied_demo_day' ? (
                <div className="verifyEmail__cn__box__info__accessDenied">
                  <button
                    onClick={handleModalClose}
                    className="verifyEmail__cn__box__info__hdr__clsBtn"
                    data-testid="close-button"
                  >
                    <img width={22} height={22} src="/icons/close.svg" alt="close" />
                  </button>
                  <div className={s.icon}>
                    <WarningIcon />
                  </div>
                  {/*<div className={s.title}>{title}</div>*/}
                  <div className={s.description}>{errorMessage}</div>

                  <a href={description} className={s.cta}>
                    Request invite
                  </a>
                </div>
              ) : (
                <>
                  <div className="verifyEmail__cn__box__info__hdr">
                    <h6 className="verifyEmail__cn__box__info__hdr__ttl" data-testid="modal-title">
                      {title}
                    </h6>
                    <button
                      onClick={handleModalClose}
                      className="verifyEmail__cn__box__info__hdr__clsBtn"
                      data-testid="close-button"
                    >
                      <img width={22} height={22} src="/icons/close.svg" alt="close" />
                    </button>
                  </div>
                  <div className="verifyEmail__cn__box__info__errmsg">
                    <img width={16} height={16} src="/icons/warning-red.svg" alt="warn icon" />
                    <p className="verifyEmail__cn__box__info__errmsg__text" data-testid="error-message">
                      {errorMessage}
                    </p>
                  </div>
                  {description && (
                    <p className="verifyEmail__cn__box__info__text" data-testid="description-text">
                      {description}
                    </p>
                  )}
                  <div className="verifyEmail__cn__box__info__actions">
                    <button
                      onClick={handleModalClose}
                      className="verifyEmail__cn__box__info__actions__cls__btn"
                      data-testid="close-action-button"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </dialog>
      <style jsx>
        {`
          .verifyEmail {
            border-radius: 24px;
            border: none;
            width: 656px;
            min-height: 220px;
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
            display: flex;
            flex-direction: column;
            border-radius: 24px;
            /* Shadow/xl */
            box-shadow:
              0 10px 20px -5px rgba(14, 15, 17, 0.06),
              0 20px 65px -5px rgba(14, 15, 17, 0.06);
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
            min-height: 220px;
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
            right: 12px;
            top: 12px;
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

const WarningIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M29.6001 23.5112L18.6689 4.52746C18.3957 4.06237 18.0057 3.67673 17.5376 3.40879C17.0695 3.14084 16.5395 2.99988 16.0001 2.99988C15.4607 2.99988 14.9307 3.14084 14.4626 3.40879C13.9945 3.67673 13.6045 4.06237 13.3314 4.52746L2.40012 23.5112C2.13729 23.9611 1.99878 24.4727 1.99878 24.9937C1.99878 25.5147 2.13729 26.0264 2.40012 26.4762C2.66978 26.9441 3.05908 27.3318 3.52807 27.5996C3.99706 27.8674 4.52885 28.0056 5.06887 28H26.9314C27.471 28.0051 28.0022 27.8667 28.4707 27.599C28.9393 27.3312 29.3282 26.9437 29.5976 26.4762C29.8608 26.0266 29.9998 25.5151 30.0002 24.994C30.0007 24.473 29.8626 23.9613 29.6001 23.5112ZM15.0001 13C15.0001 12.7347 15.1055 12.4804 15.293 12.2929C15.4805 12.1053 15.7349 12 16.0001 12C16.2653 12 16.5197 12.1053 16.7072 12.2929C16.8948 12.4804 17.0001 12.7347 17.0001 13V18C17.0001 18.2652 16.8948 18.5195 16.7072 18.7071C16.5197 18.8946 16.2653 19 16.0001 19C15.7349 19 15.4805 18.8946 15.293 18.7071C15.1055 18.5195 15.0001 18.2652 15.0001 18V13ZM16.0001 24C15.7034 24 15.4134 23.912 15.1668 23.7472C14.9201 23.5823 14.7278 23.3481 14.6143 23.074C14.5008 22.7999 14.4711 22.4983 14.5289 22.2073C14.5868 21.9164 14.7297 21.6491 14.9395 21.4393C15.1492 21.2295 15.4165 21.0867 15.7075 21.0288C15.9985 20.9709 16.3001 21.0006 16.5741 21.1141C16.8482 21.2277 17.0825 21.4199 17.2473 21.6666C17.4121 21.9133 17.5001 22.2033 17.5001 22.5C17.5001 22.8978 17.3421 23.2793 17.0608 23.5606C16.7795 23.8419 16.3979 24 16.0001 24Z"
      fill="#1B4DFF"
    />
  </svg>
);

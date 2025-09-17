'use client';

import Image from 'next/image';

interface IAlertMessage {
  isMemberTab?: boolean;
  onClickClose?: () => void;
}

function AlertMessage({ isMemberTab = false, onClickClose = () => {} }: IAlertMessage) {
  const iconSize = isMemberTab ? 10 : 16;
  return (
    <>
      <div className="alert__message">
        <div className="alert__message__info">
          <Image
            src={`${isMemberTab ? '/icons/circle-yellow.svg' : '/icons/info-yellow.svg'}`}
            alt="info"
            height={iconSize}
            width={iconSize}
          />
          <p className={`alert__message__info__text`}>
            {isMemberTab
              ? 'Orange highlights indicate unsaved changes. Make sure you click Save changes!'
              : "Changes aren't saved automatically. Click 'Save changes' to keep your edits."}
          </p>
        </div>
        {isMemberTab && (
          <div className="alert__message__close">
            <Image alt="close" src="/icons/close.svg" height={16} width={16} onClick={onClickClose} />
          </div>
        )}
      </div>
      <style jsx>
        {`
          .alert__message {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background-color: #000000;
            border-top: 2px solid #ff820e;
            position: sticky;
            width: 100%;
            bottom: 55px;
            animation: slideUp 0.5s ease-out forwards;
            z-index: 3;
          }
          .alert__message__info {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .alert__message__info__text {
            color: #ffffff;
            font-size: 12px;
            line-height: 20px;
          }
          .alert__message__close {
            background: none;
            outline: none;
            border: none;
            cursor: pointer;
          }
          @media (min-width: 1024px) {
            .alert__message {
              bottom: 64px;
            }
          }
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
}

export default AlertMessage;

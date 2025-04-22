'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAGE_ROUTES } from '@/utils/constants';
const IntrosAiTrigger = (props: any) => {
  const member = props?.member;

  const router = useRouter();

  const [isOpen, setIsOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
    }, 500);
  };

  const handleTrigger = () => {
    setIsOpen(false);
    router.push(PAGE_ROUTES.INROS_AI);
  };

  return (
    <>
      {isOpen && (
        <div className={`notification-container ${isClosing ? 'closing' : ''}`}>
          <button className="notification-container__closebtn" onClick={handleClose}>
            <img src="/icons/close.svg" alt="intro-ai" />
          </button>

          <div className="notification-container__ttlsec">
            <img alt="processor" src="/icons/processor.svg" height={28} width={28} />
            <div className="notification-container__ttlsec__ttl">Book a warm intro with {member?.name}</div>
          </div>

          <div className="notification-container__descsec">
            Want to reach out to {member.name}? Send a personal note directly or request a warm introduction through someone in the network who knows them well.
          </div>

          <div className="notification-container__btnsec">
            <button className="notification-container__btnsec__closebtn" onClick={handleClose}>Close</button>

            <button className="notification-container__btnsec__triggerbtn" onClick={handleTrigger}>
              <div>Launch Intro AI</div>
              <img src="/icons/collab.svg" height={20} width={20} alt="collab" />
            </button>
          </div>
        </div>
      )}

      <style jsx>
        {`
          .notification-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 376px;
            height: auto;
            padding: 20px;
            border-radius: 8px;
            background: linear-gradient(white, white) padding-box, linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%) border-box;
            border: 2px solid transparent;
            z-index: 1;
            animation: slideIn 0.5s ease forwards;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .notification-container.closing {
            animation: slideOut 0.5s ease forwards;
          }

          .notification-container__closebtn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            cursor: pointer;
          }

          .notification-container__ttlsec {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .notification-container__ttlsec__ttl {
            font-weight: 600;
            font-size: 18px;
            line-height: 28px;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 80%;
          }

          .notification-container__descsec {
            font-weight: 400;
            font-size: 15px;
            line-height: 24px;
          }

          .notification-container__btnsec {
            display: flex;
            justify-content: end;
            gap: 12px;
          }

          .notification-container__btnsec__closebtn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 10px 28px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
          }

          .notification-container__btnsec__triggerbtn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 10px 28px;
            border-radius: 8px;
            background: #156ff7;
            display: flex;
            gap: 8px;
            align-items: center;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            color: white;
          }

          @keyframes slideIn {
            0% {
              opacity: 0;
              transform: translateX(100%);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideOut {
            0% {
              opacity: 1;
              transform: translateX(0);
            }
            100% {
              opacity: 0;
              transform: translateX(100%);
            }
          }
        `}
      </style>
    </>
  );
};

export default IntrosAiTrigger;

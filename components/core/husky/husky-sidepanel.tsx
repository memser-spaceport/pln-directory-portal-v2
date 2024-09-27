'use client';

import { useEffect, useState } from 'react';
import HuskyChat from './husky-ai';
import { usePathname } from 'next/navigation';

function HuskySidePanel() {
  const [isPanelOpen, setPanelStatus] = useState(false);
  const [isAvailable, setAvailability] = useState(false);
  const pathname = usePathname()

  const togglePanelStatus = () => {
    setPanelStatus((v) => !v);
  };

  useEffect(() => {
    const exclusions = ['/', '/settings']
    if(exclusions.includes(pathname)) {
      setAvailability(false)
      setPanelStatus(false)
    } else {
      setAvailability(true)
    }
  }, [pathname])

  return (
    <>
      {isAvailable && (
        <div className={`hsp ${isPanelOpen ? 'open' : ''}`}>
          <div className="hsp__cn">
            <div className="hsp__mheader">
              <img src='/images/husky-logo.png'/>
              <img src='/icons/close.svg' onClick={togglePanelStatus}/>
            </div>
            <div className="hsp__content">
               <HuskyChat isLoggedIn mode="chat" /> 
            </div>
          </div>
          <div onClick={togglePanelStatus} className="hsp__togglehead">
            <img src='/images/husky-logo-vertical.png'/>
          </div>
        </div>
      )}

      <style jsx>
        {`
          .hsp {
            display: flex;
            position: fixed;
            flex-direction: column;
            right: -100vw;
            top: 80px;
            bottom: 0;
            width: 100vw;
            height: calc(100svh - 81px);
            z-index: 4;
            transition: right 0.3s ease-in-out;
          }
          .hsp.open {
            right: 0;
          }
          .hsp__cn {
            width: 100vw;
            height: 100%;
            position: relative;
            background: white;
           
          }

          .hsp__togglehead {
            width: 46px;
            height: 140px;
            border: 1px solid black;
            position: absolute;
            display: flex;
            left: -47px;
            background: white;
            border-radius: 12px 0px 0px 12px ;
            z-index: 1;
            top: calc(50% - 70px);
            cursor: pointer;
            border: 1px solid #156FF7;
            border-right:0;
            padding: 16px 0;
            justify-content: center;
          }

          .hsp__mheader {
            height: 48px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
          }

          .hsp__content {
            height: calc(100% - 48px);
          }

          @media (min-width: 1024px) {
            .hsp {
              width: 636px;
              right: -636px;
            }
            .hsp.open {
              right: 0;
            }
            .hsp__cn {width: 634px; border-left: 1px solid #156FF7;}
            .hsp__mheader {display: none;}
            .hsp__content {height: 100%;}
          }
        `}
      </style>
    </>
  );
}

export default HuskySidePanel;

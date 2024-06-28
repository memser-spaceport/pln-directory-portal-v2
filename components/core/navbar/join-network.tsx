import { useRef, useState } from 'react';
import useClickedOutside from '@/hooks/useClickedOutside';
import { EVENTS, JOIN_NETWORK_MENUS, TOAST_MESSAGES } from '@/utils/constants';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function JoinNetwork() {
  const [isOpen, setIsOpen] = useState(false);

  const joinNetworkRef = useRef<HTMLDivElement | null>(null);
  const analytics = useCommonAnalytics();
  const router = useRouter();

  useClickedOutside({ callback: () => setIsOpen(false), ref: joinNetworkRef });

  const onJoinNetworkClick = () => {
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      setIsOpen(prev=>!prev);
      analytics.onNavJoinNetworkClicked(!isOpen);
    }
  };

  const onJoinNetworkListClick = (item: any) => {
    analytics.onNavJoinNetworkOptionClicked(item.name);
    if (item.key === 'member') {
      document.dispatchEvent(new CustomEvent(EVENTS.OPEN_MEMBER_REGISTER_DIALOG));
    } else if (item.key === 'team') {
      document.dispatchEvent(new CustomEvent(EVENTS.OPEN_TEAM_REGISTER_DIALOG));
    }
    setIsOpen(false);
  };

  return (
    <>
      <div className="jn" ref={joinNetworkRef} >
        <button className="jn__btn" onClick={onJoinNetworkClick}>
          <span className="jn__btn__txt">Join the network</span>
          <img loading="lazy" className="jn__btn__icon" src="/icons/dropdown-white.svg" alt="dropdown" />
        </button>
        {isOpen && (
          <ul className="jn__options">
            {JOIN_NETWORK_MENUS.map((item) => (
              <li key={item.name} className="jn__options__item" onClick={() => onJoinNetworkListClick(item)}>
                <div className="jn__options__item__cn">
                  <img loading="lazy" className="jn__options__item__cn__img" src={item.logo} alt={item.name} />
                  <span className="jn__options__item__cn__txt">{item.name}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <style jsx>{`
        .jn {
          position: relative;
        }

        .jn ul {
          list-style-type: none;
        }

        .jn__btn {
          display: flex;
          align-items: center;
          gap: 13px;
          cursor: pointer;
          color: white;
          padding: 8px 16px 8px 24px;
          border-radius: 100px;
          border-width: 0;
          background-image: linear-gradient(90deg, #427dff, #44d5bb);
        }

        .jn__btn:hover {
          box-shadow: 0 4px 4px 0 rgba(15, 23, 42, 0.04), 0 0 1px 0 rgba(15, 23, 42, 0.12), 0 0 0 2px rgba(21, 111, 247, 0.25);
          background: linear-gradient(71.47deg, #1a61ff 8.43%, #2cc3ae 87.45%);
        }

        .jn__btn__txt {
          font-weight: 600;
          font-size: 14px;
          line-height: 24px;
          text-overflow: clip;
          overflow: hidden;
          white-space: nowrap;
        }

        .jn__options {
          position: absolute;
          top: -100px;
          right: 0;
          width: 190px;
          background-color: #ffffff;
          box-shadow: 0px 2px 6px 0px #0F172A29;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
        }

        .jn__options__item__cn {
          padding: 10px;
          display: flex;
          gap: 8px;
          align-items: center;
          cursor: pointer;
          color: black;
        }

        .jn__options__item__cn:hover {
          background-color: #f1f5f9;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        @media (min-width: 1024px) {
          .jn__options {
            top: 50px;
            right: 0;
            width: 190px;
          }
          .jn__btn__txt {
            width: 31px;
          }
        }

        @media (min-width: 1280px) {
          .jn__btn__txt {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

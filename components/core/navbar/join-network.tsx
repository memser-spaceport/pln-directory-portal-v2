import { useRef, useState } from 'react';
import useClickedOutside from '@/hooks/useClickedOutside';
import { JOIN_NETWORK_MENUS, TOAST_MESSAGES } from '@/utils/constants';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function JoinNetwork() {
  const [isOpen, setIsOpen] = useState(false);

  const joinNetworkRef = useRef<HTMLUListElement | null>(null);
  const analytics = useCommonAnalytics();
  const router = useRouter();

  useClickedOutside({ callback: () => setIsOpen(false), ref: joinNetworkRef });

  const onJoinNetworkClick = () => {
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      analytics.onNavJoinNetworkClicked(!isOpen);
      setIsOpen(!isOpen);
    }
  };

  const onJoinNetworkListClick = (item) => {
    analytics.onNavJoinNetworkOptionClicked(item.name);
    if(item.key === 'member') {
      document.dispatchEvent(new CustomEvent('open-member-register-dialog'));
    } else if(item.key === 'team') {
      document.dispatchEvent(new CustomEvent('open-team-register-dialog'));
    }
    setIsOpen(false)
  };

  return (
    <>
      <div className="jn">
        <button className="jn__btn" onClick={onJoinNetworkClick}>
          <span className="jn__btn__txt">Join the Network</span>
          <img loading="lazy" className="jn__btn__icon" src="/icons/dropdown-white.svg" alt="dropdown" />
        </button>
        {isOpen && (
          <ul ref={joinNetworkRef} className="jn__options">
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

        .jn__btn__txt {
          font-weight: 600;
          font-size: 15px;
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
          box-shadow: 0 2px 8px 0 #0f172a;
          border-radius: 8px;
          padding: 4px 8px 4px 8px;
          display: flex;
          flex-direction: column;
        }

        .jn__options__item__cn {
          padding: 10px;
          display: flex;
          gap: 3px;
          align-items: center;
          cursor: pointer;
          color: black;
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

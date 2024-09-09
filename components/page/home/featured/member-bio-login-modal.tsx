import { useHomeAnalytics } from '@/analytics/home.analytics';
import Modal from '@/components/core/modal';
import { IMember } from '@/types/members.types';
import { getAnalyticsMemberInfo } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function MemberBioLoginModal() {
  const loginModalRef = useRef<HTMLDialogElement>(null);
  const analytics = useHomeAnalytics();
  const router = useRouter();

  const [member, setMember] = useState<IMember>();

  const onCloseModal = () => {
    if (loginModalRef.current) {
      loginModalRef.current.close();
    }
  };

  const onLoginClick = () => {
    onCloseModal();
    analytics.onFeaturedMemberBioPopupLoginBtnClicked(getAnalyticsMemberInfo(member));
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };

  useEffect(() => {
    async function handler(e: any) {
      const member = e?.detail?.member;
      setMember(member);
      if (loginModalRef.current) {
        loginModalRef?.current?.showModal();
      }
    }
    document.addEventListener(EVENTS.OPEN_MEMBER_BIO_LOGIN_POPUP, handler);
    return () => {
      document.removeEventListener(EVENTS.OPEN_MEMBER_BIO_LOGIN_POPUP, handler);
    };
  }, []);

  return (
    <>
      <Modal modalRef={loginModalRef} onClose={onCloseModal}>
        <div className="login-popup">
          <div className="login-popup__box">
            <h3 className="login-popup__box__title">Login to Access</h3>
            <p className="login-popup__box__desc">Please login to access details such as social profiles, projects & IRL Gatherings</p>
            <div className="login-popup__box__actions">
              <div className="login-popup__box__actions__left">
                <button type="button" onClick={onCloseModal} className="login-popup__box__actions__left__dismiss">
                  Cancel
                </button>
              </div>
              <div className="login-popup__box__actions__right">
                <button onClick={onLoginClick} className="login-popup__box__actions__right__login">
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <style jsx>
        {`
          .login-popup {
            width: 90vw;
            height: 100%;
          }

          .login-popup__box {
            background: white;
            border-radius: 12px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .login-popup__box__title {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
          }
          .login-popup__box__desc {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }
          .login-popup__box__actions {
            display: flex;
            flex-direction: column-reverse;
            gap: 8px;
          }

          .login-popup__box__actions__left__dismiss {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 24px;
            background: white;
            font-size: 14px;
            font-weight: 500;
            width: 100%;
          }
          .login-popup__box__actions__right {
            display: flex;
            gap: 8px;
            flex-direction: column;
          }
          
          .login-popup__box__actions__right__login {
            border-radius: 8px;
            padding: 10px 24px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
          }
          @media (min-width: 1024px) {
            .login-popup {
              width: 656px;
              height: 100%;
            }

            .login-popup__box__actions {
              display: flex;
              flex-direction: row;
              justify-content: end;
              gap: 10px;
            }

            .login-popup__box__actions__left__dismiss {
              width: unset;
            }

            .login-popup__box__actions__right {
              flex-direction: row;
            }
          }
        `}
      </style>
    </>
  );
}

export default MemberBioLoginModal;

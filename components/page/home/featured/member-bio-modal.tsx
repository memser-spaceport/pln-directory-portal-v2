import { useHomeAnalytics } from '@/analytics/home.analytics';
import Modal from '@/components/core/modal';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { EVENTS, PAGE_ROUTES } from '@/utils/constants';
import Cookies from 'js-cookie';
import { useEffect, useRef, useState } from 'react';

const MemberBioModal = () => {
  const [member, setMember] = useState<IMember>();
  const bioModalRef = useRef<HTMLDialogElement>(null);
  const analytics = useHomeAnalytics();

  const name = member?.name;
  const bio = member?.bio as string;

  // const onModalOpen = () => {
  //   if (bioModalRef.current) {
  //     bioModalRef.current.showModal();
  //   }
  // };

  const onCloseModal = () => {
    if (bioModalRef.current) {
      bioModalRef.current.close();
    }
  };

  const onMemberClick = (e: any) => {
    const userInfo = Cookies.get('userInfo') as IUserInfo;
    analytics.onMmeberBioPopupViewProfileBtnClicked({ ...getAnalyticsMemberInfo(member), bio }, getAnalyticsUserInfo(userInfo));
    window.open(`${PAGE_ROUTES.MEMBERS}/${member?.id}`);
    onCloseModal();
  };

  useEffect(() => {
    async function handler(e: any) {
      const member = e?.detail?.member;
      setMember(member);
      if (bioModalRef.current) {
        bioModalRef?.current?.showModal();
      }
    }
    document.addEventListener(EVENTS.OPEN_MEMBER_BIO_POPUP, handler);
    return () => {
      document.removeEventListener(EVENTS.OPEN_MEMBER_BIO_POPUP, handler);
    };
  }, []);

  return (
    <>
      <Modal modalRef={bioModalRef} onClose={onCloseModal}>
        <div className="bio">
          <div className="bio__hdr">
            <h1 className="bio__hdr__ttl">{`${name}'s Intro`}</h1>
          </div>
          <div className="bio__body">
            <div className="bio__body__content" dangerouslySetInnerHTML={{ __html: bio }} />
          </div>
          <div className="bio__ftr">
            <button onClick={onMemberClick} className="bio__ftr__viewProfileBtn">
              View Profile
            </button>
            <button onClick={onCloseModal} className="bio__ftr__closeBtn">
              Close
            </button>
          </div>
        </div>
      </Modal>
      <style jsx>{`
        .bio {
          width: 85vw;
          background: #ffffff;
          padding: 24px 12px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 85vh;
        }

        .bio__hdr {
        }

        .bio__hdr__ttl {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          text-align: left;
          color: #0f172a;
        }

        .bio__body {
          flex: 1;
          overflow: auto;
          padding-right: 12px;
        }

        .bio__body__content {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #0f172a;
        }

        .bio__ftr {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 10px 12px 10px 0px;
        }

        .bio__ftr__viewProfileBtn {
          box-shadow: 0px 1px 1px 0px #0f172a14;
          border: 1px solid #cbd5e1;
          background-color: #156ff7;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          border-radius: 8px;
          padding: 0px 24px;
        }

        .bio__ftr__closeBtn {
          box-shadow: 0px 1px 1px 0px #0f172a14;
          border: 1px solid #cbd5e1;
          background-color: #fff;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          color: #0f172a;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          border-radius: 8px;
          padding: 0px 24px;
        }

        @media (min-width: 1024px) {
          .bio {
            width: 656px;
          }

          .bio__ftr {
            flex-direction: row-reverse;
            justify-content: end;
            gap: 10px;
          }

          .bio__ftr__viewProfileBtn {
            width: unset;
          }

          .bio__ftr__closeBtn {
            width: unset;
          }
        }
      `}</style>
    </>
  );
};

export default MemberBioModal;

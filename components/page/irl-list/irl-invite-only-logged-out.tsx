import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { useRouter } from 'next/navigation';

interface IIrlInviteOnlyLoggedOut {
  onClose: () => void;
}

export function IrlInviteOnlyLoggedOut(props: IIrlInviteOnlyLoggedOut) {
  //props
  const onClose = props.onClose;

  //variables
  const analytics = useIrlAnalytics();
  const router = useRouter();

  //methods
  const handleModalClose = () => {
    onClose();
  };

  const handleLoginClick = () => {
    onClose();
    router.push(`${window.location.pathname}${window.location.search}#login`);
    analytics.irlRestrictionPopupLoginBtnClicked();
  };

  return (
    <>
      <div className="invonly__modal">
        <div className="invonly__modal__hdr">
          <h2 className="invonly__modal__hdr__ttl">Login to Access</h2>
        </div>
        <div className="invonly__modal__body">
          <p className="invonly__modal__body__cn">Please login to access this event.</p>
        </div>
        <div className="invonly__modal__ftr">
          <button onClick={handleModalClose} className="invonly__modal__ftr__cls__btn">
            Close
          </button>
          <button onClick={handleLoginClick} className="invonly__modal__ftr__log__btn">
            Login
          </button>
        </div>
      </div>

      <style jsx>
        {`
          .invonly__modal {
            padding: 24px;
            width: 90vw;
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: 180px;
            overflow: auto;
            border-radius: 12px;
            background: #fff;
            justify-content: space-between;
          }

          .invonly__modal__hdr__ttl {
            font-size: 24px;
            line-height: 32px;
            font-weight: 700;
            color: #0f172a;
          }

          .invonly__modal__body__cn {
            color: #0f172a;
          }

          .invonly__modal__ftr {
            display: flex;
            justify-content: end;
            gap: 8px;
          }

          .invonly__modal__ftr__cls__btn {
            height: 40px;
            width: 88px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #fff;
            border-radius: 8px;
            color: #0f172a;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
            border: 1px solid #cbd5e1;
          }

          .invonly__modal__ftr__log__btn {
            height: 40px;
            width: 88px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #156ff7;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
          }

          @media (min-width: 1024px) {
            .invonly__modal {
              width: 670px;
            }

            .invonly__modal__ftr {
              display: flex;
              justify-content: end;
            }

            .invonly__modal__ftr__cls__btn {
              width: 88px;
            }
          }
        `}
      </style>
    </>
  );
}

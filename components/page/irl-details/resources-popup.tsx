import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsEventInfo } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';

const ResourcesPopup = (props: any) => {
  const ResourceLink = props?.resourceLink;
  const resources = props?.allResources ?? [];
  const onResourceClick = props?.onResourceClick;
  const resourcesToShow = props?.resourcesToShow ?? [];
  const eventDetails = props?.eventDetails;
  const hasPrivateResources = resources.length > resourcesToShow?.length;

  const analytics = useIrlAnalytics();
  const router = useRouter();

  const onLogin = () => {
    analytics.resourcesPopupLoginClicked({ ...getAnalyticsEventInfo(eventDetails) });
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };

  return (
    <>
      <div className="resourcesModal">
        <div className="resourcesModal__ttl">
          <h6 className="resourcesModal__ttl__txt">Resources</h6>
          <span className="resourcesModal__ttl__count">({resources?.length})</span>
        </div>
        {hasPrivateResources && (
          <div className="resourcesModal__pvt">
            <div className="resourcesModal__pvt__strip">
              <img width={16} height={16} className="resourcesModal__pvt__strip__icon" src="/icons/info-orange.svg" alt="info" />
              <span>
                This list contains private links. Please{' '}
                <span onClick={onLogin} className="resourcesModal__pvt__strip__link">
                  login
                </span>
                {` `} to access
              </span>
            </div>
          </div>
        )}
        <div className="resourcesModal__items">
          {resourcesToShow?.map((item: any, index: number) => (
            <div key={`popup-resource-${index}`} className={`resourcesModal__items__item ${index !== resourcesToShow?.length - 1 ? 'divider' : ''}`}>
              <ResourceLink resource={item} onClick={onResourceClick} />
            </div>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          .resourcesModal {
            padding: 24px 16px 24px 24px;
            width: 320px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            max-height: 50vh;
            overflow: auto;
            border-radius: 12px;
            background: #fff;
          }

          .resourcesModal__ttl {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .resourcesModal__ttl__count {
            font-size: 14px;
            margin-top: 5px;
          }

          .resourcesModal__ttl__txt {
            line-height: 18px;
            font-weight: 700;
            font-size: 24px;
          }

          .resourcesModal__pvt {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: #ffe2c8;
            padding: 8px 20px;
            width: 100%;
          }

          .resourcesModal__items {
            display: flex;
            height: 100%;
            flex: 1;
            flex-direction: column;
            gap: 14px;
            overflow-y: auto;
            padding-right: 8px;
          }

          .divider {
            border-bottom: 1px solid #cbd5e1;
          }

          .resourcesModal__items__item {
            padding-bottom: 14px;
          }

          .resourcesModal__pvt__strip {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
            line-height: 18px;
            color: #000000;
          }

          .resourcesModal__pvt__strip__icon {
            margin-right: 4px;
            margin-top: -2px;
            display: inline;
          }

          .resourcesModal__pvt__strip__link {
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.25rem;
            color: #156ff7;
          }

          @media (min-width: 1024px) {
            .resourcesModal {
              width: 656px;
              max-height: 60vh;
            }
          }
        `}
      </style>
    </>
  );
};

export default ResourcesPopup;

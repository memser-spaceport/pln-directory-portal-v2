'use client';
import Image from 'next/image';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { useModalAnalytics } from '@/analytics/modal.analytics';
import {} from '@/types/shared.types';
interface IAnalyticsData {
  method: string;
  user: any;
  member: any;
}

export default function PopupTriggerIconButton({
  iconImgUrl,
  label,
  size,
  alt,
  triggerEvent,
  data,
  callback,
  analyticsData,
}: {
  iconImgUrl?: string;
  label?: string;
  size?: number;
  alt: string;
  triggerEvent: string;
  data: any;
  callback?: any;
  analyticsData?: IAnalyticsData;
}) {
  const analytics = useModalAnalytics();

  const handleClick = () => {
    document.dispatchEvent(new CustomEvent(triggerEvent, { detail: data }));
    if (callback) {
      callback();
    }
    if (analyticsData) {
      if (analyticsData?.method && typeof analytics[analyticsData.method as keyof typeof analytics] === 'function') {
        (analytics[analyticsData.method as keyof typeof analytics] as Function)(
          getAnalyticsUserInfo(analyticsData.user),
          getAnalyticsMemberInfo(analyticsData.member),
        );
      }
    }
  };

  return (
    <>
      <button className={'icon-button'} onClick={handleClick}>
        {iconImgUrl && <Image src={iconImgUrl} alt={alt} width={size} height={size} />}
        {label && <span className="icon-button__label">{label}</span>}
      </button>
      <style jsx>{`
        .icon-button {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .icon-button__label {
          color: #156ff7;
        }
      `}</style>
    </>
  );
}

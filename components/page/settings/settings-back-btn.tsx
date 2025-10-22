'use client';

import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';

function SettingsBackButton(props: any) {
  const title = props.title ?? '';
  const router = useRouter();

  const onBackClicked = () => {
    triggerLoader(true);
    document.dispatchEvent(new CustomEvent('settings-navigate', { detail: { url: '/settings' } }));
  };

  return (
    <>
      <div className="sb">
        <div className="sb__link" onClick={onBackClicked}>
          <img width="16px" height="16px" src="/icons/arrow-left-blue.svg" />
        </div>
        <p>{title}</p>
      </div>
      <style jsx>
        {`
          .sb {
            position: relative;
            width: 100%;
            height: 48px;
            background: #fff;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 12px;
            color: #475569;
            font-size: 18px;
            font-style: normal;
            font-weight: 500;
            line-height: 27px; /* 135% */
            letter-spacing: -0.4px;
          }
          .sb__link {
            display: flex;
            gap: 4px;
            font-size: 14px;
            font-weight: 500;
            color: #156ff7;
          }
        `}
      </style>
    </>
  );
}

export default SettingsBackButton;

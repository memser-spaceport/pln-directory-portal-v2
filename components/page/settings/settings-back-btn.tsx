'use client';

import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';

function SettingsBackButton(props: any) {
  const title = props.title ?? '';
  const router = useRouter();

  const onBackClicked = () => {
    triggerLoader(true)
    document.dispatchEvent(new CustomEvent('settings-navigate', {detail: {url: '/settings'}}))
  };

  return (
    <>
      <div className="sb">
        <div className='sb__link' onClick={onBackClicked}>
            <img width="16px" height="16px" src='/icons/arrow-left-blue.svg'/>
            <p>Back</p>
        </div>
        <p>{title}</p>
     
      </div>
      <style jsx>
        {`
          .sb {
            position: relative;
            width: 100%;
            height: 48px;
            background:#F1F5F9;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: #475569;
            font-weight: 500;
          }
          .sb__link {
            position:absolute;
            left: 16px;
            top: 16px;
            display: flex;
            gap: 4px;
            font-size: 14px;
            font-weight: 500;
            color: #156FF7;
          }
        `}
      </style>
    </>
  );
}

export default SettingsBackButton;

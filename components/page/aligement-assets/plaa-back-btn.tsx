'use client';

import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';

interface PlaaBackButtonProps {
  title?: string;
}

function PlaaBackButton({ title = '' }: PlaaBackButtonProps) {
  const router = useRouter();

  const onBackClicked = () => {
    triggerLoader(true);
    router.push('/alignment-assets');
  };

  return (
    <>
      <div className="pb">
        <div className="pb__link" onClick={onBackClicked}>
          <img width="16px" height="16px" src="/icons/arrow-left-blue.svg" alt="back" />
        </div>
        <p>{title}</p>
      </div>
      <style jsx>
        {`
          .pb {
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
            line-height: 27px;
            letter-spacing: -0.4px;
            border-bottom: 1px solid #e2e8f0;
          }
          .pb__link {
            display: flex;
            gap: 4px;
            font-size: 14px;
            font-weight: 500;
            color: #156ff7;
            cursor: pointer;
          }
        `}
      </style>
    </>
  );
}

export default PlaaBackButton;

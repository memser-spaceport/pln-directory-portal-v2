'use client';
import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function SettingsMobileHandler() {
  useEffect(() => {
    triggerLoader(false);
  }, []);
  return (
    <>
      <div></div>
    </>
  );
}

export default SettingsMobileHandler;

import React, { useEffect, useMemo, useRef } from 'react';
import { Tabs } from '@base-ui-components/react/tabs';

import { useForumCategories } from '@/services/forum/hooks/useForumCategories';
import s from './CategoriesTabs.module.scss';
import { CreatePost } from '@/components/page/forum/CreatePost';
import { useMedia } from 'react-use';
import { useRouter } from 'next/navigation';
import { useCheckGroupAccess } from '@/services/forum/hooks/useCheckGroupAccess';
import Link from 'next/link';
import { GROUPS_URL } from '@/utils/constants';

interface Props {
  value: string | undefined;
  onValueChange: (value: string, event?: Event) => void;
}

export const CategoriesTabs = ({ value, onValueChange }: Props) => {
  const router = useRouter();
  const isMobile = useMedia('(max-width: 960px)', false);
  const { data } = useForumCategories();
  const { data: groupAccess } = useCheckGroupAccess();

  const tabs = useMemo(() => {
    return (
      data?.reduce<{ label: string; value: string }[]>(
        (arr, item) => {
          arr.push({
            label: item.name,
            value: item.cid.toString(),
          });

          return arr;
        },
        [
          {
            label: 'All',
            value: '0',
          },
        ],
      ) ?? []
    );
  }, [data]);

  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!value || !isMobile) {
      return;
    }

    const current = tabRefs.current[value];
    if (current) {
      current.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [isMobile, value]);

  const hasGroupAccess = groupAccess?.hasAccess;

  return (
    <>
      <div className={s.root}>
        <Tabs.Root className={s.Tabs} value={value || '1'} onValueChange={onValueChange}>
          <Tabs.List className={s.List}>
            {tabs.map((item) => (
              // @ts-ignore
              <Tabs.Tab className={s.Tab} value={item.value} key={item.value} ref={(el) => (tabRefs.current[item.value] = el)}>
                {item.label}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator className={s.Indicator} />
          </Tabs.List>
        </Tabs.Root>
        <div className={s.actions}>
          {hasGroupAccess && (
            <Link className={s.groupLink} href={GROUPS_URL} target="_blank">
              Go to Groups <LinkIcon />
            </Link>
          )}
          <button className={s.triggerButton} onClick={() => router.push('/forum/posts/new')}>
            Create post <PlusIcon />
          </button>
        </div>
      </div>
      {hasGroupAccess && (
        <div className={s.groupLinkMobileContainer}>
          <div className={s.groupLinkMobile}>
            <div className={s.groupLinkMobileTitle}>Visit ProtoSphere Groups</div>
            <Link className={s.groupLink} href={GROUPS_URL} target="_blank">
              Go to Groups <LinkIcon />
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18.0312 10C18.0312 10.2238 17.9424 10.4384 17.7841 10.5966C17.6259 10.7549 17.4113 10.8438 17.1875 10.8438H11.8438V16.1875C11.8438 16.4113 11.7549 16.6259 11.5966 16.7841C11.4384 16.9424 11.2238 17.0312 11 17.0312C10.7762 17.0312 10.5616 16.9424 10.4034 16.7841C10.2451 16.6259 10.1562 16.4113 10.1562 16.1875V10.8438H4.8125C4.58872 10.8438 4.37411 10.7549 4.21588 10.5966C4.05764 10.4384 3.96875 10.2238 3.96875 10C3.96875 9.77622 4.05764 9.56161 4.21588 9.40338C4.37411 9.24514 4.58872 9.15625 4.8125 9.15625H10.1562V3.8125C10.1562 3.58872 10.2451 3.37411 10.4034 3.21588C10.5616 3.05764 10.7762 2.96875 11 2.96875C11.2238 2.96875 11.4384 3.05764 11.5966 3.21588C11.7549 3.37411 11.8438 3.58872 11.8438 3.8125V9.15625H17.1875C17.4113 9.15625 17.6259 9.24514 17.7841 9.40338C17.9424 9.56161 18.0312 9.77622 18.0312 10Z"
      fill="white"
    />
  </svg>
);

const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_4226_25993)">
      <path
        d="M17.0312 7.3125C17.0312 7.53628 16.9424 7.75089 16.7841 7.90912C16.6259 8.06736 16.4113 8.15625 16.1875 8.15625C15.9637 8.15625 15.7491 8.06736 15.5909 7.90912C15.4326 7.75089 15.3438 7.53628 15.3438 7.3125V4.85156L11.1595 9.03586C11.0009 9.19437 10.786 9.28342 10.5618 9.28342C10.3376 9.28342 10.1226 9.19437 9.96414 9.03586C9.80563 8.87735 9.71658 8.66237 9.71658 8.4382C9.71658 8.21404 9.80563 7.99906 9.96414 7.84055L14.1484 3.65625H11.6875C11.4637 3.65625 11.2491 3.56736 11.0909 3.40912C10.9326 3.25089 10.8438 3.03628 10.8438 2.8125C10.8438 2.58872 10.9326 2.37411 11.0909 2.21588C11.2491 2.05764 11.4637 1.96875 11.6875 1.96875H16.1875C16.4113 1.96875 16.6259 2.05764 16.7841 2.21588C16.9424 2.37411 17.0312 2.58872 17.0312 2.8125V7.3125ZM13.9375 9C13.7137 9 13.4991 9.0889 13.3409 9.24713C13.1826 9.40536 13.0938 9.61997 13.0938 9.84375V14.3438H4.65625V5.90625H9.15625C9.38003 5.90625 9.59464 5.81736 9.75287 5.65912C9.91111 5.50089 10 5.28628 10 5.0625C10 4.83872 9.91111 4.62411 9.75287 4.46588C9.59464 4.30764 9.38003 4.21875 9.15625 4.21875H4.375C4.00204 4.21875 3.64435 4.36691 3.38063 4.63063C3.11691 4.89435 2.96875 5.25204 2.96875 5.625V14.625C2.96875 14.998 3.11691 15.3556 3.38063 15.6194C3.64435 15.8831 4.00204 16.0312 4.375 16.0312H13.375C13.748 16.0312 14.1056 15.8831 14.3694 15.6194C14.6331 15.3556 14.7812 14.998 14.7812 14.625V9.84375C14.7812 9.61997 14.6924 9.40536 14.5341 9.24713C14.3759 9.0889 14.1613 9 13.9375 9Z"
        fill="#1B4DFF"
      />
    </g>
    <defs>
      <filter id="filter0_d_4226_25993" x="-1" y="-1" width="22" height="22" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4226_25993" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4226_25993" result="shape" />
      </filter>
    </defs>
  </svg>
);

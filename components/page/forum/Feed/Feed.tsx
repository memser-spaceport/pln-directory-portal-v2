'use client';

import React from 'react';
import { CategoriesTabs } from '@/components/page/forum/CategoriesTabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Posts } from '@/components/page/forum/Posts';

import s from './Feed.module.scss';
import { CreatePost } from '@/components/page/forum/CreatePost';

export const Feed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cid = searchParams.get('cid') as string;

  const onValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('cid', value); // or use `params.delete(key)` to remove
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={s.root}>
      <CategoriesTabs onValueChange={onValueChange} value={cid} />
      <Posts cid={cid} />
      <CreatePost />
    </div>
  );
};

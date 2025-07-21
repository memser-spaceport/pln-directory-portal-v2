'use client';

import React from 'react';
import { PostsTopics } from '@/components/page/forum/PostsTopics';
import { useRouter, useSearchParams } from 'next/navigation';
import { Posts } from '@/components/page/forum/Posts';

import s from './PostsList.module.scss';
import { CreatePost } from '@/components/page/forum/CreatePost';

export const PostsList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic') as string;

  const onValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('topic', value); // or use `params.delete(key)` to remove
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={s.root}>
      <PostsTopics onValueChange={onValueChange} value={topic} />
      <Posts activeTopic={topic} />
      <CreatePost />
    </div>
  );
};

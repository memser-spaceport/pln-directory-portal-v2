import React from 'react';
import { Post } from '@/components/page/forum/Post';
import { ForumAccessGate } from '@/components/page/forum/ForumAccessGate/ForumAccessGate';

const PostPage = async () => {
  return (
    <ForumAccessGate>
      <Post />
    </ForumAccessGate>
  );
};

export default PostPage;

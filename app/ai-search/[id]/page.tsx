import type { Metadata } from 'next';

import { Chat } from '@/components/page/husky/Chat';
import { AiSearchThreadBody } from '@/components/page/husky/AiSearchThreadBody/AiSearchThreadBody';
import styles from './page.module.css';
import { getHuskyThreadById } from '@/services/husky.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * LAB-3457: a thread page is a member's own chat (or a guest's shared link), never a page for search engines. Only
 * the robots rule: the title and the share image stay the layout's.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const { isLoggedIn, authToken } = await getCookiesFromHeaders();
  const { thread, isError } = await getPageData(id, authToken);

  // LAB-3457: signed out, AI search has the only say. Signed in, a member inside the agent gate opens their own thread
  // on the agent (T2), which also knows agent threads that AI search hides. Someone else's shared link, and a chat
  // the member started as a guest, keep today's page; so does a thread T2 does not know.
  if (isError && !isLoggedIn) {
    return notFound();
  }

  const guestUserId = thread?.guestUserId;
  const cookieStore = await cookies();
  const guestIdCookie = cookieStore.get('guestId')?.value;
  const isOwnThread = thread?.isOwner || (guestIdCookie && guestIdCookie === guestUserId);

  const threadOwner = {
    name: thread?.name,
    image: thread?.image,
  };

  const today = isError ? null : (
    <Chat
      id={id}
      isLoggedIn={isLoggedIn}
      initialMessages={thread?.chats ?? []}
      isOwnThread={isOwnThread}
      threadOwner={threadOwner}
      title={thread?.title}
      from="detail"
    />
  );

  return (
    <div className={styles.husky}>
      {isLoggedIn ? (
        <AiSearchThreadBody threadId={id} fallback={today} ownedByMember={!isError && thread?.isOwner === true} />
      ) : (
        today
      )}
    </div>
  );
}

const getPageData = async (id: string, authToken: string) => {
  let isError = false;
  const thread = await getHuskyThreadById(id, authToken);
  if (thread.isError) {
    isError = true;
  }
  return { thread, isError };
};

import Chat from '@/components/page/husky/chat';
import styles from './page.module.css';
import { getHuskyThreadById } from '@/services/husky.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import ChatHeader from '@/components/page/husky/chat-header';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const { isLoggedIn, userInfo, authToken } = getCookiesFromHeaders();
  const { thread, isError } = await getPageData(id, authToken);

  if (isError) {
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

  return (
    <div className={styles.husky}>
      {isLoggedIn && <ChatHeader showActions={isOwnThread} title={thread?.title} />}
      <Chat id={id} isLoggedIn={isLoggedIn} userInfo={userInfo} initialMessages={thread?.chats ?? []} isOwnThread={isOwnThread} threadOwner={threadOwner} from="detail" />
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

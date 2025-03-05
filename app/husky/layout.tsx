import { SidebarProvider } from '@/components/page/husky/sidebar';
import { cookies } from 'next/headers';
import AppSidebar from '@/components/page/husky/app-sidebar';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const { isLoggedIn } = getCookiesFromHeaders();

  return (
    <>
      <SidebarProvider defaultOpen={!isCollapsed}>
        {isLoggedIn && <AppSidebar isLoggedIn={isLoggedIn} />}
        {children}
      </SidebarProvider>
    </>
  );
}

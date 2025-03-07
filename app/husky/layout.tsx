import { SidebarProvider } from '@/components/page/husky/sidebar';
import AppSidebar from '@/components/page/husky/app-sidebar';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = getCookiesFromHeaders();

  return (
    <>
      <SidebarProvider defaultOpen={true}>
        {isLoggedIn && <AppSidebar isLoggedIn={isLoggedIn} />}
        {children}
      </SidebarProvider>
    </>
  );
}

import { SidebarProvider } from '@/components/page/husky/sidebar';
import AppSidebar from '@/components/page/husky/app-sidebar';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';

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

export const metadata: Metadata = {
  title: 'Husky | Protocol Labs Directory',
  description: 'Husky interaction page for Protocol Labs Directory',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};

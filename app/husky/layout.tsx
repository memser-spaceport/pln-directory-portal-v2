import AppSidebar from '@/components/page/husky/app-sidebar';
import IntroSidebarContainer from '@/components/page/husky/intro/intro-sidebar-container';
import { SidebarProvider } from '@/components/page/husky/sidebar';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {

  return (
    <>
      {children}
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

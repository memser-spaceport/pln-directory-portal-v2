import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/core/navbar/nav-bar';
import './globals.css';
import StyledJsxRegistry from '../providers/registry';
import { Suspense } from 'react';
import { PostHogPageview } from '@/providers/analytics-provider';
import { IUserInfo } from '@/types/shared.types';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Protocol Labs Network',
  description: 'The Protocol Labs Network drives breakthroughs in computing to push humanity forward.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: `https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Network',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`],
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn: boolean = true;
  const userInfo: IUserInfo = {
    isFirstTimeLogin: false,
    name: 'john',
    email: 'john@yopmail.com',
    profileImageUrl: '',
    uid: '',
    roles: [],
    leadingTeams: [],
  };
  return (
    <html>
      <body className={`${inter.className} layout`}>
        <Suspense>
          <PostHogPageview />
        </Suspense>
        <StyledJsxRegistry>
          <header className="layout__header">
            <Navbar isLoggedIn={isLoggedIn} userInfo={userInfo} />
          </header>
          <main className="layout__main">{children}</main>
          {/* <Loader/> */}
          <ToastContainer
            position="top-right"
            theme="dark"
            bodyClassName="layout__toast__body"
            className="layout__toast__class"
            toastClassName="layout__toast__toaster"
            progressClassName="layout__toast_progress"
          />
        </StyledJsxRegistry>
      </body>
    </html>
  );
}

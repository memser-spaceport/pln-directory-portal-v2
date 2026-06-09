import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../../styles/globals.scss';

const inter = localFont({
  src: [
    {
      path: '../../public/fonts/InterVariable.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'PL Design System',
  description: 'Protocol Labs Design System — components and tokens from Figma',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

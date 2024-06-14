import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StyledJsxRegistry from "./registry";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: 'Protocol Labs Network',
  description:
    'The Protocol Labs Network drives breakthroughs in computing to push humanity forward.',
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
    images:  [`https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`]

  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body className={inter.className}>
        <StyledJsxRegistry>{children}</StyledJsxRegistry>
      </body>
    </html>
  )
}

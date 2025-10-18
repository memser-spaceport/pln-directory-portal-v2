import { DemoDayPage } from './DemoDayPage';

export function generateMetadata() {
  return {
    openGraph: {
      images: [
        {
          url: '/images/demo-day/demoday.jpeg',
        },
      ],
    },
    twitter: {
      images: ['/images/demo-day/demoday.jpeg'],
    },
  };
}

export default function Page() {
  return <DemoDayPage />;
}

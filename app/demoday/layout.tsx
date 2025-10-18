import { PropsWithChildren } from 'react';

export const metadata = {
  openGraph: {
    images: ['/images/demo-day/demoday.jpeg'],
  },
  twitter: {
    images: ['/images/demo-day/demoday.jpeg'],
  },
};

export default (props: PropsWithChildren) => {
  const { children } = props;

  return children;
};

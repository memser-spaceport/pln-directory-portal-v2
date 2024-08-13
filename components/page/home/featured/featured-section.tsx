'use server';

import { getFeaturedData } from '@/services/home.service';

export default async function FeaturedSection(props: any) {
  const data = await getFeaturedData();

  console.log('data', data)

  return <></>;
}

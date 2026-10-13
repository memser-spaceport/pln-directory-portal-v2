import { getCookiesFromHeaders } from '@/utils/next-helpers';

import FiltersContent from './FiltersContent';

export default async function Page() {
  const { isLoggedIn } = await getCookiesFromHeaders();
  return <FiltersContent isLoggedIn={Boolean(isLoggedIn)} />;
}

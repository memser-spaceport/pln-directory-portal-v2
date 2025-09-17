import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const useUpdateQueryParams = () => {
  const router = useRouter();

  const updateQueryParams = (key: string, value: string, searchParams: any) => {
    const current = new URLSearchParams(Object.entries(searchParams));
    console.log(`in updateQueryParams: ${key}, ${value}, ${searchParams}`);
    if (!value) {
      current.delete(key);
    } else {
      current.set(key, value);
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${window.location.pathname}/${query}`);
    // router.refresh();
  };

  return { updateQueryParams };
};

export default useUpdateQueryParams;

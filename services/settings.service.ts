import { getHeader } from "@/utils/common.utils";

export const getData = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/admin/participants-request`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });
  if (!response?.ok) {
    return { error: { status: response?.status, statusText: response?.statusText } };
  }
  const result = await response?.json();
  return { data: result };
};

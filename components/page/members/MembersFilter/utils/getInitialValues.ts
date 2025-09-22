import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';

export const getInitialValues = (params: URLSearchParams, paramKey: string) => {
  const paramValue = params.get(paramKey);
  if (!paramValue) return [];

  return paramValue.split(URL_QUERY_VALUE_SEPARATOR).map((value) => ({
    value: value.trim(),
    label: value.trim(),
  }));
};

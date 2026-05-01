import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';

const WORKPLACE_TYPE_PARAM = 'workplaceType';

function collectParamValues(searchParams: URLSearchParams, key: string): string[] {
  const parts: string[] = [];
  for (const raw of searchParams.getAll(key)) {
    if (raw) parts.push(...raw.split(URL_QUERY_VALUE_SEPARATOR).filter(Boolean));
  }
  return [...new Set(parts)];
}

export function workplaceTypesToWorkModes(types: string[]): string[] {
  const out: string[] = [];
  for (const t of types) {
    if (t === 'remote') {
      out.push('remote', 'distributed');
    } else if (t === 'hybrid' || t === 'in-office') {
      out.push(t);
    }
  }
  return [...new Set(out)];
}

/** Maps browser job board params to the Directory API query string (expands workplace → workMode). */
export function jobsBrowserSearchParamsToApiQuery(searchParams: URLSearchParams): string {
  const api = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key === WORKPLACE_TYPE_PARAM) continue;
    api.append(key, value);
  }
  for (const wm of workplaceTypesToWorkModes(collectParamValues(searchParams, WORKPLACE_TYPE_PARAM))) {
    api.append('workMode', wm);
  }
  return api.toString();
}

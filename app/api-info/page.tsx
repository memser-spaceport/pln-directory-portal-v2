import { Metadata } from 'next';

import ApiInfo from '@/components/page/api-info/api-info';
import { getApiInfo } from '@/utils/api-info.utils';

/**
 * Public, unauthenticated page that exposes basic service metadata.
 * Rendered dynamically so the reported timestamp is always current.
 */
export const dynamic = 'force-dynamic';

export default function ApiInfoPage() {
  return <ApiInfo info={getApiInfo()} />;
}

export const metadata: Metadata = {
  title: 'API Info | Protocol Labs Directory',
  description: 'Basic service information for the Protocol Labs Directory frontend.',
  robots: {
    index: false,
    follow: false,
  },
};

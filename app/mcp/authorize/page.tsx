import { Suspense } from 'react';

import { McpAuthorizePage } from '@/components/page/mcp/McpAuthorizePage';

export default function Page() {
  return (
    <Suspense>
      <McpAuthorizePage />
    </Suspense>
  );
}

import { RBACPrototypePage } from '@/components/page/rbac-v1-prototype/RBACPrototypePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RBAC V1 Prototype · LabOS',
};

export default function Page() {
  return <RBACPrototypePage />;
}

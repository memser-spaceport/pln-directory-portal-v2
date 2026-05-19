'use client';

import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';

export default function InvestorsAdminPage() {
  const access = useInvestorsAccess();

  if (access.isLoading) {
    return null;
  }

  if (!access.canEdit) {
    return (
      <main style={{ padding: 32 }}>
        <p style={{ color: '#b91c1c', fontSize: 14 }}>You do not have permission to view this page.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>Investor DB · Admin</h1>
      <p style={{ marginTop: 8, color: '#455468' }}>
        Admin tooling will live here (bulk import, source toggles, RBAC overrides). Coming soon.
      </p>
    </main>
  );
}

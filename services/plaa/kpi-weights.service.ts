export interface KpiWeightEntry {
  category: string;
  weight: number | null;
  percentOfTotal: number | null;
  emissionsPerSnapshot: number | null;
}

export interface KpiWeightsResponse {
  items: KpiWeightEntry[];
}

export const getKpiWeights = async (): Promise<{
  data?: KpiWeightsResponse;
  error?: { message: string };
}> => {
  try {
    const response = await fetch(`${process.env.PLAA_API_URL}/api/v1/kpi-weights`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { error: { message: `API responded with ${response.status}: ${response.statusText}` } };
    }

    const data: KpiWeightsResponse = await response.json();
    return { data };
  } catch (error) {
    console.error('[kpi-weights.service] Failed to fetch KPI weights:', error);
    return { error: { message: 'Failed to fetch KPI weights' } };
  }
};

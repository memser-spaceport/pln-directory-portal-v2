import React from 'react';
import FAQsPage from '@/components/page/aligement-assets/faqs/faqs';
import { getKpiWeights } from '@/services/plaa/kpi-weights.service';

const page = async () => {
  const { data } = await getKpiWeights();
  return (
    <FAQsPage kpiWeights={data?.items} />
  );
};

export default page;

import DealDetailContent from './DealDetailContent';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <DealDetailContent id={params.id} />;
}

import DealDetailContent from './DealDetailContent';

export default function Page({ params }: { params: { id: string } }) {
  return <DealDetailContent id={params.id} />;
}

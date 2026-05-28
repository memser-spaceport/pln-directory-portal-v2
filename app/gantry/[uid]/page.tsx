import { GantryDetailPage } from '@/components/page/gantry/GantryDetailPage';

export default async function GantryDetailRoute(props: { params: Promise<{ uid: string }> }) {
  const { uid } = await props.params;
  return <GantryDetailPage uid={uid} />;
}

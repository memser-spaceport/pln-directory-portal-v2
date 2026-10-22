import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ItemDetailContainer from '@/components/page/aligement-assets/feedback/item-detail-container';
import { isFeedbackBoardEnabled } from '@/components/page/aligement-assets/feedback/feedback.utils';

export const metadata: Metadata = {
  title: 'Feedback | PL Alignment Asset',
};

/** Shareable item page. The id is a UUID — §5 keeps member data out of URLs. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!isFeedbackBoardEnabled()) {
    notFound();
  }
  const { id } = await params;
  return <ItemDetailContainer id={id} />;
}

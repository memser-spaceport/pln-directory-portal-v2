'use client';

import CreateArticle from '@/components/page/founder-guides/CreateArticle/CreateArticle';
import { FounderGuidesEditGuard } from '@/components/page/founder-guides/FounderGuidesEditGuard';

interface Props {
  params: { slug: string };
}

export default function EditArticlePage({ params }: Props) {
  return (
    <FounderGuidesEditGuard slug={params.slug}>
      {(article) => <CreateArticle article={article} isEditMode />}
    </FounderGuidesEditGuard>
  );
}

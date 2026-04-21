'use client';;
import { use } from "react";

import CreateArticle from '@/components/page/founder-guides/CreateArticle/CreateArticle';
import { FounderGuidesEditGuard } from '@/components/page/founder-guides/FounderGuidesEditGuard';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function EditArticlePage(props: Props) {
  const params = use(props.params);
  return (
    <FounderGuidesEditGuard slug={params.slug}>
      {(article) => <CreateArticle article={article} isEditMode />}
    </FounderGuidesEditGuard>
  );
}

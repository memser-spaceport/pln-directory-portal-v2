import CreateArticle from '@/components/page/founder-guides/CreateArticle/CreateArticle';
import { FounderGuidesCreateGuard } from '@/components/page/founder-guides/FounderGuidesCreateGuard/FounderGuidesCreateGuard';

export default function NewArticlePage() {
  return (
    <FounderGuidesCreateGuard>
      <CreateArticle />
    </FounderGuidesCreateGuard>
  );
}

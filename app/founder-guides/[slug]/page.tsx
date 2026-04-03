import ArticleContent from '@/components/page/founder-guides/ArticleContent/ArticleContent';

interface Props {
  params: { slug: string };
}

export default function ArticlePage({ params }: Props) {
  return <ArticleContent slug={params.slug} />;
}

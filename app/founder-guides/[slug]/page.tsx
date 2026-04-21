import ArticleContent from '@/components/page/founder-guides/ArticleContent/ArticleContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage(props: Props) {
  const params = await props.params;
  return <ArticleContent slug={params.slug} />;
}

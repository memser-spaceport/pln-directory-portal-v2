import React from 'react';
import { notFound } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getArticleBySlug, getAllSlugs } from '@/utils/knowledge-base.utils';
import { getMemberInfo } from '@/services/members.service';
import { KnowledgeBaseArticlePage } from '@/components/page/knowledge-base/KnowledgeBaseArticlePage';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} | Knowledge Base | Protocol Labs`,
    description: article.summary,
  };
}

const ArticlePage = async ({ params }: Props) => {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const { isLoggedIn, userInfo } = getCookiesFromHeaders();

  // Try to fetch the live office hours URL from the author's member profile
  let liveOfficeHoursUrl: string | null = article.authorOfficeHoursUrl;
  if (article.authorUid) {
    try {
      const memberResult = await getMemberInfo(article.authorUid);
      if (memberResult && !('isError' in memberResult) && (memberResult as any).data?.officeHours) {
        liveOfficeHoursUrl = (memberResult as any).data.officeHours;
      }
    } catch {
      // Fall back to frontmatter value
    }
  }

  return (
    <KnowledgeBaseArticlePage
      article={article}
      liveOfficeHoursUrl={liveOfficeHoursUrl}
      userInfo={userInfo}
      isLoggedIn={isLoggedIn}
    />
  );
};

export default ArticlePage;

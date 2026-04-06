import * as yup from 'yup';
import { IArticle } from '@/types/articles.types';
import { ARTICLE_CATEGORIES } from '@/services/articles/constants';

export const createArticleSchema = yup.object().shape({
  category: yup.object().required('Category is required'),
  title: yup.string().max(255, 'Title exceeds 255 characters. Please shorten.').required('Title is required'),
  summary: yup.string().max(100, 'Max 100 characters.').required('Summary is required'),
  readingTime: yup
    .number()
    .typeError('Must be a positive number.')
    .transform((value, original) => (original === '' || original == null ? undefined : value))
    .min(1, 'Must be a positive number.')
    .max(999, 'Max 999 minutes.')
    .required('Reading time is required'),
  content: yup
    .string()
    .test({
      name: 'maxTextLength',
      message: 'Content exceeds 60,000 characters.',
      test: function (value) {
        if (!value) return true;
        return value.length <= 60000;
      },
    })
    .required('Content is required'),
  author: yup.object().required('Author is required'),
  officeHours: yup
    .string()
    .nullable()
    .when('author', {
      is: (author: any) => author?.type === 'team',
      then: (schema) => schema.required('Office Hours link is required').url('Must be a valid URL'),
      otherwise: (schema) => schema.optional(),
    }),
});

export type CreateArticleForm = {
  category: { label: string; value: string } | null;
  title: string;
  summary: string;
  readingTime: number | null;
  content: string;
  author: { label: string; value: string; type: 'member' | 'team' } | null;
  officeHours: string;
};

export function articleToFormValues(article: IArticle): CreateArticleForm {
  const categoryOption = article.category
    ? {
        label: (ARTICLE_CATEGORIES as readonly string[]).includes(article.category)
          ? article.category
          : article.category,
        value: article.category,
      }
    : null;

  let author: CreateArticleForm['author'] = null;
  if (article.authorMember) {
    author = { label: article.authorMember.name, value: article.authorMember.uid, type: 'member' };
  } else if (article.authorTeam) {
    author = { label: article.authorTeam.name, value: article.authorTeam.uid, type: 'team' };
  }

  return {
    category: categoryOption,
    title: article.title || '',
    summary: article.summary || '',
    readingTime: article.readingTime || null,
    content: article.content || '',
    author,
    officeHours: article.authorTeam?.officeHours || '',
  };
}

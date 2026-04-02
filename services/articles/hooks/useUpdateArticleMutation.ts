import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer';
import { ArticlesQueryKeys } from '@/services/articles/constants';

type UpdateArticlePayload = {
  uid: string;
  isAdmin?: boolean;
  title: string;
  summary?: string;
  category: string;
  content: string;
  authorMemberUid?: string;
  authorTeamUid?: string;
  readingTime?: number;
  officeHoursUrl?: string;
  status: 'PUBLISHED';
};

async function mutation(payload: UpdateArticlePayload) {
  const { authToken } = getCookiesFromClient();
  const { uid, isAdmin, ...rest } = payload;

  if (isAdmin) {
    const url = `${process.env.DIRECTORY_API_URL}/v1/admin/articles/${uid}`;
    const body = {
      title: rest.title,
      summary: rest.summary,
      category: rest.category,
      content: rest.content,
      authorMemberUid: rest.authorMemberUid,
      authorTeamUid: rest.authorTeamUid,
      officeHours: rest.officeHoursUrl || null,
      status: rest.status,
    };

    const response = await customFetch(
      url,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      },
      true,
    );

    if (response?.ok) {
      toast.success('Guide updated successfully!');
      return await response.json();
    } else {
      toast.error('Something went wrong!');
      return null;
    }
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/articles/${uid}`;
  const { officeHoursUrl, ...body } = rest;

  const response = await customFetch(
    url,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ ...body, officeHoursUrl }),
    },
    true,
  );

  if (response?.ok) {
    toast.success('Guide updated successfully!');
    return await response.json();
  } else {
    toast.error('Something went wrong!');
    return null;
  }
}

export function useUpdateArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ArticlesQueryKeys.ARTICLES_LIST],
      });
    },
  });
}

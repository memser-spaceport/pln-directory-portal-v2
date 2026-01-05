import { ADMIN_ROLE } from '@/utils/constants';

import { toast } from '@/components/core/ToastContainer';
import { replaceImagesWithMarkdown } from '@/utils/decode';
import { getCookiesFromClient } from '@/utils/third-party.helper';

import { useForumAnalytics } from '@/analytics/forum.analytics';
import { EditPostMutationParams, useEditPost } from '@/services/forum/hooks/useEditPost';
import { usePostComment } from '@/services/forum/hooks/usePostComment';
import { useUpdateMemberNotificationSettings } from '@/services/notifications/hooks/useUpdateMemberNotificationSettings';

interface Input {
  tid: number;
  toPid: number;
  isEdit?: boolean;
  itemUid?: string;
  timestamp: number;
  reset: () => void;
  onSubmit?: () => void;
  setFocused: (focused: boolean) => void;
}

export function useSubmitComment(input: Input) {
  const { tid, toPid, isEdit, itemUid, timestamp, reset, onSubmit, setFocused } = input;

  const { userInfo } = getCookiesFromClient();

  const { mutateAsync } = usePostComment();
  const { mutateAsync: editPost } = useEditPost();
  const analytics = useForumAnalytics();
  const { mutateAsync: updateNotificationSettings } = useUpdateMemberNotificationSettings();

  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));

  const onSubmitComment = async (data: any) => {
    try {
      const content = replaceImagesWithMarkdown(data.comment);

      await updateNotificationSettings({
        itemType: 'POST_COMMENT',
        contextId: tid,
        uid: userInfo.uid,
        payload: {
          enabled: data.emailMe,
        },
      });

      let res;

      if (isEdit) {
        const payload: EditPostMutationParams = {
          pid: toPid,
          title: '',
          content,
        };

        if (itemUid) {
          payload.uid = isAdmin ? itemUid : null;
        }

        res = await editPost(payload);
      } else {
        const payload = {
          tid,
          toPid,
          content,
        };
        analytics.onPostCommentSubmit({ ...payload, timeSincePostCreation: Date.now() - timestamp });
        res = await mutateAsync(payload);
      }

      if (res?.status?.code === 'ok') {
        reset();
        setFocused(false);
        onSubmit?.();

        const message = isEdit ? 'Your comment has been updated' : 'Comment added successfully';
        toast.success(message);
      }
    } catch (e) {
      // @ts-ignore
      toast.error(e.message);
    }
  };

  return onSubmitComment;
}

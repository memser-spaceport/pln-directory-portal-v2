'use client';

import { usePathname } from 'next/navigation';

import { CommentLayer } from './comments/CommentLayer';
import { useAppComments, type Viewer } from './comments/useAppComments';

/** Stand-in for the signed-in member; the entries using the shared navbar are mocked. */
const MOCK_VIEWER: Viewer = { uid: 'm-1', name: 'Polina Bublii' };

interface Props {
  active: boolean;
  onExit: () => void;
}

/**
 * Comment mode on the page you are standing on — what the header's feedback
 * door switches on. It is the AI app's `CommentLayer` with no frame: the same
 * outline, pin, captured element and thread, hit-testing the directory's own
 * DOM. Here there is no cross-origin wall, so unlike the AI-app case this is
 * how it would run in production too.
 *
 * Comments are kept per route (sessionStorage standing in for the feedback
 * API), and a member sees their own pins: page feedback goes to the LabOS team,
 * not to the other people reading the page.
 */
export function PageCommentMode({ active, onExit }: Props) {
  const pathname = usePathname() ?? 'unknown';
  const store = useAppComments(`page:${pathname}`, MOCK_VIEWER);

  return (
    <CommentLayer
      active={active}
      onExit={onExit}
      viewer={MOCK_VIEWER}
      canManage={false}
      store={store}
      audienceNote="Goes to the LabOS team"
    />
  );
}

interface Input {
  hasAccess: boolean;
  isPostsTab: boolean;
  isLoggedOut: boolean;
}

export function getLabels(input: Input) {
  const { hasAccess, isPostsTab, isLoggedOut } = input;

  if (isLoggedOut) {
    return {
      title: 'Sign in to view forum activity',
      description: 'See John’s posts and comments on the PL Forum and follow discussions across the network.',
    };
  }

  if (!isLoggedOut && !hasAccess) {
    return {
      title: 'Forum access restricted',
      description: 'Your current access level doesn’t include Forum privileges.',
    };
  }

  if (isPostsTab) {
    return {
      title: 'No posts yet',
      description: 'You haven’t started any forum threads yet.',
    };
  }

  return {
    title: 'No comments yet',
    description:
      'Jump into the conversation by replying to posts across the forum.\nYour perspective helps move discussions forward.',
  };
}

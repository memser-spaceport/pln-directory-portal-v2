// sessionStorage handoff used when an unauth visitor clicks Discuss or Join
// discussion: stash the target URL, trigger the login modal, and a post-login
// effect on /home (NewsLoginRedirect) reads the key and pushes them through.
// One shared key covers both affordances — last click wins.
export const NEWS_JOIN_DISCUSSION_PENDING_KEY = 'teamNewsJoinDiscussion:pendingTarget';

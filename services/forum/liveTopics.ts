/**
 * A NodeBB topic list as members see it: soft-deleted topics left out.
 *
 * NodeBB keeps a deleted topic in its category lists for everyone, with its title swapped for the untranslated key
 * `[[topic:topic-is-deleted]]`, and keeps it in `/api/recent` for its author and moderators. The Directory has no
 * deleted-topic view, so it drops them itself. An agent deleting a thread's only post (`delete_forum_post`,
 * LAB-3145) otherwise leaves a "[[topic:topic-is-deleted]]" card in the forum.
 */
export function liveTopics<T extends { deleted?: unknown }>(
  topics: readonly (T | null | undefined)[] | null | undefined,
): T[] {
  if (!Array.isArray(topics)) return [];
  return topics.filter((topic): topic is T => Boolean(topic) && !Number((topic as T).deleted));
}

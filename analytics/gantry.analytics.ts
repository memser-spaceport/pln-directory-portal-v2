import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

export const GANTRY_EVENTS = {
  IDEA_CREATED: 'gantry_idea_created',
  IDEA_UPDATED: 'gantry_idea_updated',
  IDEA_ARCHIVED: 'gantry_idea_archived',
  ITEM_UPVOTED: 'gantry_item_upvoted',
  ITEM_UPVOTE_REMOVED: 'gantry_item_upvote_removed',
  IDEA_PROMOTED: 'gantry_idea_promoted',
  IDEA_DECLINED: 'gantry_idea_declined',
  ROADMAP_STATUS_CHANGED: 'gantry_roadmap_status_changed',
  IDEAS_VIEWED: 'gantry_ideas_viewed',
  ROADMAP_VIEWED: 'gantry_roadmap_viewed',
  BUILD_BUTTON_CLICKED: 'gantry_build_button_clicked',
  TAGS_FILTERED: 'gantry_tags_filtered',
  TYPE_FILTERED: 'gantry_type_filtered',
  SEARCHED: 'gantry_searched',
} as const;

export function useGantryAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (event: string, props: Record<string, unknown> = {}) => {
      posthog?.capture(event, props);
    },
    [posthog],
  );

  return {
    onIdeasViewed: () => capture(GANTRY_EVENTS.IDEAS_VIEWED),
    onRoadmapViewed: () => capture(GANTRY_EVENTS.ROADMAP_VIEWED),
    onIdeaCreated: (itemUid: string, tags: string[] = [], itemType?: string) =>
      capture(GANTRY_EVENTS.IDEA_CREATED, { itemUid, tags, tag_count: tags.length, ...(itemType ? { type: itemType } : {}) }),
    onItemUpvoted: (itemUid: string) => capture(GANTRY_EVENTS.ITEM_UPVOTED, { itemUid }),
    onBuildButtonClicked: (itemUid: string) => capture(GANTRY_EVENTS.BUILD_BUTTON_CLICKED, { itemUid }),
    onTagsFiltered: (tags: string[]) => capture(GANTRY_EVENTS.TAGS_FILTERED, { tags, tag_count: tags.length }),
    onTypeFiltered: (types: string[]) => capture(GANTRY_EVENTS.TYPE_FILTERED, { types, type_count: types.length }),
    onSearched: (query: string) => capture(GANTRY_EVENTS.SEARCHED, { query, query_length: query.length }),
  };
}

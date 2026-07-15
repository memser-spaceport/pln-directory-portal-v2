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
  OBJECTIVES_FILTERED: 'gantry_objectives_filtered',
  SEARCHED: 'gantry_searched',
  ITEM_REORDERED: 'gantry_item_reordered',
  ITEM_BOOSTED: 'gantry_item_boosted',
  ITEM_UNBOOSTED: 'gantry_item_unboosted',
  ITEM_IMPACT_RATED: 'gantry_item_impact_rated',
  ITEM_DRAWER_OPENED: 'gantry_item_drawer_opened',
  ITEM_DRAWER_CLOSED: 'gantry_item_drawer_closed',
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
    onIdeaCreated: (itemUid: string, tags: string[] = [], itemType?: string, impact?: number) =>
      capture(GANTRY_EVENTS.IDEA_CREATED, {
        itemUid,
        tags,
        tag_count: tags.length,
        ...(itemType ? { type: itemType } : {}),
        ...(impact !== undefined ? { impact } : {}),
      }),
    onItemUpvoted: (itemUid: string) => capture(GANTRY_EVENTS.ITEM_UPVOTED, { itemUid }),
    onBuildButtonClicked: (itemUid: string) => capture(GANTRY_EVENTS.BUILD_BUTTON_CLICKED, { itemUid }),
    onTagsFiltered: (tags: string[]) => capture(GANTRY_EVENTS.TAGS_FILTERED, { tags, tag_count: tags.length }),
    onTypeFiltered: (types: string[]) => capture(GANTRY_EVENTS.TYPE_FILTERED, { types, type_count: types.length }),
    onObjectivesFiltered: (objectives: string[]) =>
      capture(GANTRY_EVENTS.OBJECTIVES_FILTERED, { objectives, count: objectives.length }),
    onSearched: (query: string) => capture(GANTRY_EVENTS.SEARCHED, { query, query_length: query.length }),
    onItemReordered: (itemUid: string, stage: string) => capture(GANTRY_EVENTS.ITEM_REORDERED, { itemUid, stage }),
    onItemBoosted: (itemUid: string, impact?: number) =>
      capture(GANTRY_EVENTS.ITEM_BOOSTED, { itemUid, ...(impact !== undefined ? { impact } : {}) }),
    onItemUnboosted: (itemUid: string) => capture(GANTRY_EVENTS.ITEM_UNBOOSTED, { itemUid }),
    onItemImpactRated: (itemUid: string, impact: number, isUpdate: boolean, vehicle: 'create' | 'boost' | 'edit') =>
      capture(GANTRY_EVENTS.ITEM_IMPACT_RATED, { itemUid, impact, isUpdate, vehicle }),
    onItemDrawerOpened: (itemUid: string) => capture(GANTRY_EVENTS.ITEM_DRAWER_OPENED, { itemUid }),
    onItemDrawerClosed: (itemUid: string, timeOpenMs: number) =>
      capture(GANTRY_EVENTS.ITEM_DRAWER_CLOSED, { itemUid, timeOpenMs }),
  };
}

'use client';

import type { FeedView } from '../newsfeed-v0/feedView';

/**
 * One subscription, two entry points.
 *
 * Subscribing from a filtered feed and setting an alert in Monitor are the same
 * promise — "email me when new things match this" — so they must produce the same
 * object. Modelling them separately is how a product ends up with two
 * notification systems that drift apart and both half-work, which is precisely
 * the failure the Read/Monitor split exists to avoid.
 *
 * `key` is the identity (does this match what's on screen?); `label` is what a
 * human reads. `source` is kept only so the prototype can show which door was
 * used — the object itself is the same either way.
 */
export interface Subscription {
  key: string;
  label: string;
  source: 'feed' | 'monitor';
  /**
   * Present when it came from a feed filter — the view the subscription was made
   * of. A Monitor subscription has no feed view. Nothing in the toolbar renders it
   * any more (the saved-filter chip is gone: this object is an email
   * subscription, not a saved view), it stays the record of which filter the
   * emails describe.
   */
  view?: FeedView;
}

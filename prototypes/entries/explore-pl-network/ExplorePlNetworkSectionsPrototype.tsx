'use client';

import React from 'react';
import { ExplorePlNetworkPage } from './ExplorePlNetworkPrototype';

// Explore PL Network as it is live (the Editorial direction), with the page's
// sections as links in the top bar. Shares ExplorePlNetworkPage.
export default function ExplorePlNetworkSectionsPrototype() {
  return <ExplorePlNetworkPage direction="editorial" sectionNav />;
}

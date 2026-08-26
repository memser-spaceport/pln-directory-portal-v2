'use client';

import { ProgressBar } from './Loader/ProgressBar';

/**
 * Always-on variant of the global loader: shows the top progress bar for as long as it
 * stays mounted. Callers gate it themselves (`{isLoading && <PageLoader />}`), so there
 * is no event listener and no show-delay here.
 */
const PageLoader = (props: { 'data-testid'?: string }) => <ProgressBar {...props} />;

export default PageLoader;

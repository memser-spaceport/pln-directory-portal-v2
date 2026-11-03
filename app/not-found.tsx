import Error from '@/components/core/error';

/**
 * Every 404 on the site. Its own heading: with the error page's "Oh snap! Something went wrong!", a missing page read
 * as a failure, even when the response was a correct 404.
 */
export default function NotFound() {
  return <Error refreshOnMount={false} title="Page not found" />;
}

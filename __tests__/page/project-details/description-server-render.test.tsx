/**
 * @jest-environment node
 */
/**
 * LAB-2922: the project description is in the server HTML. It used to throw `document is not defined` on the server
 * (its editor's Quill evaluated at import), and React then rendered the whole project page in the browser only, so
 * crawlers saw an empty profile. Rendered here as the server renders it: no DOM at all.
 */
jest.mock('react-quill-new', () => {
  throw new ReferenceError('document is not defined');
});
jest.mock('quill-image-uploader', () => {
  throw new ReferenceError('document is not defined');
});
jest.mock('@/analytics/project.analytics', () => ({
  useProjectAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

import { renderToString } from 'react-dom/server';
import Description from '@/components/page/project-details/description';

it('renders the description text on the server, with no DOM', () => {
  const html = renderToString(
    <Description
      description="<p>Filecoin is a peer-to-peer network that stores files.</p>"
      project={{ id: 'project-1', name: 'Filecoin' }}
      userHasEditRights={false}
      user={null}
    />,
  );

  expect(html).toContain('Filecoin is a peer-to-peer network that stores files.');
});

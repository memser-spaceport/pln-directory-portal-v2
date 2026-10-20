/**
 * LAB-2922: Quill touches `document` while its module evaluates, so a static import anywhere in a server-rendered tree
 * throws on the server and React silently renders that whole boundary in the browser only. Crawlers then get an empty
 * page (project profiles did). The editor's public module must therefore never evaluate Quill when it is imported.
 */

// Stand-ins for the server: evaluating either module is the failure.
jest.mock('react-quill-new', () => {
  throw new ReferenceError('document is not defined');
});
jest.mock('quill-image-uploader', () => {
  throw new ReferenceError('document is not defined');
});

it('importing the editor does not evaluate Quill', () => {
  expect(() => require('@/components/ui/RichTextEditor/RichTextEditor')).not.toThrow();
});

it('a component that imports the editor statically can be imported too', () => {
  expect(() => require('@/components/page/project-details/description')).not.toThrow();
});

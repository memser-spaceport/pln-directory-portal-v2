import { splitFeedbackMedia } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/splitFeedbackMedia';
import { serializeAnnotations } from '@/components/page/ai-apps/components/screenshot-feedback/types';

describe('splitFeedbackMedia', () => {
  it('leaves a body with no images untouched', () => {
    const html = '<p>Great app</p><h2>But</h2>';

    expect(splitFeedbackMedia(html)).toEqual({ textHtml: html, images: [] });
  });

  it('lifts every image out of the text and keeps their order', () => {
    const { textHtml, images } = splitFeedbackMedia(
      '<p>Look here</p><p><img src="https://cdn.test/a.png" alt="first"></p><p><img src="https://cdn.test/b.png" alt="second"></p>',
    );

    expect(textHtml).toBe('<p>Look here</p>');
    expect(images.map((image) => image.src)).toEqual(['https://cdn.test/a.png', 'https://cdn.test/b.png']);
    expect(images.map((image) => image.alt)).toEqual(['first', 'second']);
  });

  /* A `<p>` emptied of its image still paints as a blank line under the global
     margin rules, so the gap outlives the thing that justified it. */
  it('collapses the paragraph an image leaves behind', () => {
    const { textHtml } = splitFeedbackMedia('<p>Text</p><p><img src="https://cdn.test/a.png"></p>');

    expect(textHtml).toBe('<p>Text</p>');
    expect(textHtml).not.toContain('<p></p>');
  });

  it('collapses a paragraph holding only whitespace or a break after extraction', () => {
    const { textHtml } = splitFeedbackMedia('<p>Text</p><p> <img src="https://cdn.test/a.png"><br></p>');

    expect(textHtml).toBe('<p>Text</p>');
  });

  it('keeps text that shared a paragraph with an image', () => {
    const { textHtml, images } = splitFeedbackMedia('<p>Before<img src="https://cdn.test/a.png">After</p>');

    expect(textHtml).toBe('<p>BeforeAfter</p>');
    expect(images).toHaveLength(1);
  });

  it('reports an image-only body as empty text', () => {
    const { textHtml, images } = splitFeedbackMedia('<p><img src="https://cdn.test/a.png"></p>');

    expect(textHtml.trim()).toBe('');
    expect(images).toHaveLength(1);
  });

  it('marks a plain image as carrying nothing to view', () => {
    const { images } = splitFeedbackMedia('<p><img src="https://cdn.test/a.png" alt="shot"></p>');

    expect(images[0].annotations).toBeNull();
    expect(images[0].hasVisibleAnnotations).toBe(false);
  });

  it('parses annotations off the image and flags it as annotated', () => {
    const encoded = serializeAnnotations({
      version: 1,
      strokes: [],
      shapes: [],
      comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Broken' }],
    });

    const { images } = splitFeedbackMedia(`<p><img src="https://cdn.test/a.png" data-annotations="${encoded}"></p>`);

    expect(images[0].hasVisibleAnnotations).toBe(true);
    expect(images[0].annotations?.comments[0].text).toBe('Broken');
  });

  /* A shape-only annotation is the case a `strokes || comments` check misses:
     nothing errors, the screenshot just silently loses its badge and outline. */
  it('flags a screenshot annotated with only a shape', () => {
    const encoded = serializeAnnotations({
      version: 1,
      strokes: [],
      shapes: [{ kind: 'ellipse', color: '#dc2626', width: 0.006, x: 0.1, y: 0.1, w: 0.3, h: 0.2 }],
      comments: [],
    });

    const { images } = splitFeedbackMedia(`<p><img src="https://cdn.test/a.png" data-annotations="${encoded}"></p>`);

    expect(images[0].hasVisibleAnnotations).toBe(true);
  });

  it('treats an empty annotation payload as nothing to view', () => {
    const encoded = serializeAnnotations({ version: 1, strokes: [], shapes: [], comments: [] });

    const { images } = splitFeedbackMedia(`<p><img src="https://cdn.test/a.png" data-annotations="${encoded}"></p>`);

    expect(images[0].hasVisibleAnnotations).toBe(false);
  });

  /**
   * `parseAnnotations` runs `JSON.parse(decodeURIComponent(raw))`, and
   * decodeURIComponent is a no-op on plain JSON — so an attribute holding raw,
   * un-URL-encoded JSON is a payload shape the parser accepts. That is the shape
   * where the entity decode earns its keep: DOMPurify's re-serializer escapes a
   * `&` inside it to `&amp;`, and without decoding it back the JSON no longer
   * parses and the screenshot silently loses its badge, outline, and replay.
   *
   * Payloads written by `serializeAnnotations` never hit this: encodeURIComponent
   * turns `&` into `%26`, so there is nothing for DOMPurify to escape. The decode
   * is a guard against the format changing, not something today's writer needs.
   */
  it('decodes &amp; in a raw-JSON annotations attribute before parsing', () => {
    const rawJson = JSON.stringify({
      version: 1,
      strokes: [],
      shapes: [],
      comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Save & exit is broken' }],
    });

    const { images } = splitFeedbackMedia(
      `<p><img src="https://cdn.test/a.png" data-annotations='${rawJson.replace(/&/g, '&amp;')}'></p>`,
    );

    expect(images[0].hasVisibleAnnotations).toBe(true);
    expect(images[0].annotations?.comments[0].text).toBe('Save & exit is broken');
  });

  it('drops an image tag with no src rather than emitting a broken tile', () => {
    const { textHtml, images } = splitFeedbackMedia('<p>Text</p><p><img alt="nothing"></p>');

    expect(images).toHaveLength(0);
    expect(textHtml).toBe('<p>Text</p>');
  });

  it('reads single-quoted attributes', () => {
    const { images } = splitFeedbackMedia("<p><img src='https://cdn.test/a.png' alt='shot'></p>");

    expect(images[0]).toMatchObject({ src: 'https://cdn.test/a.png', alt: 'shot' });
  });
});

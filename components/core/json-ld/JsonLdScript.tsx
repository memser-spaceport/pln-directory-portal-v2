import { serializeJsonLd } from '@/utils/json-ld';

/** An inline JSON-LD script. `serializeJsonLd` escapes the text, so profile content cannot end the script tag. */
export function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD from serializeJsonLd, which escapes it for a script tag
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

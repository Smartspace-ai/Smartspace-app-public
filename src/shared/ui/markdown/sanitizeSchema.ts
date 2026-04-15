import type { Schema } from 'hast-util-sanitize';
import { defaultSchema } from 'rehype-sanitize';

const base = defaultSchema;

type AttrList = NonNullable<NonNullable<Schema['attributes']>[string]>;

// Permissive schema for LLM-generated message content. Starts from
// rehype-sanitize's default (already allows `details`, `summary`, and
// `code className=language-*`) and re-permits a few attributes our chat
// backend commonly emits: `<a target rel>`, image metadata, data-* markers
// used by the ssImage renderer. `<script>`, `<iframe>`, `<object>`, and
// event handlers remain stripped. Note: the HTML preview iframe is rendered
// via the `code` component override, which bypasses the sanitize pass.
export const messageSanitizeSchema: Schema = {
  ...base,
  attributes: {
    ...(base.attributes ?? {}),
    a: [...((base.attributes?.a as AttrList) ?? []), 'target', 'rel'],
    img: [
      ...((base.attributes?.img as AttrList) ?? []),
      'alt',
      'title',
      'width',
      'height',
      'dataSsImage',
      'dataFileId',
      'dataFit',
      'dataAlign',
      'dataCaption',
    ],
  },
  // Re-permit the custom `ss-file:` URI scheme so file attachments embedded
  // as `![](ss-file:id?...)` or `[name](ss-file:id)` survive sanitization.
  // Without this the default schema strips them (it only allows http/https).
  protocols: {
    ...(base.protocols ?? {}),
    src: [...(base.protocols?.src ?? []), 'ss-file'],
    href: [...(base.protocols?.href ?? []), 'ss-file'],
  },
};

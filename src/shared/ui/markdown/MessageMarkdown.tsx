import ReactMarkdown, {
  type Components,
  defaultUrlTransform,
} from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { remarkFileTag } from './plugins/remarkFileTag';
import { CodeBlock } from './renderers/CodeBlock';
import { HtmlPreview } from './renderers/HtmlPreview';
import { SsImage } from './renderers/SsImage';
import { messageSanitizeSchema } from './sanitizeSchema';
import './styles.css';

const rehypePlugins: React.ComponentProps<
  typeof ReactMarkdown
>['rehypePlugins'] = [rehypeRaw, [rehypeSanitize, messageSanitizeSchema]];

const remarkPlugins: React.ComponentProps<
  typeof ReactMarkdown
>['remarkPlugins'] = [remarkGfm, remarkFileTag];

// react-markdown's default urlTransform strips any URL whose protocol isn't
// in its built-in safelist (http, https, mailto, etc). The chat backend uses
// a custom `ss-file:` scheme for inline file references — without this
// override the src is replaced with an empty string and the SsImage renderer
// never sees the file id.
const urlTransform: React.ComponentProps<
  typeof ReactMarkdown
>['urlTransform'] = (value) => {
  if (typeof value === 'string' && value.startsWith('ss-file:')) {
    return value;
  }
  return defaultUrlTransform(value);
};

const components: Components = {
  code({ className, children }) {
    const source = String(children ?? '').replace(/\n$/, '');
    const match = /language-(\w+)/.exec(className ?? '');
    const language = match?.[1] ?? '';
    // react-markdown v9 dropped the `inline` prop. A fenced/indented code
    // block in hast is always `<pre><code>`, so we detect "block" by the
    // presence of a language class or a newline in the source. Bare inline
    // `<code>` without either renders via the default inline code path.
    const isBlock = !!language || source.includes('\n');
    if (!isBlock) {
      return <code className={className}>{children}</code>;
    }
    if (language === 'html') {
      return <HtmlPreview source={source} />;
    }
    return <CodeBlock language={language} source={source} />;
  },
  // Override the default `pre` wrapper so our `code` component can emit its
  // own wrapper. Without this, react-markdown wraps our CodeBlock/HtmlPreview
  // in an extra `<pre>` element from its default renderer.
  pre({ children }) {
    return <>{children}</>;
  },
  a({ href, children, ...rest }) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
        {children}
      </a>
    );
  },
  img: SsImage,
};

type MessageMarkdownProps = {
  value: string;
  className?: string;
};

/** Read-only markdown renderer for chat messages. Uses react-markdown +
 *  rehype-raw so mixed markdown/HTML rebalances via parse5, which fixes
 *  cases like `<details>` wrapping a fenced code block. Shares the
 *  `ss-code-block` CSS scope with the Milkdown editor via the
 *  `ss-markdown` wrapper class (see `styles.css`). */
export function MessageMarkdown({ value, className }: MessageMarkdownProps) {
  return (
    <div className={className ? `ss-markdown ${className}` : 'ss-markdown'}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        urlTransform={urlTransform}
        components={components}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}

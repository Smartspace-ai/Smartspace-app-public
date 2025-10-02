// features/messages/MyMarkdown.tsx
'use client';

import React, { memo, useMemo } from 'react';
import Markdown, { type Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
// import rehypeSanitize from 'rehype-sanitize';

import { useTeams } from '@/contexts/teams-context';

import { HTMLBlock } from './html';
import { MarkdownSmartImage } from './MarkdownSmartImage';


type Props = { text: string };

const cx = (...p: Array<string | undefined | false>) => p.filter(Boolean).join(' ');

export const MyMarkdown: React.FC<Props> = memo(function MyMarkdown({ text }) {
  const { isInTeams } = useTeams();

  // Correctly typed component map for react-markdown
  const components = useMemo<Components>(
    () => ({
      h1: ({ node, className, ...props }) => (
        <h1 {...props} className={cx(className, 'text-[1.5em] font-bold my-2')}>{props.children}</h1>
      ),
      h2: ({ node, className, ...props }) => (
        <h2 {...props} className={cx(className, 'text-[1.3em] font-bold my-2')}>{props.children}</h2>
      ),
      h3: ({ node, className, ...props }) => (
        <h3 {...props} className={cx(className, 'text-[1.1em] font-bold my-2')}>{props.children}</h3>
      ),
      h4: ({ node, className, ...props }) => (
        <h4 {...props} className={cx(className, 'text-[1em] font-bold my-2')}>{props.children}</h4>
      ),
      h5: ({ node, className, ...props }) => (
        <h5 {...props} className={cx(className, 'text-[0.9em] font-bold my-2')}>{props.children}</h5>
      ),
      h6: ({ node, className, ...props }) => (
        <h6 {...props} className={cx(className, 'text-[0.8em] font-bold my-2')}>{props.children}</h6>
      ),

      a: ({ node, className, href, ...props }) => (
        <a
          {...props}
          href={href}
          target={isInTeams ? '_blank' : undefined}
          rel={isInTeams ? 'noreferrer noopener' : undefined}
          className={cx(className, 'text-blue-600 dark:text-blue-400 hover:underline')}
        >
          {props.children}
        </a>
      ),

      code: ({ node, className, children, ...props }) => {
        const raw = (
          <code {...props} className={className}>
            {children}
          </code>
        );
        // Special-case HTML code blocks rendered via our HTMLBlock
        return className === 'language-html' ? (
          <HTMLBlock content={String(children)} raw={raw} />
        ) : (
          raw
        );
      },

      // Images (markdown and raw HTML <img>) → our SmartSpace-aware renderer
      img: ({ node, ...props }) => (
        <MarkdownSmartImage {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
      ),
    }),
    [isInTeams],
  );

  const trimmed = text?.trim() ?? '';

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeRaw,
        // Add sanitize if content is untrusted; configure an allowlist schema:
        // rehypeSanitize,
      ]}
      components={components}
    >
      {trimmed}
    </Markdown>
  );
});

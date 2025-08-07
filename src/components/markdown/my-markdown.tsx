import { useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { HTMLBlock } from './html';

import { useTeams } from '@/contexts/teams-context';

interface Props {
  text: string;
}

export const MyMarkdown = ({ text }: Props) => {
  const {isInTeams} = useTeams();
  
  return useMemo(() => {
    return (
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({children}) => <h1 style={{fontSize: '1.5em', fontWeight: 'bold', margin: '0.5em 0'}}>{children}</h1>,
          h2: ({children}) => <h2 style={{fontSize: '1.3em', fontWeight: 'bold', margin: '0.5em 0'}}>{children}</h2>,
          h3: ({children}) => <h3 style={{fontSize: '1.1em', fontWeight: 'bold', margin: '0.5em 0'}}>{children}</h3>,
          h4: ({children}) => <h4 style={{fontSize: '1em', fontWeight: 'bold', margin: '0.5em 0'}}>{children}</h4>,
          h5: ({children}) => <h5 style={{fontSize: '0.9em', fontWeight: 'bold', margin: '0.5em 0'}}>{children}</h5>,
          h6: ({children}) => <h6 style={{fontSize: '0.8em', fontWeight: 'bold', margin: '0.5em 0'}}>{children}</h6>,
          a: ({children, href, ...rest}) => (
            <a
              {...rest}
              href={href}
              target={isInTeams ? "_blank" : undefined}
              rel={isInTeams ? "noreferrer noopener" : undefined}
            >
              {children}
            </a>
          ),
          code: ({children, className, ...rest}) => {
            const defaultView = (
              <code {...rest} className={className}>
                {children}
              </code>
            );
            return className === 'language-html' ? (
              <HTMLBlock content={children as string} raw={defaultView} />
            ) : (
              defaultView
            );
          },
        }}
      >
        {text.trim()}
      </Markdown>
    );
  }, [text, isInTeams]);
};

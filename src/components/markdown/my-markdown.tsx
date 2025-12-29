import { useMemo } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { HTMLBlock } from './html';

import { useTeams } from '@/contexts/teams-context';
import { cn } from '@/lib/utils';

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
          a: ({children, href, className, ...rest}) => (
            <a
              {...rest}
              href={href}
              target={isInTeams ? "_blank" : undefined}
              rel={isInTeams ? "noreferrer noopener" : undefined}
              className={cn(
                className,
                'text-blue-600 dark:text-blue-400 hover:underline break-words'
              )}
            >
              {children}
            </a>
          ),
          p: ({children, className, ...rest}) => (
            <p {...rest} className={cn(className, 'break-words')}>
              {children}
            </p>
          ),
          img: ({className, alt, ...rest}) => (
            <img
              {...rest}
              alt={typeof alt === 'string' ? alt : ''}
              className={cn(className, 'max-w-full h-auto')}
            />
          ),
          pre: ({children, className, ...rest}) => (
            <pre
              {...rest}
              className={cn(className, 'w-full max-w-full overflow-x-auto whitespace-pre-wrap break-words')}
            >
              {children}
            </pre>
          ),
          table: ({children, className, ...rest}) => (
            <div className="w-full overflow-x-auto">
              <table
                {...rest}
                className={cn(className, 'w-full max-w-full table-auto')}
              >
                {children}
              </table>
            </div>
          ),
          th: ({children, className, ...rest}) => (
            <th {...rest} className={cn(className, 'break-words')}>
              {children}
            </th>
          ),
          td: ({children, className, ...rest}) => (
            <td {...rest} className={cn(className, 'break-words')}>
              {children}
            </td>
          ),
          li: ({children, className, ...rest}) => (
            <li {...rest} className={cn(className, 'break-words')}>
              {children}
            </li>
          ),
          code: ({children, className, ...rest}) => {
            const defaultView = (
              <code
                {...rest}
                className={cn(className, 'break-words whitespace-pre-wrap')}
              >
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
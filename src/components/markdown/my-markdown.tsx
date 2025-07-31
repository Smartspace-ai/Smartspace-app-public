import { useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HTMLBlock } from './html';

import { useTeams } from '@/contexts/teams-context';
import './my-markdown.scss';

interface Props {
  text: string;
}

export const MyMarkdown = ({ text }: Props) => {
  const {isInTeams} = useTeams();
  
  return useMemo(() => {
    return (
      <Markdown
        remarkPlugins={[remarkGfm]}
        className={'markdown'}
        components={{
          a(props) {
            const { children, href, ...rest } = props;
            return (
              <a
                {...rest}
                href={href}
                target={isInTeams ? "_blank" : undefined}
                rel={isInTeams ? "noreferrer noopener" : undefined}
              >
                {children}
              </a>
            );
          },
          code(props) {
            const { children, className, node, ...rest } = props;
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

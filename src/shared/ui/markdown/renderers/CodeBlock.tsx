import { useEffect, useRef, useState } from 'react';

import { copyText } from '../htmlPreviewShared';

type CodeBlockProps = {
  language: string;
  source: string;
};

export function CodeBlock({ language, source }: CodeBlockProps) {
  const [copyLabel, setCopyLabel] = useState<'Copy' | 'Copied' | 'Failed'>(
    'Copy'
  );
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const handleCopy = async () => {
    const ok = await copyText(source);
    setCopyLabel(ok ? 'Copied' : 'Failed');
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setCopyLabel('Copy');
      resetTimerRef.current = null;
    }, 1500);
  };

  const codeClass = language ? `language-${language}` : undefined;

  return (
    <div className="ss-code-block">
      <div className="ss-code-block__header">
        <span className="ss-code-block__lang">{language || 'text'}</span>
        <div className="ss-code-block__actions">
          <button
            type="button"
            className="ss-code-block__copy"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleCopy}
          >
            {copyLabel}
          </button>
        </div>
      </div>
      <pre {...(language ? { 'data-language': language } : {})}>
        <code className={codeClass}>{source}</code>
      </pre>
    </div>
  );
}

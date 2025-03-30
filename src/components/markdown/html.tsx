'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type ReactNode, useEffect, useRef, useState } from 'react';

interface HTMLBlockProps {
  content: string;
  raw: ReactNode;
}

export const HTMLBlock = ({ content, raw }: HTMLBlockProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(500);

  useEffect(() => {
    if (iframeRef.current) {
      // Create a Blob with the HTML content
      const blob = new Blob(
        [
          `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Injected Content</title>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `,
        ],
        { type: 'text/html' }
      );

      // Create a URL for the Blob for JS isolation
      const blobURL = URL.createObjectURL(blob);

      // Set the iframe's src attribute to the Blob URL
      iframeRef.current.src = blobURL;

      iframeRef.current.addEventListener('load', () => {
        const height =
          iframeRef.current?.contentWindow?.document?.body?.scrollHeight;
        if (height) {
          setIframeHeight(height + 30);
          iframeRef.current.setAttribute('height', `${height + 30}`);
        }
      });

      // Revoke the Blob URL when the component unmounts to free up memory
      return () => URL.revokeObjectURL(blobURL);
    }
  }, [content]);

  return (
    <div id={content}>
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <iframe
            ref={iframeRef}
            style={{ border: 'none', width: '100%', height: iframeHeight }}
            title="Injected HTML Content"
          />
        </TabsContent>
        <TabsContent value="raw">{raw}</TabsContent>
      </Tabs>
    </div>
  );
};

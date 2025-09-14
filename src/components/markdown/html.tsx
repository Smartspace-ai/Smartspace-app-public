import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '../../shared/ui/shadcn/card';

interface HTMLBlockProps {
  content: string;
  raw: ReactNode;
}

enum ActiveTab {
  Preview = 'preview',
  Raw = 'raw',
}

export const HTMLBlock = ({ content, raw }: HTMLBlockProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(500);
  const [activeTab, setActiveTab] = useState<ActiveTab | string>(
    ActiveTab.Preview
  );

  useEffect(() => {
    if (activeTab === ActiveTab.Preview && iframeRef.current) {
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
  }, [content, activeTab]); // Re-run when content or activeTab changes

  return (
    <div className="my-2" id={content}>
      <Tabs
        defaultValue="preview"
        className="w-full"
        onValueChange={(value) => setActiveTab(value)} // Track tab changes
      >
        <TabsList className="grid w-full grid-cols-2 max-w-[200px] bg-[#f8f9fb] border ">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <Card>
            <CardContent className="bg-[#f8f9fb]">
              <iframe
                ref={iframeRef}
                style={{
                  border: 'none',
                  width: '100%',
                  height: iframeHeight,
                }}
                title="Injected HTML Content"
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="raw">
          <Card>
            <CardContent className="bg-[#f8f9fb] py-4">{raw}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

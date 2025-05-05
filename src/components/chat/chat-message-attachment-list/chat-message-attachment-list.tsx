import { FC, useState } from 'react';
import { MessageFile } from '../../../models/message';
import { Button } from '../../ui/button';

interface ChatMessageAttachmentListProps {
  files: MessageFile[];
  downloadFile: (id: string) => Promise<Blob>;
  saveFile: (blob: Blob, fileName: string) => void;
}

export const ChatMessageAttachmentList: FC<ChatMessageAttachmentListProps> = ({
  files,
  downloadFile,
  saveFile,
}) => {
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>(
    {}
  );

  const onClick = async (file: MessageFile) => {
    downloading[file.id] = true;
    setDownloading({ ...downloading });
    const blob = await downloadFile(file.id);
    await saveFile(blob, file.name ?? 'unknown');
    downloading[file.id] = false;
    setDownloading({ ...downloading });
  };

  return (
    <div>
      {files?.map((f) => (
        <Button key={f.id} onClick={() => onClick(f)}>
          <span>
            {f.name} {downloading[f.id] && 'Downloading...'}
          </span>
        </Button>
      ))}
    </div>
  );
};

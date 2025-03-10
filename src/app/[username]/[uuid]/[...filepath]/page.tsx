'use client';

import { FileViewer } from '@/components/file/file-viewer';

interface FileViewerPageProps {
  params: {
    username: string;
    uuid: string;
    filepath: string[];
  };
}

export default function FileViewerPage({ params }: FileViewerPageProps) {
  const { username, uuid, filepath } = params;
  const path = filepath ? filepath.join('/') : '';

  return (
    <div>
      <FileViewer
        username={username}
        uuid={uuid}
        filepath={path}
      />
    </div>
  );
}
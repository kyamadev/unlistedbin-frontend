'use client';

import { FileViewer } from '@/components/file/file-viewer';

interface RepositoryPageProps {
  params: {
    username: string;
    uuid: string;
  };
}

export default function RepositoryPage({ params }: RepositoryPageProps) {
  const { username, uuid } = params;

  return (
    <div>
      <FileViewer
        username={username}
        uuid={uuid}
      />
    </div>
  );
}
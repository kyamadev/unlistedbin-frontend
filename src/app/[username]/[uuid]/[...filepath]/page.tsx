import { FileViewer } from '@/components/file/file-viewer';

interface FileViewerPageProps {
  params: {
    username: string;
    uuid: string;
    filepath: string[];
  };
}

export default async function FileViewerPage({ params }: FileViewerPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { username, uuid, filepath } = resolvedParams;
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
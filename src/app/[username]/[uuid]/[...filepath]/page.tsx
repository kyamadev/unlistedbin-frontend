import { FileViewer } from '@/components/file/file-viewer';

export default async function FileViewerPage({ 
  params 
}: { 
  params: Promise<{
    username: string;
    uuid: string;
    filepath: string[];
  }>
}) {
  const { username, uuid, filepath } = await params;
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
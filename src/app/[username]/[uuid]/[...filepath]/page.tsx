import { FileViewer } from '@/components/file/file-viewer';

export default async function FileViewerPage({ params }: any) {
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
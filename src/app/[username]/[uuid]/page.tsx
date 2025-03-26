import { FileViewer } from '@/components/file/file-viewer';

export default async function RepositoryPage({ params }: any) {
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
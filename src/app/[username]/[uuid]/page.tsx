import { FileViewer } from '@/components/file/file-viewer';

export default async function RepositoryPage({ 
  params 
}: { 
  params: Promise<{
    username: string;
    uuid: string;
  }>
}) {
  const { username, uuid } = await params;

  return (
    <div>
      <FileViewer
        username={username}
        uuid={uuid}
      />
    </div>
  );
}
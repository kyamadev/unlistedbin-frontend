import { FileViewer } from '@/components/file/file-viewer';

interface RepositoryPageProps {
  params: {
    username: string;
    uuid: string;
  };
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { username, uuid } = resolvedParams;

  return (
    <div>
      <FileViewer
        username={username}
        uuid={uuid}
      />
    </div>
  );
}
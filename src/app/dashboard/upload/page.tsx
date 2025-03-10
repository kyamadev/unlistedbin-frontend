'use client';

import { FileUploader } from '@/components/file/file-uploader';

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">ファイルアップロード</h1>
        <p className="text-gray-500 dark:text-gray-400">
          新しいリポジトリにファイルをアップロードします。単一ファイルまたはZIPファイルをアップロードできます。
        </p>
      </div>
      
      <div className="max-w-2xl">
        <FileUploader />
      </div>
    </div>
  );
}
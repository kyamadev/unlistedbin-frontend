'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { fileApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/providers/auth-provider';
import { formatFileSize } from '@/lib/utils';
import { AlertCircle, Upload, File, Archive } from 'lucide-react';

export function FileUploader() {
  const [repositoryName, setRepositoryName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const storageUsed = user?.storage_used || 0;
  const storageLimit = user?.storage_limit || 1073741824; // 1GB
  const remainingStorage = storageLimit - storageUsed;
  const usagePercentage = Math.min(100, Math.floor((storageUsed / storageLimit) * 100));

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        
        // リポジトリ名が空の場合、ファイル名をデフォルトとして設定
        if (!repositoryName) {
          const fileName = acceptedFiles[0].name.split('.')[0];
          setRepositoryName(fileName);
        }
      }
    },
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('ファイルを選択してください');
      return;
    }
    
    if (!repositoryName) {
      setError('リポジトリ名を入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      // ZIPファイルとその他のファイルで処理を分ける
      if (selectedFile.type === 'application/zip' || selectedFile.name.endsWith('.zip')) {
        response = await fileApi.uploadZip(selectedFile, repositoryName, isPublic);
      } else {
        response = await fileApi.uploadFile(selectedFile, repositoryName, isPublic);
      }
      
      if (response.repo_uuid) {
        router.push('/dashboard');
      } else {
        setError('アップロードは成功しましたが、レスポンスが不正です');
      }
    } catch (err: any) {
      console.error('アップロードエラー:', err);
      if (err.response?.status === 403 && err.response?.data?.error?.includes('Storage limit exceeded')) {
        setError(`ストレージ容量制限に達しました。不要なリポジトリを削除して容量を確保してください。${err.response.data.error}`);
      } else {
        setError(err.response?.data?.error || 'ファイルのアップロードに失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">新しいファイルをアップロード</h2>
        <p className="text-gray-500 dark:text-gray-400">
          単一ファイルまたはZIPファイルをアップロードして新しいリポジトリを作成します
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {user && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
          <div className="flex justify-between mb-1">
            <span>ストレージ使用状況:</span>
            <span className={usagePercentage > 90 ? 'text-red-500 font-medium' : ''}>
              {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
              （{usagePercentage}%）
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${
                usagePercentage > 90 ? 'bg-red-500' : 
                usagePercentage > 70 ? 'bg-yellow-500' : 'bg-blue-500'
              }`} 
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          {selectedFile && (
            <div className="mt-2 text-xs">
              選択ファイルサイズ: <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
              {selectedFile.size > remainingStorage && (
                <span className="ml-2 text-red-500">
                  ※ファイルサイズが残り容量を超えています
                </span>
              )}
            </div>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repository-name">リポジトリ名</Label>
          <Input
            id="repository-name"
            placeholder="リポジトリ名を入力"
            value={repositoryName}
            onChange={(e) => setRepositoryName(e.target.value)}
            required
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="public">公開リポジトリにする</Label>
        </div>
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            {selectedFile ? (
              <>
                {selectedFile.name.endsWith('.zip') ? (
                  <Archive className="h-12 w-12 text-blue-500" />
                ) : (
                  <File className="h-12 w-12 text-blue-500" />
                )}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  ファイルを変更
                </Button>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {isDragActive
                      ? 'ファイルをここにドロップ'
                      : 'アップロードするファイルをドラッグ＆ドロップ'}
                  </p>
                  <p className="text-sm text-gray-500">
                    または<span className="text-blue-500">ファイルを選択</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading || !selectedFile}>
          {isLoading ? 'アップロード中...' : 'アップロード'}
        </Button>
      </form>
    </div>
  );
}
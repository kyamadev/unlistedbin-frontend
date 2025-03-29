'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { fileApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Upload, File, Archive, Download, Ban } from 'lucide-react';

export function FileUploader() {
  const [repositoryName, setRepositoryName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isDownloadAllowed, setIsDownloadAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    if (!isPublic && isDownloadAllowed) {
      setIsDownloadAllowed(false);
    }
  }, [isPublic, isDownloadAllowed]);

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
        response = await fileApi.uploadZip(selectedFile, repositoryName, isPublic, isDownloadAllowed);
      } else {
        response = await fileApi.uploadFile(selectedFile, repositoryName, isPublic, isDownloadAllowed);
      }
      
      if (response.repo_uuid) {
        router.push('/dashboard');
      } else {
        setError('アップロードは成功しましたが、レスポンスが不正です');
      }
    } catch (err: any) {
      console.error('アップロードエラー:', err);
      setError(err.response?.data?.error || 'ファイルのアップロードに失敗しました');
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
          <Label htmlFor="public">限定公開し、URLでの共有を許可する</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="download-allowed"
            checked={isDownloadAllowed}
            onCheckedChange={setIsDownloadAllowed}
            disabled={!isPublic}
          />
          <Label htmlFor="download-allowed" className="flex items-center">
            ダウンロードを許可する 
            {!isPublic ? (
              <span className="ml-2 text-xs text-gray-500">
                (非公開リポジトリではダウンロードは許可できません)
              </span>
            ) : !isDownloadAllowed && (
              <span className="ml-2 text-xs text-gray-500">
              </span>
            )}
          </Label>
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
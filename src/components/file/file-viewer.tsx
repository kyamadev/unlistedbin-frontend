'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fileApi, FileContents, DirectoryContents } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import { Folder, File, ChevronRight, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';

interface FileViewerProps {
  username: string;
  uuid: string;
  filepath?: string;
}

export function FileViewer({ username, uuid, filepath = '' }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<FileContents | DirectoryContents | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fileApi.getContents(username, uuid, filepath);
        setContent(data);
      } catch (err: any) {
        console.error('コンテンツ取得エラー:', err);
        setError(err.response?.data?.error || 'コンテンツの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, [username, uuid, filepath]);

  // コードが読み込まれた後にシンタックスハイライトを適用
  useEffect(() => {
    if (content && !content.isDirectory) {
      Prism.highlightAll();
    }
  }, [content]);

  // ファイルの言語を拡張子から推測
  const getLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'go': 'go',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'sh': 'bash',
      'bash': 'bash',
      'sql': 'sql',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'java': 'java',
      'kt': 'kotlin',
      'rb': 'ruby',
      'php': 'php',
      'rs': 'rust',
      'swift': 'swift',
      'txt': 'plaintext',
    };
    
    return languageMap[extension] || 'plaintext';
  };

  // 親ディレクトリへのパスを取得
  const getParentPath = (path: string): string => {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return parts.length ? `/${parts.join('/')}` : '';
  };

  // ファイルパスのパンくずリスト
  const renderBreadcrumbs = () => {
    const parts = filepath.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    // ルートへのリンク
    breadcrumbs.push(
      <Link
        key="root"
        href={`/${username}/${uuid}`}
        className="text-blue-500 hover:underline"
      >
        {`${username}'s ${content?.repo_name || 'Repository'}`}
      </Link>
    );
    
    // 各パスセグメントへのリンク
    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      breadcrumbs.push(
        <span key={`separator-${index}`} className="mx-1">
          <ChevronRight className="h-4 w-4 inline" />
        </span>
      );
      
      breadcrumbs.push(
        <Link
          key={currentPath}
          href={`/${username}/${uuid}${currentPath}`}
          className={index === parts.length - 1 ? 'font-medium' : 'text-blue-500 hover:underline'}
        >
          {part}
        </Link>
      );
    });
    
    return <div className="flex items-center overflow-x-auto py-2">{breadcrumbs}</div>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-gray-500">コンテンツを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-semibold">エラーが発生しました</h3>
        <p className="mt-2 text-gray-500">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          戻る
        </Button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <h3 className="mt-4 text-lg font-semibold">コンテンツが見つかりません</h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          戻る
        </Button>
      </div>
    );
  }

  // ディレクトリ内容表示
  if (content.isDirectory) {
    return (
      <div className="space-y-4">
        {renderBreadcrumbs()}
        
        {filepath && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${username}/${uuid}${getParentPath(filepath)}`)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              親ディレクトリへ
            </Button>
          </div>
        )}
        
        <div className="border rounded-lg divide-y">
          {content.entries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              このディレクトリは空です
            </div>
          ) : (
            content.entries.map((entry) => {
              const isDirectory = !entry.includes('.');
              const entryPath = filepath ? `${filepath}/${entry}` : entry;
              
              return (
                <Link
                  key={entry}
                  href={`/${username}/${uuid}/${entryPath}`}
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {isDirectory ? (
                    <Folder className="h-5 w-5 text-blue-500 mr-3" />
                  ) : (
                    <File className="h-5 w-5 text-gray-500 mr-3" />
                  )}
                  <span>{entry}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ファイル内容表示
  const fileContent = content as FileContents;
  const language = getLanguage(fileContent.filepath);
  
  return (
    <div className="space-y-4">
      {renderBreadcrumbs()}
      
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${username}/${uuid}${getParentPath(filepath)}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          ディレクトリへ戻る
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b font-mono text-sm">
          {fileContent.filepath.split('/').pop()}
        </div>
        
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm">
            <code className={`language-${language}`}>{fileContent.data}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
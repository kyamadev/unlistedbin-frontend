'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRepositories } from '@/hooks/use-repositories';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Repository } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {

  Trash2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  FileUp,
  Copy,
  Check,
} from 'lucide-react';

export function RepositoryList() {
  const { repositories, isLoading, error, deleteRepository, updateVisibility } = useRepositories();
  const { user } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState<Repository | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedRepo, setCopiedRepo] = useState<string | null>(null);

  const handleVisibilityToggle = async (repo: Repository) => {
    setActionLoading(`visibility-${repo.uuid}`);
    
    try {
      await updateVisibility(repo.uuid, !repo.public);
    } catch (err) {
      console.error('リポジトリ可視性更新エラー:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (repo: Repository) => {
    setActionLoading(`delete-${repo.uuid}`);
    
    try {
      const success = await deleteRepository(repo.uuid);
      if (success) {
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('リポジトリ削除エラー:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-gray-500">リポジトリを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-semibold">エラーが発生しました</h3>
        <p className="mt-2 text-gray-500">{error}</p>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-xl font-semibold mb-4">リポジトリがありません</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            ファイルをアップロードして、限定公開しましょう。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild>
              <Link href="/dashboard/upload">
                <FileUp className="mr-2 h-4 w-4" />
                ファイルをアップロード
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">マイリポジトリ</h2>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/upload">
              <FileUp className="mr-2 h-4 w-4" />
              アップロード
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repositories.map(repo => (
          <div
            key={repo.uuid}
            className="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-lg truncate">{repo.name}</h3>
                <div className="flex items-center space-x-1">
                  {repo.public ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      限定公開
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      非公開
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {new Date(repo.updated_at || repo.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 flex justify-between">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${user?.username}/${repo.uuid}`}>
                  閲覧
                </Link>
              </Button>
              
              <div className="flex space-x-2">
                {repo.public && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="共有URLをコピー"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/${user?.username}/${repo.uuid}`;
                      navigator.clipboard.writeText(shareUrl)
                        .then(() => {
                          setCopiedRepo(repo.uuid);
                          // 2秒後に表示をリセット
                          setTimeout(() => setCopiedRepo(null), 2000);
                        })
                        .catch(err => console.error('URLのコピーに失敗しました:', err));
                    }}
                  >
                    {copiedRepo === repo.uuid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-blue-500" />
                    )}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  title={repo.public ? "非公開にする" : "限定公開にする"}
                  onClick={() => handleVisibilityToggle(repo)}
                  disabled={actionLoading === `visibility-${repo.uuid}`}
                >
                  {actionLoading === `visibility-${repo.uuid}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : repo.public ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  title="リポジトリを削除"
                  onClick={() => setDeleteConfirm(repo)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>リポジトリの削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteConfirm?.name}」を削除してもよろしいですか？
              この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={actionLoading === `delete-${deleteConfirm?.uuid}`}
            >
              {actionLoading === `delete-${deleteConfirm?.uuid}` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  削除中...
                </>
              ) : (
                '削除する'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
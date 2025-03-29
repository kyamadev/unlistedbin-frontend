'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRepositories } from '@/hooks/use-repositories';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Repository } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Loader2,
  AlertCircle,
  FileUp,
  Copy,
  Check,
  Eye,
  EyeOff,
  Settings,
  Download,
  Ban,
} from 'lucide-react';

export function RepositoryList() {
  const { repositories, isLoading, error, deleteRepository, updateVisibility, updateDownloadPermission } = useRepositories();
  const { user } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState<Repository | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedRepo, setCopiedRepo] = useState<string | null>(null);

  const handleVisibilityToggle = async (repo: Repository) => {
    setActionLoading(`visibility-${repo.uuid}`);
    
    try {
      const newVisibility = !repo.public;
      await updateVisibility(repo.uuid, newVisibility);
      
      // 非公開に変更した場合、ダウンロード許可も自動的にオフにする
      if (!newVisibility && repo.download_allowed) {
        await updateDownloadPermission(repo.uuid, false);
      }
    } catch (err) {
      console.error('リポジトリ可視性更新エラー:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPermissionToggle = async (repo: Repository) => {
    // 非公開リポジトリではダウンロード許可を変更できない
    if (!repo.public) return;
    
    setActionLoading(`download-${repo.uuid}`);
    
    try {
      await updateDownloadPermission(repo.uuid, !repo.download_allowed);
    } catch (err) {
      console.error('ダウンロード設定更新エラー:', err);
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

  const copyShareUrl = (repo: Repository) => {
    if (!repo.public) return;
    
    const shareUrl = `${window.location.origin}/${user?.username}/${repo.uuid}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopiedRepo(repo.uuid);
        // 2秒後に表示をリセット
        setTimeout(() => setCopiedRepo(null), 2000);
      })
      .catch(err => console.error('URLのコピーに失敗しました:', err));
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
                <div className="flex items-center gap-2">
                  {repo.public ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      限定公開
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      非公開
                    </span>
                  )}
                  {repo.public && (
                    repo.download_allowed ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        <Download className="h-3 w-3 mr-1" />
                        DL可
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        <Ban className="h-3 w-3 mr-1" />
                        DL不可
                      </span>
                    )
                  )}
                </div>
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
                    onClick={() => copyShareUrl(repo)}
                  >
                    {copiedRepo === repo.uuid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-blue-500" />
                    )}
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>リポジトリ設定</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => handleVisibilityToggle(repo)}
                      disabled={actionLoading === `visibility-${repo.uuid}`}
                    >
                      {actionLoading === `visibility-${repo.uuid}` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : repo.public ? (
                        <EyeOff className="mr-2 h-4 w-4" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      {repo.public ? '非公開にする' : '限定公開にする'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => handleDownloadPermissionToggle(repo)}
                      disabled={actionLoading === `download-${repo.uuid}` || !repo.public}
                    >
                      {actionLoading === `download-${repo.uuid}` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : repo.download_allowed ? (
                        <Ban className="mr-2 h-4 w-4" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      {repo.download_allowed ? 'ダウンロードを禁止' : 'ダウンロードを許可'}
                      {!repo.public && (
                        <span className="ml-2 text-xs text-gray-500">(非公開リポジトリ)</span>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => setDeleteConfirm(repo)}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// 認証タイプの設定
const AUTH_TYPE = process.env.NEXT_PUBLIC_AUTH_TYPE || 'session';

// ユーザー名変更フォームのバリデーションスキーマ
const usernameSchema = z.object({
  newUsername: z.string().min(3, {
    message: 'ユーザー名は3文字以上必要です',
  }),
});

export default function SettingsPage() {
  const { user, updateUsername, checkUsername, deleteAccount } = useAuth();
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
  const [isUpdateError, setIsUpdateError] = useState<string | null>(null);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError: setFormError,
    clearErrors,
    formState: { errors },
  } = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      newUsername: '',
    },
  });

  const newUsername = watch('newUsername');

  // ユーザー名の可用性をチェック
  const checkUsernameAvailability = async () => {
    if (newUsername.length < 3) return;
    if (newUsername === user?.username) {
      setIsUsernameAvailable(null);
      setFormError('newUsername', {
        type: 'manual',
        message: '現在のユーザー名と同じです'
      });
      return;
    }
    
    setIsCheckingUsername(true);
    setIsUsernameAvailable(null);
    
    try {
      const isAvailable = await checkUsername(newUsername);
      setIsUsernameAvailable(isAvailable);
      
      if (!isAvailable) {
        setFormError('newUsername', {
          type: 'manual',
          message: 'このユーザー名は既に使用されています'
        });
      } else {
        clearErrors('newUsername');
      }
    } catch (err) {
      console.error('ユーザー名チェックエラー:', err);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // ユーザー名変更
  const onSubmit = async (data: z.infer<typeof usernameSchema>) => {
    setIsUpdateLoading(true);
    setIsUpdateSuccess(false);
    setIsUpdateError(null);

    try {
      // 最終チェック
      if (data.newUsername === user?.username) {
        setIsUpdateError('現在のユーザー名と同じです');
        return;
      }

      const isAvailable = await checkUsername(data.newUsername);
      if (!isAvailable) {
        setIsUpdateError('このユーザー名は既に使用されています');
        return;
      }

      const result = await updateUsername(data.newUsername);
      if (result.success) {
        setIsUpdateSuccess(true);
      } else {
        setIsUpdateError(result.error || 'ユーザー名の更新に失敗しました');
      }
    } catch (err) {
      console.error('ユーザー名更新エラー:', err);
      setIsUpdateError('ユーザー名の更新中にエラーが発生しました');
    } finally {
      setIsUpdateLoading(false);
    }
  };

  // アカウント削除
  const handleDeleteAccount = async () => {
    setIsDeleteLoading(true);
    
    try {
      await deleteAccount();
      // 削除成功時はAuthProviderによってリダイレクトされるため、ここでは何もしない
    } catch (err) {
      console.error('アカウント削除エラー:', err);
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">アカウント設定</h1>
        <p className="text-gray-500 dark:text-gray-400">
          アカウント情報の管理と設定を行います。
        </p>
      </div>

      <div className="space-y-6 max-w-md">
        {/* アカウント情報 */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">アカウント情報</h2>
          <div className="space-y-2">
            <div>
              <Label>ユーザー名</Label>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                {user?.username}
              </div>
            </div>
            
            {AUTH_TYPE === 'cognito' && user?.email && (
              <div>
                <Label>メールアドレス</Label>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  {user.email}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ユーザー名変更フォーム (セッション認証の場合のみ) */}
        {AUTH_TYPE !== 'cognito' && (
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">ユーザー名変更</h2>
            
            {isUpdateSuccess && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle size={16} />
                <span>ユーザー名が正常に更新されました</span>
              </div>
            )}
            
            {isUpdateError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={16} />
                <span>{isUpdateError}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUsername">新しいユーザー名</Label>
                <div className="relative">
                  <Input
                    id="newUsername"
                    placeholder="新しいユーザー名を入力"
                    {...register('newUsername')}
                    onBlur={checkUsernameAvailability}
                    onChange={() => {
                      if (isUsernameAvailable !== null) {
                        setIsUsernameAvailable(null);
                      }
                    }}
                  />
                  {isCheckingUsername && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="h-4 w-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                  {isUsernameAvailable === true && !isCheckingUsername && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.newUsername && (
                  <p className="text-sm text-red-500">{errors.newUsername.message}</p>
                )}
              </div>
              
              <Button type="submit" disabled={isUpdateLoading || !isUsernameAvailable}>
                {isUpdateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : '更新する'}
              </Button>
            </form>
          </div>
        )}

        {/* アカウント削除 */}
        <div className="border border-red-200 dark:border-red-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">危険ゾーン</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            アカウントを削除すると、すべてのリポジトリとファイルも完全に削除されます。この操作は元に戻せません。
          </p>
          
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            アカウントを削除
          </Button>
        </div>
      </div>
      
      {/* アカウント削除確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アカウントの削除</AlertDialogTitle>
            <AlertDialogDescription>
              本当にアカウントを削除しますか？この操作を行うと、すべてのリポジトリとファイルが完全に削除され、元に戻すことはできません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteAccount}
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  削除中...
                </>
              ) : '削除する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
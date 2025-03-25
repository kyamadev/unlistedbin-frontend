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

const AUTH_TYPE = process.env.NEXT_PUBLIC_AUTH_TYPE || 'session';

const usernameSchema = z.object({
  newUsername: z.string().min(3, {
    message: 'ユーザー名は3文字以上必要です',
  }),
});

export default function SettingsPage() {
  const { user, updateUsername, checkUsername, deleteAccount, updateEmail, confirmEmail } = useAuth();
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
  const [isUpdateError, setIsUpdateError] = useState<string | null>(null);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isEmailUpdateSuccess, setIsEmailUpdateSuccess] = useState(false);
  const [isEmailUpdateError, setIsEmailUpdateError] = useState<string | null>(null);
  const [isEmailUpdateLoading, setIsEmailUpdateLoading] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const emailSchema = z.object({
    newEmail: z.string().email({
      message: '有効なメールアドレスを入力してください',
    }),
  });

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    watch: watchEmail,
    formState: { errors: emailErrors },
    setError: setEmailError,
    clearErrors: clearEmailErrors,
  } = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
    },
  });

  const newEmail = watchEmail('newEmail');

  const checkEmailAvailability = async () => {
    if (!newEmail || !newEmail.includes('@')) return;
    if (newEmail === user?.email) {
      setIsEmailAvailable(null);
      setEmailError('newEmail', {
        type: 'manual',
        message: '現在のメールアドレスと同じです'
      });
      return;
    }
    
    setIsCheckingEmail(true);
    setIsEmailAvailable(null);
    
    try {
      setIsEmailAvailable(true);
      clearEmailErrors('newEmail');
    } catch (err) {
      console.error('メールアドレスチェックエラー:', err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setVerificationError('確認コードを入力してください');
      return;
    }
    
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const result = await confirmEmail(verificationCode);
      if (result.success) {
        setVerificationSuccess(true);
        setIsEmailUpdateSuccess(false);
        setShowVerificationForm(false);
      } else {
        if (result.error?.includes("EXPIRED_REQUEST") || result.error?.includes("有効期限")) {
          setVerificationError('確認コードの有効期限が切れています。メールアドレスの変更を再度開始してください。');
          setTimeout(() => {
            setShowVerificationForm(false);
            setVerificationError(null);
          }, 3000);
        } else if (result.error?.includes("CodeMismatch")) {
          setVerificationError('確認コードが正しくありません。再度確認してください。');
        } else {
          setVerificationError(result.error || '確認に失敗しました');
        }
      }
    } catch (err) {
      console.error('メール確認エラー:', err);
      setVerificationError('確認処理中にエラーが発生しました');
    } finally {
      setIsVerifying(false);
    }
  };

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('newEmail') as HTMLInputElement;
    const newEmailValue = emailInput.value.trim();
    
    setIsEmailUpdateLoading(true);
    setIsEmailUpdateSuccess(false);
    setIsEmailUpdateError(null);
    setVerificationSuccess(false);
  
    if (!newEmailValue) {
      setIsEmailUpdateError('メールアドレスを入力してください');
      setIsEmailUpdateLoading(false);
      return;
    }
  
    if (newEmailValue === user?.email) {
      setIsEmailUpdateError('現在のメールアドレスと同じです');
      setIsEmailUpdateLoading(false);
      return;
    }
  
    try {
      const result = await updateEmail(newEmailValue);
      if (result.success) {
        setIsEmailUpdateSuccess(true);
        setShowVerificationForm(true);
      } else {
        if (result.error?.includes("EXPIRED_REQUEST")) {
          setIsEmailUpdateError('確認コードの有効期限が切れています。再度メールアドレスの変更を行ってください。');
        } else {
          setIsEmailUpdateError(result.error || 'メールアドレスの更新に失敗しました');
        }
      }
    } catch (err) {
      console.error('メールアドレス更新エラー:', err);
      setIsEmailUpdateError('メールアドレスの更新中にエラーが発生しました');
    } finally {
      setIsEmailUpdateLoading(false);
    }
  };

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
            
            {/* 保留中のメールアドレスがある場合に表示 */}
            {AUTH_TYPE === 'cognito' && user?.pending_email && (
              <div>
                <Label>確認待ちのメールアドレス</Label>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded flex items-center">
                  <span className="text-amber-600 mr-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                  </span>
                  {user.pending_email}
                  <span className="ml-2 text-sm text-gray-500">
                    （確認待ち）
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  確認コードは24時間有効です。期限切れの場合は再度メールアドレス変更を行ってください。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* メールアドレス変更フォーム */}
        {AUTH_TYPE === 'cognito' && (
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">メールアドレス変更</h2>
            
            {isEmailUpdateSuccess && !verificationSuccess && (
              <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle size={16} />
                <span>新しいメールアドレスに確認コードを送信しました。メールをご確認ください。</span>
              </div>
            )}
            
            {verificationSuccess && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle size={16} />
                <span>メールアドレスが正常に変更されました。</span>
              </div>
            )}
            
            {isEmailUpdateError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={16} />
                <span>{isEmailUpdateError}</span>
              </div>
            )}
            
            <form onSubmit={onEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">新しいメールアドレス</Label>
                <div className="relative">
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="新しいメールアドレスを入力"
                    defaultValue=""
                  />
                </div>
                {isEmailUpdateError && !isEmailUpdateSuccess && (
                  <p className="text-sm text-red-500">{isEmailUpdateError}</p>
                )}
                <p className="text-xs text-gray-500">
                  新しいメールアドレスには確認メールが送信されます
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={isEmailUpdateLoading}
              >
                {isEmailUpdateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : '更新する'}
              </Button>
            </form>
            
            {showVerificationForm && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-md font-medium mb-3">メールアドレスの確認</h3>
                
                {verificationSuccess && (
                  <div className="mb-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle size={16} />
                    <span>メールアドレスが正常に確認されました</span>
                  </div>
                )}
                
                {verificationError && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={16} />
                    <span>{verificationError}</span>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  新しいメールアドレスに確認コードを送信しました。
                  以下に確認コードを入力して、メールアドレスの変更を完了してください。
                </p>
                
                <form onSubmit={handleEmailVerification} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">確認コード</Label>
                    <Input
                      id="verificationCode"
                      placeholder="確認コードを入力"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isVerifying}>
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          確認中...
                        </>
                      ) : '確認する'}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowVerificationForm(false)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* アカウント削除 */}
        <div className="border border-red-200 dark:border-red-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">アカウント削除</h2>
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
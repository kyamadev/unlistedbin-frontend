import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';

// パスワードリセット確認フォームのスキーマ
const resetPasswordSchema = z.object({
  username: z.string().min(1, {
    message: 'メールアドレスを入力してください',
  }),
  code: z.string().min(1, {
    message: '確認コードを入力してください',
  }),
  newPassword: z.string().min(8, {
    message: '新しいパスワードは8文字以上必要です',
  }),
  confirmPassword: z.string().min(1, {
    message: 'パスワード（確認）を入力してください',
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

export function ResetPasswordForm({ email }: { email?: string }) {
  const { confirmResetPassword } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      username: email || '',
    },
  });

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await confirmResetPassword(
        data.username,
        data.code,
        data.newPassword
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(result.error || 'パスワードのリセットに失敗しました');
      }
    } catch (err: any) {
      console.error('パスワードリセットエラー:', err);
      setError('パスワードリセット処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold">パスワードが変更されました</h1>
        <p className="text-gray-600 dark:text-gray-400">
          パスワードが正常に変更されました。新しいパスワードでログインできます。
        </p>
        <Button asChild className="mt-4">
          <Link href="/login">ログイン画面へ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">パスワードリセット</h1>
        <p className="text-gray-500 dark:text-gray-400">
          メールで受け取った6桁の確認コードを入力し、新しいパスワードを設定してください。
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">メールアドレス</Label>
          <Input
            id="username"
            type="email"
            placeholder="登録したメールアドレスを入力"
            {...register('username')}
          />
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">確認コード</Label>
          <Input
            id="code"
            placeholder="メールで受け取った6桁のコードを入力"
            {...register('code')}
          />
          {errors.code && (
            <p className="text-sm text-red-500">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">新しいパスワード</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="新しいパスワードを入力"
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          )}
          <p className="text-xs text-gray-500">
            パスワードは8文字以上で、大文字・小文字・数字・記号を含める必要があります。
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">パスワード（確認）</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="新しいパスワードを再入力"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '処理中...' : 'パスワードをリセット'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link
          href="/login"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}
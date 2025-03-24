import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: '有効なメールアドレスを入力してください',
  }),
});

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [destination, setDestination] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await resetPassword(data.email);
      
      if (result.success) {
        setSuccess(true);
        if (result.destination) {
          setDestination(result.destination);
        }
      } else {
        setError(result.error || 'パスワードリセットの要求に失敗しました');
      }
    } catch (err) {
      console.error('パスワードリセットエラー:', err);
      setError('パスワードリセットの処理中にエラーが発生しました');
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
        <h1 className="text-2xl font-bold">パスワードリセット要求を送信しました</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {destination ? (
            <>
              確認メールを <strong>{destination}</strong> に送信しました。
            </>
          ) : (
            <>メールアドレスに確認メールを送信しました。</>
          )}
          メール内のリンクからパスワードのリセット手続きを完了してください。
        </p>
        <Button asChild className="mt-4">
          <Link href="/login">ログイン画面に戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">パスワードをお忘れですか？</h1>
        <p className="text-gray-500 dark:text-gray-400">
          アカウントに登録されているメールアドレスを入力してください。
          パスワードリセット用のリンクを送信します。
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
          <Label htmlFor="email">メールアドレス</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="登録したメールアドレスを入力"
              {...register('email')}
              className="pl-10"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '送信中...' : 'リセットリンクを送信'}
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
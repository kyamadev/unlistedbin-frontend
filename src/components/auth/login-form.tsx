import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail } from 'lucide-react';

const loginSchema = z.object({
  identifier: z.string().min(1, {
    message: 'メールアドレスまたはユーザー名を入力してください',
  }),
  password: z.string().min(1, {
    message: 'パスワードを入力してください',
  }),
});

export function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const identifier = watch('identifier');
  const isEmailLike = identifier.includes('@');

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('ログイン試行:', {
        identifier: data.identifier,
        isEmailLike,
      });
      
      const result = await login(data.identifier, data.password);
      if (!result.success) {
        setError(result.error || 'メールアドレス/ユーザー名またはパスワードが正しくありません');
      }
    } catch (err) {
      console.error('ログインエラー:', err);
      setError('ログイン処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">ログイン</h1>
        <p className="text-gray-500 dark:text-gray-400">
          メールアドレスまたはユーザー名でログインしてください
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
          <Label htmlFor="identifier">メールアドレスまたはユーザー名</Label>
          <div className="relative">
            <Input
              id="identifier"
              type={isEmailLike ? "email" : "text"}
              placeholder="メールアドレスまたはユーザー名を入力"
              {...register('identifier')}
              className={isEmailLike ? "pl-10" : ""}
            />
            {isEmailLike && (
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            )}
          </div>
          {errors.identifier && (
            <p className="text-sm text-red-500">{errors.identifier.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">パスワード</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              パスワードをお忘れですか？
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="パスワードを入力"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        アカウントをお持ちでないですか？{' '}
        <Link
          href="/signup"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          新規登録
        </Link>
      </div>
    </div>
  );
}
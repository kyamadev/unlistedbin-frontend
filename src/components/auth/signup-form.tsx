'use client';

import { useState, useEffect } from 'react';
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

// 認証タイプの設定
const AUTH_TYPE = process.env.NEXT_PUBLIC_AUTH_TYPE || 'session';

// サインアップフォームのバリデーションスキーマ
const signupSchema = z.object({
  username: z.string().min(3, {
    message: 'ユーザー名は3文字以上必要です',
  }),
  email: AUTH_TYPE === 'cognito' 
    ? z.string().email({ message: '有効なメールアドレスを入力してください' })
    : z.string().optional(),
  password: z.string().min(8, {
    message: 'パスワードは8文字以上必要です',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

export function SignupForm() {
  const { signup, checkUsername } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError: setFormError,
    clearErrors,
    trigger,
  } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const usernameField = register('username');
  const username = watch('username');
  
  // ユーザー名が変更されたときにエラーをクリア
  useEffect(() => {
    if (username.length >= 3) {
      clearErrors('username');
    }
  }, [username, clearErrors]);

  // ユーザー名の可用性をチェック
  const checkUsernameAvailability = async () => {
    if (username.length < 3) return;
    
    setIsCheckingUsername(true);
    setIsUsernameAvailable(null);
    
    try {
      const isAvailable = await checkUsername(username);
      setIsUsernameAvailable(isAvailable);
      
      if (!isAvailable) {
        setFormError('username', { 
          type: 'manual', 
          message: 'このユーザー名は既に使用されています' 
        });
      } else {
        // ユーザー名が利用可能な場合は明示的にエラーをクリア
        clearErrors('username');
        // 他のフィールドの検証を再実行
        trigger();
      }
    } catch (err) {
      console.error('ユーザー名チェックエラー:', err);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    // フォームが有効でなければ処理を中断
    if (!isValid) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);
  
    try {
      // ユーザー名の可用性を最終確認
      const isAvailable = await checkUsername(data.username);
      if (!isAvailable) {
        setError('このユーザー名は既に使用されています');
        setIsLoading(false);
        return;
      }
  
      const result = await signup(data.username, data.password, data.email);
      
      if (result.success) {
        if (AUTH_TYPE === 'cognito') {
          // Cognitoの場合は確認ページにリダイレクト
          router.push(`/confirm?username=${encodeURIComponent(data.username)}`);
        } else {
          // セッション認証の場合は直接ログインページへ
          router.push('/login?registered=1');
        }
      } else {
        setError(result.error || 'アカウント作成に失敗しました');
      }
    } catch (err) {
      setError('アカウント作成中にエラーが発生しました');
      console.error(err);
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
        <h1 className="text-2xl font-bold">確認メールを送信しました</h1>
        <p>
          メールに記載されている確認コードを使用して、アカウントを有効化してください。
        </p>
        <Button asChild className="w-full">
          <Link href="/login">ログインページへ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">アカウント作成</h1>
        <p className="text-gray-500 dark:text-gray-400">
          必要な情報を入力してアカウントを作成してください
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
          <Label htmlFor="username">ユーザー名</Label>
          <div className="relative">
          <Input
            id="username"
            placeholder="ユーザー名を入力"
            {...usernameField}
            onBlur={(e) => {
              // react-hook-form の onBlur を呼び出す
              usernameField.onBlur(e);
              // その後、ユーザー名の可用性チェックを実行
              checkUsernameAvailability();
            }}
            onChange={(e) => {
              usernameField.onChange(e);
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
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>
        
        {AUTH_TYPE === 'cognito' && (
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="メールアドレスを入力"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
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
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">パスワード（確認）</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="パスワードを再入力"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || (username.length >= 3 && isUsernameAvailable === false)}
        >
          {isLoading ? '登録中...' : 'アカウント作成'}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        既にアカウントをお持ちですか？{' '}
        <Link
          href="/login"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          ログイン
        </Link>
      </div>
    </div>
  );
}
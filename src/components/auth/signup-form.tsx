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

const AUTH_TYPE = process.env.NEXT_PUBLIC_AUTH_TYPE || 'session';

const signupSchema = z.object({
  email: z.string().email({ 
    message: '有効なメールアドレスを入力してください' 
  }),
  
  username: z.string().min(3, {
    message: 'ユーザー名は3文字以上必要です',
  }).max(30, {
    message: 'ユーザー名は30文字以下にしてください',
  }).optional(),
  
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
    setValue,
    setError: setFormError,
    clearErrors,
    trigger,
  } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const email = watch('email');
  const username = watch('username');
  
  useEffect(() => {
    if (email && !username) {
      const localPart = email.split('@')[0];
      const cleanUsername = localPart.replace(/[.+]/g, '');
      setValue('username', cleanUsername);
    }
  }, [email, username, setValue]);

  const checkUsernameAvailability = async () => {
    if (!username || username.length < 3) return;
    
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
        clearErrors('username');
        trigger();
      }
    } catch (err) {
      console.error('ユーザー名チェックエラー:', err);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    if (!isValid) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);
  
    try {
      const finalUsername = data.username || data.email.split('@')[0].replace(/[.+]/g, '');
      
      const isAvailable = await checkUsername(finalUsername);
      if (!isAvailable) {
        setError('このユーザー名は既に使用されています');
        setIsLoading(false);
        return;
      }
  
      const result = await signup(finalUsername, data.password, data.email);
      
      if (result.success) {
        if (AUTH_TYPE === 'cognito') {
          router.push(`/confirm?username=${encodeURIComponent(data.email)}`);
        } else {
          router.push('/login?registered=1');
        }
      } else {
        setError(result.error || 'アカウント作成に失敗しました');
      }
    } catch (err: any) {
      console.error('アカウント作成中にエラーが発生しました:', err);
      setError('アカウント作成中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">アカウント作成</h1>
        <p className="text-gray-500 dark:text-gray-400">
          メールアドレスとパスワードを入力してアカウントを作成してください
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
          <Input
            id="email"
            type="email"
            placeholder="メールアドレスを入力"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
          <p className="text-xs text-gray-500">
            このメールアドレスでログインできます
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="username">ユーザー名 (オプション)</Label>
            <span className="text-xs text-gray-500">自動生成されます</span>
          </div>
          <div className="relative">
            <Input
              id="username"
              placeholder="ユーザー名を入力"
              {...register('username')}
              onBlur={(e) => {
                if (e.target.value) {
                  checkUsernameAvailability();
                }
              }}
            />
            {isCheckingUsername && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
            {isUsernameAvailable === true && !isCheckingUsername && username && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username.message}</p>
          )}
          <p className="text-xs text-gray-500">
            3〜30文字の英数字。メールアドレスの代わりにログインに使用できます。
          </p>
        </div>
        
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
          disabled={isLoading || (!!username && username.length >= 3 && isUsernameAvailable === false)}
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
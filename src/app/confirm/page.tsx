'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function ConfirmPage() {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { confirmSignUp, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URLからユーザー名を取得
  useEffect(() => {
    const usernameParam = searchParams.get('username');
    if (usernameParam) {
      setUsername(usernameParam);
    }
  }, [searchParams]);
  
  // 認証済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !code) {
      setError('ユーザー名と確認コードを入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (confirmSignUp) {
        const result = await confirmSignUp(username, code);
        if (result.success) {
          setIsSuccess(true);
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setError(result.error || '確認コードの検証に失敗しました');
        }
      } else {
        setError('確認機能が利用できません');
      }
    } catch (err: any) {
      setError(err.message || '確認処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">アカウント確認完了</h1>
        <p className="mb-4">アカウントが正常に確認されました。ログインを続行できます。</p>
        <Button asChild className="w-full">
          <Link href="/login">ログイン画面へ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="border rounded-lg p-6 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">アカウント確認</h1>
            <p className="text-gray-500 dark:text-gray-400">
              メールで送信された確認コードを入力してください
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="登録したユーザー名を入力"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">確認コード</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="確認コードを入力"
                required
              />
              <p className="text-sm text-gray-500">
                メールに送信された6桁のコードを入力してください
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '処理中...' : '確認する'}
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
      </div>
    </div>
  );
}
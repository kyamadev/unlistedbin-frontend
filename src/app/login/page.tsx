'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/providers/auth-provider';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]">読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      {registered && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-md flex items-center gap-3 text-green-700 dark:text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>アカウントが正常に作成されました。ログインしてください。</p>
        </div>
      )}
      <div className="border rounded-lg p-6 shadow-sm">
        <LoginForm />
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/providers/auth-provider';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleAuthRedirect = useCallback(() => {
    if (isAuthenticated && !isRedirecting && !isLoading) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [isAuthenticated, isRedirecting, isLoading, router]);

  useEffect(() => {
    handleAuthRedirect();
  }, [handleAuthRedirect]);

  if (isLoading && !isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">ダッシュボードに移動中...</p>
      </div>
    );
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
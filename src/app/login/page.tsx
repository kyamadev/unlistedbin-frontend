'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/providers/auth-provider';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 認証済みの場合のリダイレクト処理を修正
  useEffect(() => {
    let isMounted = true;
    
    const checkAuthAndRedirect = async () => {
      // ロード中は何もしない
      if (isLoading) return;
      
      // 認証済みかつリダイレクト中でない場合のみ処理
      if (isAuthenticated && !isRedirecting && isMounted) {
        setIsRedirecting(true);
        
        // スムーズな遷移のため、少し遅延させる
        setTimeout(() => {
          if (isMounted) {
            // window.locationでなくrouterを使う
            router.push('/dashboard');
          }
        }, 100);
      }
    };
    
    checkAuthAndRedirect();
    
    // クリーンアップ関数
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading, router, isRedirecting]);

  // ロード中の表示
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">読み込み中...</p>
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
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/auth/signup-form';
import { useAuth } from '@/providers/auth-provider';

export default function SignupPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // 認証済みの場合はダッシュボードにリダイレクト
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
      <div className="border rounded-lg p-6 shadow-sm">
        <SignupForm />
      </div>
    </div>
  );
}
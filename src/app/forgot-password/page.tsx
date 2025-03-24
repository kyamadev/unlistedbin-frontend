'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
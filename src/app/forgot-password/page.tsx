'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ForgotPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showResetForm, setShowResetForm] = useState(false);
  const [email, setEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    // URLパラメータからメールを取得
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setShowResetForm(true);
    }

    // 認証済みならダッシュボードへリダイレクト
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]">読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="border rounded-lg p-6 shadow-sm">
        {showResetForm ? (
          <ResetPasswordForm email={email} />
        ) : (
          <ForgotPasswordForm 
            onEmailSent={(sentEmail) => {
              setEmail(sentEmail);
              setShowResetForm(true);
            }} 
          />
        )}
      </div>
    </div>
  );
}
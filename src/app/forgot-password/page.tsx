'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Loader2 } from 'lucide-react';

function ForgotPasswordContent() {
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

function ForgotPasswordFallback() {
  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
      <p className="text-gray-500">読み込み中...</p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
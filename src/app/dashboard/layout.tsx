'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Loader2, LayoutDashboard, Upload, Settings } from 'lucide-react';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 認証チェック
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // ナビゲーションリンクのアクティブ状態を判定
  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') {
      return true;
    }
    if (path !== '/dashboard' && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
      {/* サイドバーナビゲーション */}
      <aside className="md:border-r pr-4">
        <nav className="space-y-2 sticky top-4">
          <Button
            variant={isActive('/dashboard') ? 'default' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              ダッシュボード
            </Link>
          </Button>
          
          <Button
            variant={isActive('/dashboard/upload') ? 'default' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard/upload">
              <Upload className="mr-2 h-4 w-4" />
              ファイルアップロード
            </Link>
          </Button>
          
          <Button
            variant={isActive('/dashboard/settings') ? 'default' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              アカウント設定
            </Link>
          </Button>
        </nav>
      </aside>
      
      {/* メインコンテンツ */}
      <main className="min-w-0">
        {children}
      </main>
    </div>
  );
}
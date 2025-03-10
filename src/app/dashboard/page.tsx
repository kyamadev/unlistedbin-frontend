'use client';

import { useAuth } from '@/providers/auth-provider';
import { RepositoryList } from '@/components/repository/repository-list';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">ダッシュボード</h1>
        <p className="text-gray-500 dark:text-gray-400">
          こんにちは、{user?.username || 'ユーザー'}さん！ あなたのリポジトリを管理できます。
        </p>
      </div>
      
      <RepositoryList />
    </div>
  );
}
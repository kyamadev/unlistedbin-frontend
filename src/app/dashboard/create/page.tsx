'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRepositories } from '@/hooks/use-repositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';

export default function CreateRepositoryPage() {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createRepository } = useRepositories();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('リポジトリ名を入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const repo = await createRepository(name, isPublic);
      if (repo) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('リポジトリ作成エラー:', err);
      setError(err.response?.data?.error || 'リポジトリの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">新規リポジトリ作成</h1>
        <p className="text-gray-500 dark:text-gray-400">
          新しい空のリポジトリを作成します。後からファイルをアップロードできます。
        </p>
      </div>
      
      <div className="max-w-md">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-6">
          <div className="space-y-2">
            <Label htmlFor="name">リポジトリ名</Label>
            <Input
              id="name"
              placeholder="リポジトリ名を入力"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">公開リポジトリにする</Label>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '作成中...' : 'リポジトリを作成'}
          </Button>
        </form>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { repositoryApi, Repository } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // リポジトリ一覧を取得
  const fetchRepositories = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await repositoryApi.getRepositories();
      setRepositories(data);
    } catch (err) {
      console.error('リポジトリ取得エラー:', err);
      setError('リポジトリの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // リポジトリ作成
  const createRepository = async (name: string, isPublic: boolean): Promise<Repository | null> => {
    try {
      const newRepo = await repositoryApi.createRepository({
        name,
        public: isPublic
      });
      
      setRepositories(prev => [...prev, newRepo]);
      return newRepo;
    } catch (err) {
      console.error('リポジトリ作成エラー:', err);
      throw err;
    }
  };

  // リポジトリ可視性更新
  const updateVisibility = async (uuid: string, isPublic: boolean): Promise<Repository | null> => {
    try {
      const updated = await repositoryApi.updateVisibility(uuid, isPublic);
      
      setRepositories(prev => 
        prev.map(repo => repo.uuid === uuid ? { ...repo, public: isPublic } : repo)
      );
      
      return updated;
    } catch (err) {
      console.error('リポジトリ設定更新エラー:', err);
      throw err;
    }
  };

  // リポジトリ削除
  const deleteRepository = async (uuid: string): Promise<boolean> => {
    try {
      await repositoryApi.deleteRepository(uuid);
      setRepositories(prev => prev.filter(repo => repo.uuid !== uuid));
      return true;
    } catch (err) {
      console.error('リポジトリ削除エラー:', err);
      return false;
    }
  };

  // 認証状態が変わったらリポジトリ一覧を取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchRepositories();
    } else {
      setRepositories([]);
    }
  }, [isAuthenticated, fetchRepositories]);

  return {
    repositories,
    isLoading,
    error,
    fetchRepositories,
    createRepository,
    updateVisibility,
    deleteRepository
  };
}
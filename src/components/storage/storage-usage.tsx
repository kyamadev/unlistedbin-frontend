'use client';

import { useAuth } from '@/providers/auth-provider';
import { formatFileSize } from '@/lib/utils';

export function StorageUsage() {
  const { user } = useAuth();
  
  // ユーザー情報がない場合は表示しない
  if (!user) return null;
  
  const storageUsed = user.storage_used || 0;
  const storageLimit = user.storage_limit || 1073741824; // 1GB
  const usagePercentage = Math.min(100, Math.floor((storageUsed / storageLimit) * 100));
  
  const getBarColor = () => {
    if (usagePercentage > 90) return 'bg-red-500';
    if (usagePercentage > 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };
  
  return (
    <div className="mb-6 p-4 border rounded-lg">
      <h3 className="font-medium mb-2">ストレージ使用状況</h3>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
        <div 
          className={`h-2.5 rounded-full ${getBarColor()}`} 
          style={{ width: `${usagePercentage}%` }}
        ></div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
        <span>
          {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)} 使用中
        </span>
        <span className={`font-medium ${usagePercentage > 90 ? 'text-red-500' : ''}`}>
          {usagePercentage}%
        </span>
      </div>
      
      {usagePercentage > 90 && (
        <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          ストレージ容量がほぼいっぱいです。古いファイルを削除して容量を確保してください。
        </div>
      )}
    </div>
  );
}
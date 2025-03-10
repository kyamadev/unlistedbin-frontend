import axios from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const AUTH_TYPE = process.env.NEXT_PUBLIC_AUTH_TYPE || 'session';

// 認証ヘッダーの取得
const getAuthHeaders = async () => {
  if (AUTH_TYPE === 'cognito') {
    try {
      const { tokens } = await fetchAuthSession();
      if (tokens?.idToken) {
        return {
          Authorization: `Bearer ${tokens.idToken.toString()}`,
        };
      }
      console.warn('ID token not found in auth session');
      return {};
    } catch (error) {
      console.error('認証トークン取得エラー:', error);
      return {};
    }
  }
  return {};
};

// 汎用APIクライアント
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // セッションCookieを使用
});

// リクエストインターセプター
api.interceptors.request.use(async (config) => {
  if (AUTH_TYPE === 'cognito') {
    const headers = await getAuthHeaders();
    if (headers.Authorization) {
      config.headers.Authorization = headers.Authorization;
    }
  }
  return config;
});

// リポジトリ型定義
export interface Repository {
  id?: number;
  uuid: string;
  name: string;
  public: boolean;
  owner_id?: number;
  created_at?: string;
  updated_at?: string;
}

// ファイル型定義
export interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

// ディレクトリ内容型定義
export interface DirectoryContents {
  username: string;
  repo_uuid: string;
  directory: string;
  entries: string[];
  isDirectory: true;
}

// ファイル内容型定義
export interface FileContents {
  username: string;
  repo_uuid: string;
  filepath: string;
  data: string;
  isDirectory: false;
}

// リポジトリAPI
export const repositoryApi = {
  // リポジトリ一覧取得
  getRepositories: async (): Promise<Repository[]> => {
    const response = await api.get('/repositories');
    return response.data;
  },

  // リポジトリ作成
  createRepository: async (data: { name: string; public: boolean }): Promise<Repository> => {
    const response = await api.post('/repositories', data);
    return response.data;
  },

  // リポジトリ可視性更新
  updateVisibility: async (uuid: string, isPublic: boolean): Promise<Repository> => {
    const response = await api.put(`/repositories/${uuid}/visibility`, { public: isPublic });
    return response.data;
  },

  // リポジトリ削除
  deleteRepository: async (uuid: string): Promise<void> => {
    await api.delete(`/repositories/${uuid}`);
  },
};

// ファイルAPI
export const fileApi = {
  // ファイル・ディレクトリの内容取得
  getContents: async (username: string, repoUuid: string, path: string = ''): Promise<FileContents | DirectoryContents> => {
    const response = await api.get(`/${username}/${repoUuid}/${path}`);
    return response.data;
  },

  // ファイルアップロード（単一ファイル）
  uploadFile: async (file: File, repoName: string, isPublic: boolean): Promise<{ repo_uuid: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('repository_name', repoName);
    formData.append('public', isPublic ? 'true' : 'false');

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ZIPファイルアップロード
  uploadZip: async (zipFile: File, repoName: string, isPublic: boolean): Promise<{ repo_uuid: string }> => {
    const formData = new FormData();
    formData.append('zip_file', zipFile);
    formData.append('repository_name', repoName);
    formData.append('public', isPublic ? 'true' : 'false');

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
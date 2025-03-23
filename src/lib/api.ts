import axios from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const AUTH_TYPE = process.env.NEXT_PUBLIC_AUTH_TYPE || 'session';

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

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // セッションCookieを使用
});

api.interceptors.request.use(async (config) => {
  if (AUTH_TYPE === 'cognito') {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (token) {
        console.log('Adding auth token to request');
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('No auth token available');
      }
    } catch (error) {
      console.error('Error fetching auth session:', error);
    }
  }
  return config;
});

export interface Repository {
  id?: number;
  uuid: string;
  name: string;
  public: boolean;
  owner_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

export interface DirectoryContents {
  username: string;
  repo_uuid: string;
  directory: string;
  entries: string[];
  isDirectory: true;
}

export interface FileContents {
  username: string;
  repo_uuid: string;
  filepath: string;
  data: string;
  isDirectory: false;
}

export const repositoryApi = {
  getRepositories: async (): Promise<Repository[]> => {
    const response = await api.get('/repositories');
    return response.data;
  },

  createRepository: async (data: { name: string; public: boolean }): Promise<Repository> => {
    const response = await api.post('/repositories', data);
    return response.data;
  },

  updateVisibility: async (uuid: string, isPublic: boolean): Promise<Repository> => {
    const response = await api.put(`/repositories/${uuid}/visibility`, { public: isPublic });
    return response.data;
  },

  deleteRepository: async (uuid: string): Promise<void> => {
    await api.delete(`/repositories/${uuid}`);
  },
};

export const fileApi = {
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
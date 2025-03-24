import axios from 'axios';
import { addCSRFToken, ensureCSRFToken } from './csrf';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  addCSRFToken,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // 認証情報をリセットするなどの処理が必要な場合はここで行う
      }
      
      if (error.response.status === 403 && 
          error.response.data?.error?.includes('CSRF')) {
        console.error('CSRF検証エラー、トークンを再取得します');
        ensureCSRFToken();
      }
    }
    
    return Promise.reject(error);
  }
);

export interface Repository {
  id?: number;
  uuid: string;
  name: string;
  public: boolean;
  owner_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FileContents {
  username: string;
  repo_uuid: string;
  filepath: string;
  data: string;
  isDirectory: false;
}

export interface DirectoryContents {
  username: string;
  repo_uuid: string;
  directory: string;
  entries: string[];
  isDirectory: true;
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

  uploadFile: async (file: File, repoName: string, isPublic: boolean): Promise<{ repo_uuid: string }> => {
    await ensureCSRFToken();
    
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

  uploadZip: async (zipFile: File, repoName: string, isPublic: boolean): Promise<{ repo_uuid: string }> => {
    await ensureCSRFToken();
    
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
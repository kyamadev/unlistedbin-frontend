'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import DOMPurify from 'dompurify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface User {
  id?: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, password: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkUsername: (username: string) => Promise<boolean>;
  updateUsername: (newUsername: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<boolean>;
  confirmSignUp: (username: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (username: string) => Promise<{ success: boolean; error?: string; destination?: string }>;
  confirmResetPassword: (username: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getCSRFToken = (): string | null => {
  // ブラウザ環境でなければnullを返す
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  
  if (parts.length === 2) {
    const csrfToken = parts.pop()?.split(';').shift();
    return csrfToken || null;
  }
  return null;
};

const sanitize = (input: string): string => {
  if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
    return DOMPurify.sanitize(input);
  }
  return input;
};


const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    if (config.method !== 'get') {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
      
      if (config.data && typeof config.data === 'object') {
        Object.keys(config.data).forEach(key => {
          if (typeof config.data[key] === 'string') {
            config.data[key] = sanitize(config.data[key]);
          }
        });
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      Object.keys(response.data).forEach(key => {
        if (typeof response.data[key] === 'string') {
          response.data[key] = sanitize(response.data[key]);
        }
      });
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.log('認証エラー: 有効でないセッションまたは権限がありません');
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        setUser({
          username: sanitize(response.data.username),
          email: response.data.email ? sanitize(response.data.email) : undefined,
          id: response.data.id
        });
        setIsAuthenticated(true);
      }
      return true;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    setIsLoading(true);
    try {
      const sanitizedUsername = sanitize(emailOrUsername);
      
      const response = await api.post('/auth/login', {
        emailOrUsername: sanitizedUsername,
        password,
        clientType: 'web'
      });
      
      await fetchUserInfo();
      router.push('/dashboard');
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'ログインに失敗しました'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, password: string, email?: string) => {
    setIsLoading(true);
    try {
      const sanitizedUsername = sanitize(username);
      const sanitizedEmail = email ? sanitize(email) : undefined;
      
      const response = await api.post('/auth/register', {
        username: sanitizedUsername,
        password,
        email: sanitizedEmail
      });
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'サインアップに失敗しました'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push('/login');
    }
  };

  const checkUsername = async (username: string): Promise<boolean> => {
    try {
      const sanitizedUsername = sanitize(username);
      
      const response = await api.get(`/auth/check-username?username=${encodeURIComponent(sanitizedUsername)}`);
      return response.data.available;
    } catch (error) {
      console.error('ユーザー名チェックエラー:', error);
      return false;
    }
  };

  const updateUsername = async (newUsername: string) => {
    try {
      const sanitizedUsername = sanitize(newUsername);
      
      const response = await api.put('/auth/update-username', { newUsername: sanitizedUsername });
      
      if (response.data?.username) {
        setUser(prev => prev ? { 
          ...prev, 
          username: sanitize(response.data.username)
        } : null);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: '更新に失敗しました'
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'ユーザー名の更新に失敗しました'
      };
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      await api.delete('/auth/delete-account');
      
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
      return true;
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      return false;
    }
  };

  const confirmSignUp = async (username: string, code: string) => {
    try {
      const sanitizedUsername = sanitize(username);
      const sanitizedCode = sanitize(code);
      
      const response = await api.post('/auth/confirm-signup', { 
        username: sanitizedUsername, 
        confirmationCode: sanitizedCode
      });
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || '確認コードの検証に失敗しました'
      };
    }
  };

  const resetPassword = async (username: string) => {
    try {
      const sanitizedUsername = sanitize(username);
      
      const response = await api.post('/auth/reset-password', { username: sanitizedUsername });
      
      return {
        success: true,
        destination: response.data?.destination ? sanitize(response.data.destination) : ''
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'パスワードリセットの要求に失敗しました'
      };
    }
  };

  const confirmResetPassword = async (username: string, code: string, newPassword: string) => {
    try {
      const sanitizedUsername = sanitize(username);
      const sanitizedCode = sanitize(code);
      
      await api.post('/auth/confirm-reset-password', {
        username: sanitizedUsername,
        confirmationCode: sanitizedCode,
        newPassword
      });
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'パスワードのリセットに失敗しました'
      };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await api.put('/auth/change-password', { oldPassword, newPassword });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'パスワードの変更に失敗しました'
      };
    }
  };

  const checkSession = async () => {
    setIsLoading(true);
    try {
      const success = await fetchUserInfo();
      return success;
    } catch (error) {
      console.error('セッションチェックエラー:', error);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    checkUsername,
    updateUsername,
    deleteAccount,
    confirmSignUp,
    resetPassword,
    confirmResetPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
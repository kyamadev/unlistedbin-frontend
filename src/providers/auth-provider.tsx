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
  signup: (username: string, password: string, email: string) => Promise<{ success: boolean; error?: string }>;
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

const ensureCSRFToken = async (): Promise<string | null> => {
  const existingToken = getCSRFToken();
  if (existingToken) {
    return existingToken;
  }
  
  try {
    await axios.get(`${API_URL}/health`, { withCredentials: true });
    
    const newToken = getCSRFToken();
    console.log('新しいCSRFトークンを取得:', newToken ? '成功' : '失敗');
    return newToken;
  } catch (error) {
    console.error('CSRFトークン初期化エラー:', error);
    return null;
  }
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
  async (config) => {
    console.log(`APIリクエスト: ${config.method?.toUpperCase()} ${config.url}`);
    
    // CSRF対策 - GET以外のリクエストにCSRFトークンを追加
    if (config.method !== 'get') {
      const csrfToken = await ensureCSRFToken();
      if (csrfToken) {
        console.log('CSRFトークンをリクエストに設定しました');
        config.headers['X-CSRF-Token'] = csrfToken;
      } else {
        console.warn('CSRFトークンが利用できません');
      }
    }
    
    if (config.data && typeof config.data === 'object') {
      Object.keys(config.data).forEach(key => {
        if (typeof config.data[key] === 'string') {
          config.data[key] = sanitize(config.data[key]);
        }
      });
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.log('認証エラー: 有効でないセッションまたは権限がありません');
    }
    
    if (error.response?.status === 403 && 
        error.response?.data?.error?.includes('CSRF')) {
      console.error('CSRF検証エラー - 新しいトークンを取得します');
      await ensureCSRFToken();
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
      console.log('ユーザー情報を取得中...');
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
      console.error('ユーザー情報取得エラー:', error);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      await ensureCSRFToken();
      
      const sanitizedIdentifier = sanitize(identifier);
      const isEmail = identifier.includes('@');
      
      console.log('ログインリクエスト送信...', {
        identifier: sanitizedIdentifier,
        isEmail: isEmail
      });
      
      const response = await api.post('/auth/login', {
        emailOrUsername: sanitizedIdentifier,
        password,
        clientType: 'web'
      });
      
      console.log('ログイン成功、ユーザー情報を取得中...');
      
      // 少し待ってからユーザー情報を取得
      setTimeout(async () => {
        await fetchUserInfo();
        router.push('/dashboard');
      }, 500);
      
      return { success: true };
    } catch (error: any) {
      console.error('ログインエラー:', error);
      
      let errorMessage = 'メールアドレス/ユーザー名またはパスワードが正しくありません';
      
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('User is not confirmed')) {
          errorMessage = 'アカウントが確認されていません。メールをご確認ください。';
        } else if (error.response.data.error.includes('Incorrect username or password')) {
          errorMessage = 'メールアドレス/ユーザー名またはパスワードが正しくありません';
        } else {
          errorMessage = error.response.data.error;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };
  

  const signup = async (username: string, password: string, email: string) => {
    setIsLoading(true);
    try {
      await ensureCSRFToken();
      
      const sanitizedUsername = sanitize(username);
      const sanitizedEmail = sanitize(email);
      
      console.log('サインアップリクエスト送信...', {
        username: sanitizedUsername,
        email: sanitizedEmail
      });
      
      const response = await api.post('/auth/register', {
        username: sanitizedUsername,
        password,
        email: sanitizedEmail
      });
      
      console.log('サインアップ成功');
      return { success: true };
    } catch (error: any) {
      console.error('サインアップエラー:', error);
      
      if (error.response) {
        console.error('サインアップエラーレスポンス:', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      
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
      await ensureCSRFToken();
      
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
      await ensureCSRFToken();
      
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
      await ensureCSRFToken();
      
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
      await ensureCSRFToken();
      
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

  const resetPassword = async (email: string) => {
    try {
      await ensureCSRFToken();
      
      const sanitizedEmail = sanitize(email);
      
      const response = await api.post('/auth/reset-password', { 
        username: sanitizedEmail
      });
      
      return {
        success: true,
        destination: response.data?.destination ? sanitize(response.data.destination) : ''
      };
    } catch (error: any) {
      let errorMessage = 'パスワードリセットの要求に失敗しました';
      
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('User does not exist')) {
          errorMessage = 'このメールアドレスに対応するアカウントが見つかりません';
        } else {
          errorMessage = error.response.data.error;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const confirmResetPassword = async (username: string, code: string, newPassword: string) => {
    try {
      await ensureCSRFToken();
      
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
      await ensureCSRFToken();
      
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
      console.log('セッションチェック中...');
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
    const initAuth = async () => {
      console.log('認証を初期化中...');
      setIsLoading(true);
      
      try {
        const csrfToken = await ensureCSRFToken();
        console.log('CSRFトークン初期化:', csrfToken ? '成功' : '失敗');
        
        await checkSession();
      } catch (error) {
        console.error('認証初期化エラー:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
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
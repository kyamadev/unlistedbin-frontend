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
import { Amplify } from 'aws-amplify';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  updatePassword as amplifyUpdatePassword,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
} from 'aws-amplify/auth';

// 認証タイプの設定
const AUTH_TYPE = process.env.NEXT_PUBLIC_AUTH_TYPE || 'session';

// APIのベースURL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Cognitoの設定（Cognitoを使用する場合）
if (AUTH_TYPE === 'cognito') {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  
  if (userPoolId && userPoolClientId) {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          loginWith: {
            username: true,
            email: true
          }
        }
      }
    });
  } else {
    console.warn('Cognito credentials not found. Cognito authentication will be disabled.');
  }
}

// ユーザータイプ定義
export interface User {
  id?: string;
  username: string;
  email?: string;
}

// 認証コンテキストの型定義
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
  confirmSignUp?: (username: string, code: string) => Promise<{ success: boolean; error?: string }>;
  // パスワードリセット関連の機能
  resetPassword?: (username: string) => Promise<{ success: boolean; error?: string; destination?: string }>;
  confirmResetPassword?: (username: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // パスワード変更
  changePassword?: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証プロバイダーコンポーネント
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // セッション認証
  const sessionLogin = async (username: string, password: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { username, password },
        { withCredentials: true }
      );
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'ログインに失敗しました',
      };
    }
  };

  // Cognito認証
  const cognitoLogin = async (username: string, password: string) => {
    try {
      // Amplify v6の新しいサインインフォーマット
      await amplifySignIn({
        username,
        password,
      });
      
      // ユーザー情報を取得
      const currentUser = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      
      setUser({
        username: userAttributes['custom:username'] || userAttributes.preferred_username || currentUser.username,
        email: userAttributes.email,
        id: currentUser.userId
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'ログインに失敗しました',
      };
    }
  };

  // ログイン処理
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      let result;
      
      if (AUTH_TYPE === 'cognito') {
        result = await cognitoLogin(username, password);
      } else {
        result = await sessionLogin(username, password);
      }
      
      if (result.success) {
        await checkSession();
        router.push('/dashboard');
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // サインアップ確認（Cognito用）
  const confirmSignUp = async (username: string, code: string) => {
    if (AUTH_TYPE !== 'cognito') {
      return { success: false, error: 'この機能はCognito認証でのみ使用できます' };
    }
    
    try {
      await amplifyConfirmSignUp({ username, confirmationCode: code });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '確認コードの検証に失敗しました',
      };
    }
  };

// パスワードリセット要求
const resetPassword = async (username: string) => {
    if (AUTH_TYPE !== 'cognito') {
      return { success: false, error: 'この機能はCognito認証でのみ使用できます' };
    }
    
    try {
      const resetResult = await amplifyResetPassword({ username });
      
      let destination = '';
      
      if (resetResult.nextStep?.codeDeliveryDetails) {
        destination = resetResult.nextStep.codeDeliveryDetails.destination || '';
      }
      
      return {
        success: true,
        destination
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'パスワードリセットの要求に失敗しました',
      };
    }
  };

  // パスワードリセット確認
  const confirmResetPassword = async (username: string, code: string, newPassword: string) => {
    if (AUTH_TYPE !== 'cognito') {
      return { success: false, error: 'この機能はCognito認証でのみ使用できます' };
    }
    
    try {
      await amplifyConfirmResetPassword({
        username,
        confirmationCode: code,
        newPassword
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'パスワードのリセットに失敗しました',
      };
    }
  };

  // パスワード変更（ログイン済みユーザー用）
  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (AUTH_TYPE === 'cognito') {
      try {
        await amplifyUpdatePassword({
          oldPassword,
          newPassword
        });
        return { success: true };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'パスワードの変更に失敗しました',
        };
      }
    } else {
      // セッション認証の場合のパスワード変更
      try {
        await axios.put(
          `${API_URL}/auth/change-password`,
          { oldPassword, newPassword },
          { withCredentials: true }
        );
        return { success: true };
      } catch (error: any) {
        return {
          success: false,
          error: error.response?.data?.error || 'パスワードの変更に失敗しました',
        };
      }
    }
  };

  // セッションサインアップ
  const sessionSignup = async (username: string, password: string) => {
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'サインアップに失敗しました',
      };
    }
  };

  // Cognitoサインアップ
  const cognitoSignup = async (username: string, password: string, email: string) => {
    try {
      // Amplify v6の新しいサインアップフォーマット
      await amplifySignUp({
        username: email, // Cognitoではemailをusernameとして使用
        password,
        options: {
          userAttributes: {
            'custom:username': username,
            email
          },
          autoSignIn: true
        }
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'サインアップに失敗しました',
      };
    }
  };

  // サインアップ処理
  const signup = async (username: string, password: string, email?: string) => {
    setIsLoading(true);
    try {
      if (AUTH_TYPE === 'cognito') {
        if (!email) {
          return { success: false, error: 'メールアドレスが必要です' };
        }
        return await cognitoSignup(username, password, email);
      } else {
        return await sessionSignup(username, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // セッションログアウト
  const sessionLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // Cognitoログアウト
  const cognitoLogout = async () => {
    try {
      await amplifySignOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // ログアウト処理
  const logout = async () => {
    setIsLoading(true);
    try {
      if (AUTH_TYPE === 'cognito') {
        await cognitoLogout();
      } else {
        await sessionLogout();
      }
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  // セッション確認
  const checkSession = async () => {
    setIsLoading(true);
    try {
      if (AUTH_TYPE === 'cognito') {
        try {
          const currentUser = await getCurrentUser();
          const userAttributes = await fetchUserAttributes();
          
          setUser({
            username: userAttributes['custom:username'] || userAttributes.preferred_username || currentUser.username,
            email: userAttributes.email,
            id: currentUser.userId
          });
          
          setIsAuthenticated(true);
          return true;
        } catch (e) {
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
      } else {
        try {
          const response = await axios.get(`${API_URL}/auth/session`, {
            withCredentials: true,
          });
          if (response.data?.isLoggedIn) {
            setUser({
              username: response.data.username,
            });
            setIsAuthenticated(true);
            return true;
          } else {
            setUser(null);
            setIsAuthenticated(false);
            return false;
          }
        } catch (e) {
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザー名チェック
  const checkUsername = async (username: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_URL}/auth/check-username?username=${username}`);
      return response.data.available;
    } catch (error) {
      console.error('ユーザー名チェックエラー:', error);
      return false;
    }
  };

  // ユーザー名更新
  const updateUsername = async (newUsername: string) => {
    try {
      // セッション認証の場合のみ対応
      if (AUTH_TYPE !== 'cognito') {
        const response = await axios.put(
          `${API_URL}/auth/update-username`,
          { newUsername },
          { withCredentials: true }
        );
        
        if (response.data?.username) {
          setUser(prev => prev ? { ...prev, username: response.data.username } : null);
          return { success: true };
        }
      }
      
      return { success: false, error: '操作はサポートされていません' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'ユーザー名の更新に失敗しました',
      };
    }
  };

  // アカウント削除
  const deleteAccount = async (): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/auth/delete-account`, {
        withCredentials: true,
        headers: AUTH_TYPE === 'cognito' ? await getAuthHeaders() : {},
      });
      
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
      return true;
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      return false;
    }
  };

  // 認証ヘッダーの取得（Cognito用）
  const getAuthHeaders = async () => {
    if (AUTH_TYPE === 'cognito') {
      try {
        const session = await fetchAuthSession();
        // v6では取得方法が変更
        const token = session.tokens?.idToken?.toString();
        
        return token ? {
          Authorization: `Bearer ${token}`,
        } : {};
      } catch (error) {
        return {};
      }
    }
    return {};
  };

  // 初期化時にセッションをチェック
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
    // Cognito固有の機能
    ...(AUTH_TYPE === 'cognito' ? { 
      confirmSignUp,
      resetPassword,
      confirmResetPassword,
    } : {}),
    // 両方の認証方式で提供する機能
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 認証フックの作成
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
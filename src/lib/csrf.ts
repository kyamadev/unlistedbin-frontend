import axios, { AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const getCSRFToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  
  if (parts.length === 2) {
    const csrfToken = parts.pop()?.split(';').shift();
    
    if (!csrfToken) return null;
    
    try {
      return decodeURIComponent(csrfToken.trim());
    } catch (e) {
      console.warn('CSRFトークンのデコードに失敗しました:', e);
      return csrfToken.trim();
    }
  }
  return null;
};

export const ensureCSRFToken = async (): Promise<string | null> => {
  const existingToken = getCSRFToken();
  if (existingToken) {
    return existingToken;
  }
  
  try {
    await axios.get(`${API_URL}/health`, { withCredentials: true });
    return getCSRFToken();
  } catch (error) {
    console.error('CSRFトークンの初期化に失敗しました:', error);
    return null;
  }
};

export const addCSRFToken = async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
  if (config.method !== 'get' && config.method !== 'GET') {
    try {
      const token = getCSRFToken();
      
      if (token && config.headers) {
        config.headers['X-CSRF-Token'] = token;
        console.log('CSRFトークンをリクエストヘッダーに設定:', token.substring(0, 10) + '...');
      } else {
        console.warn('CSRFトークンが見つかりません。トークンを取得します...');
        const newToken = await ensureCSRFToken();
        if (newToken && config.headers) {
          config.headers['X-CSRF-Token'] = newToken;
          console.log('新しいCSRFトークンをリクエストヘッダーに設定:', newToken.substring(0, 10) + '...');
        } else {
          console.error('CSRFトークンの取得に失敗しました。');
        }
      }
    } catch (error) {
      console.error('CSRFトークン追加エラー:', error);
    }
  }
  
  return config;
};
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const getCSRFToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  
  if (parts.length === 2) {
    const csrfToken = parts.pop()?.split(';').shift();
    return csrfToken || null;
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

export const addCSRFToken = async (config: any): Promise<any> => {
  if (config.method !== 'get') {
    try {
      const token = await ensureCSRFToken();
      
      if (token) {
        config.headers = {
          ...config.headers,
          'X-CSRF-Token': token
        };
      }
    } catch (error) {
      console.error('CSRFトークン追加エラー:', error);
    }
  }
  
  return config;
};
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, Loader2 } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 入力フィールドへの参照を作成
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  // 入力値を監視するための状態
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // メールアドレスかどうかを判断
  const isEmailLike = identifier.includes('@');
  
  // フォームのバリデーション状態
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 入力バリデーション
  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!identifier.trim()) {
      setIdentifierError('メールアドレスまたはユーザー名を入力してください');
      isValid = false;
    } else {
      setIdentifierError(null);
    }
    
    if (!password.trim()) {
      setPasswordError('パスワードを入力してください');
      isValid = false;
    } else {
      setPasswordError(null);
    }
    
    return isValid;
  };

  // ログイン処理
  const handleLogin = async () => {
    if (isLoading) return;
    
    // バリデーション実行
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('ログイン試行:', { identifier, isEmailLike });
      
      const result = await login(identifier, password);
      console.log('ログイン結果:', result);
      
      if (result.success) {
        // 成功したらダッシュボードへ遷移 (router.pushを使用)
        router.push('/dashboard');
      } else {
        // エラーメッセージを表示
        setError(result.error || 'メールアドレス/ユーザー名またはパスワードが正しくありません');
      }
    } catch (err: any) {
      console.error('ログインエラー:', err);
      setError('ログイン処理中にエラーが発生しました。ネットワーク接続を確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  // Enterキー押下時のハンドラ
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Enterキーのデフォルト動作を防止
      handleLogin();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">ログイン</h1>
        <p className="text-gray-500 dark:text-gray-400">
          メールアドレスまたはユーザー名でログインしてください
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* フォーム要素を使わずにdivで代用 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">メールアドレスまたはユーザー名</Label>
          <div className="relative">
            <Input
              id="identifier"
              type={isEmailLike ? "email" : "text"}
              placeholder="メールアドレスまたはユーザー名を入力"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={identifierRef}
              className={isEmailLike ? "pl-10" : ""}
              autoComplete="username"
            />
            {isEmailLike && (
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            )}
          </div>
          {identifierError && (
            <p className="text-sm text-red-500">{identifierError}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">パスワード</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              パスワードをお忘れですか？
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={passwordRef}
            autoComplete="current-password"
          />
          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}
        </div>
        
        <Button 
          type="button"
          className="w-full" 
          disabled={isLoading}
          onClick={handleLogin}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ログイン中...
            </>
          ) : 'ログイン'}
        </Button>
      </div>
      
      <div className="text-center text-sm">
        アカウントをお持ちでないですか？{' '}
        <Link
          href="/signup"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          新規登録
        </Link>
      </div>
    </div>
  );
}
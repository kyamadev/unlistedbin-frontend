import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileUp, Eye, Lock, Upload } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      {/* ヒーローセクション */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl sm:text-5xl font-bold">
          Unlistedbin
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Unlistedbinは、レポジトリやテキストファイルをURLで相手に共有できるサービスです。
          登録無料、簡単利用可能！
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/signup">
              <Upload className="mr-2 h-5 w-5" />
              無料で始める
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
            <Link href="/login">登録済みの方はログイン</Link>
          </Button>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">主な特徴</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border rounded-lg p-6 text-center space-y-4">
            <div className="mx-auto bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <FileUp className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold">簡単アップロード</h3>
            <p className="text-gray-600 dark:text-gray-400">
              単一ファイルやZIPファイルのアップロードが可能。数クリックで完了します。
            </p>
          </div>
          
          <div className="border rounded-lg p-6 text-center space-y-4">
            <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <Eye className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold">シンタックスハイライト</h3>
            <p className="text-gray-600 dark:text-gray-400">
              多数のプログラミング言語に対応したシンタックスハイライトで、コードの閲覧が快適に。
            </p>
          </div>
          
          <div className="border rounded-lg p-6 text-center space-y-4">
            <div className="mx-auto bg-purple-100 dark:bg-purple-900 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <Lock className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold">公開設定</h3>
            <p className="text-gray-600 dark:text-gray-400">
              リポジトリの限定公開/非公開設定で、共有URLを制御できます。
            </p>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">使い方</h2>
        <div className="border rounded-lg overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 w-8 h-8 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">アカウント作成</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  簡単な登録フォームでアカウントを作成します。
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 w-8 h-8 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">ファイルをアップロード</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  単一ファイルまたはZIPファイルをアップロードしてリポジトリを作成します。
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 w-8 h-8 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">URLを共有</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  生成されたURLを共有して、他の人とファイルを共有します。
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 dark:text-gray-400">
              今すぐ始めて、簡単にファイルを共有しましょう。
            </p>
            <Button asChild>
              <Link href="/signup">
                <Upload className="mr-2 h-4 w-4" />
                無料で登録
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
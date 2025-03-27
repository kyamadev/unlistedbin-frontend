import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { AuthProvider } from '@/providers/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unlistedbin',
  description: '限定公開コード共有サービス',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
            <footer className="border-t py-6 bg-gray-50 dark:bg-gray-900">
              <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} <a href="https://github.com/kyamadev" className="text-blue-500 hover:underline">kyamadev</a>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
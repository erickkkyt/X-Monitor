import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '错误页面',
  description: '处理请求时发生了错误'
};

// 使用标准的 Next.js 页面参数类型
export default function ErrorPage({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  // 安全地获取错误消息
  const message = typeof searchParams.message === 'string' 
    ? searchParams.message 
    : '抱歉，处理您的请求时发生了意外错误。';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-700 p-4">
      <h1 className="text-2xl font-bold mb-4">发生错误</h1>
      <p className="text-center">
        {message}
      </p>
      <Link href="/" className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        返回首页
      </Link>
    </div>
  );
} 
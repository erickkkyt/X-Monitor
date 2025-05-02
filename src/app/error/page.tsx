import Link from 'next/link';

export default function ErrorPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-700 p-4">
      <h1 className="text-2xl font-bold mb-4">发生错误</h1>
      <p className="text-center">
        {searchParams?.message || '抱歉，处理您的请求时发生了意外错误。'}
      </p>
      <Link href="/" className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        返回首页
      </Link>
    </div>
  );
} 
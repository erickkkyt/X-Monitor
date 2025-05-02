import Link from 'next/link';
import { login, signup } from './actions'; // 导入 Server Actions

// Apply fix based on params/searchParams being a Promise in Next.js 15 generated types
export default async function LoginPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ message?: string }> 
}) {
  // Await the promise to get the actual searchParams object
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录或注册
          </h2>
        </div>

        {/* 显示来自 Server Action 重定向的消息 */}
        {resolvedSearchParams?.message && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-center text-sm text-blue-700 mb-6">
            {resolvedSearchParams.message}
          </div>
        )}

        <form className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
              <input
                id="email"
                name="email" // name 属性用于 Server Action
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 mt-1">密码</label>
              <input
                id="password"
                name="password" // name 属性用于 Server Action
                type="password"
                autoComplete="current-password"
                required
                minLength={6} // 添加最小长度提示
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="•••••••• (至少6位)"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4 pt-4">
            <button
              formAction={login} // 使用 Server Action
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              登录
            </button>
            <button
              formAction={signup} // 使用 Server Action
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              注册
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
} 
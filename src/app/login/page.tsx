'use client' // *** 添加这一行，将组件转换为客户端组件 ***

import Link from 'next/link';
import { useState, useTransition } from 'react'; // 导入 Hooks
import { login, signup } from './actions'; // 导入 Server Actions

// 不再需要 searchParams，因为消息通过 state 管理
export default function LoginPage() {
  // const [email, setEmail] = useState(''); // 可以用 state 管理输入，但 FormData 也能工作
  // const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null); // 用于显示成功或错误消息
  const [isPending, startTransition] = useTransition(); // 用于处理异步操作状态

  // 处理登录的函数 (注意：login 成功时会 redirect)
  const handleLogin = (formData: FormData) => {
    startTransition(async () => {
      setMessage(null); // 清除旧消息
      // login 成功时 redirect, 失败时返回对象
      const result = await login(formData);
      if (result?.message) { // 仅当 login 返回错误消息时设置
         setMessage(result.message);
      }
      // 不需要处理成功情况，因为 redirect 会发生
    });
  };

  // 处理注册的函数
  const handleSignup = (formData: FormData) => {
    startTransition(async () => {
      setMessage(null); // 清除旧消息
      const result = await signup(formData); // 调用修改后的 signup action
      // signup 总是返回对象
      if (result.message) {
        setMessage(result.message); // 显示来自 action 的消息
      }
    });
  };

  const isError = message && (message.includes('失败') || message.includes('不能为空') || message.includes('必须'));
  const isSuccess = message && !isError;

  return (
    // 微调背景和内边距
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* 添加背景、内边距、圆角和阴影 */}
      <div className="max-w-md w-full space-y-8 bg-white p-8 shadow-xl rounded-lg">
        <div>
          {/* 调整标题下边距 */}
          <h2 className="mt-6 mb-8 text-center text-3xl font-bold tracking-tight text-gray-900">
            登录或注册
          </h2>
        </div>

        {/* 优化消息提示框样式 */}
        {message && (
          <div className={`p-4 rounded-md text-center mb-6 border ${
            isError
              ? 'bg-red-50 border-red-300 text-red-800 text-sm' // 错误样式保持或微调
              : 'bg-blue-100 border-blue-400 text-blue-800 text-base font-medium py-3' // 增强成功样式
          }`}>
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}> {/* 阻止 form 默认提交 */}
          <div className="rounded-md -space-y-px"> {/* 可以移除 shadow-sm，因为外部容器有阴影 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
              <input
                id="email"
                name="email" // name 属性仍用于 FormData
                type="email"
                autoComplete="email"
                required
                // value={email} // 如果使用 state 管理输入
                // onChange={(e) => setEmail(e.target.value)}
                // 调整输入框样式，增加圆角区分
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 mt-2">密码</label> {/* 增加一点上边距 */}
              <input
                id="password"
                name="password" // name 属性仍用于 FormData
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                // value={password} // 如果使用 state 管理输入
                // onChange={(e) => setPassword(e.target.value)}
                 // 调整输入框样式，增加圆角区分
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="•••••••• (至少6位)"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4 pt-5"> {/* 增加一点上边距 */}
            <button
              type="button" // 更改为 type="button"
              // 移除 formAction
              onClick={(e) => {
                // e.preventDefault(); // 已在 form 的 onSubmit 中阻止
                const formData = new FormData(e.currentTarget.form!);
                handleLogin(formData);
              }}
              disabled={isPending} // 禁用按钮当操作进行中
              // 统一按钮样式，调整颜色和圆角
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {isPending ? '处理中...' : '登录'}
            </button>
            <button
              type="button" // 更改为 type="button"
              // 移除 formAction
               onClick={(e) => {
                // e.preventDefault(); // 已在 form 的 onSubmit 中阻止
                const formData = new FormData(e.currentTarget.form!);
                handleSignup(formData);
              }}
              disabled={isPending} // 禁用按钮当操作进行中
              // 统一按钮样式，调整颜色和圆角
              className="group relative w-full flex justify-center py-2.5 px-4 border border-gray-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {isPending ? '处理中...' : '注册'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6"> {/* 调整上边距 */}
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
} 
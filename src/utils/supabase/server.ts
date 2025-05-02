import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 这个函数用来创建能在服务器端环境（Server Components, Route Handlers, Middleware）
// 安全使用的 Supabase 客户端
export const createClient = async () => {
  // 在函数顶部调用 cookies() 来获取 cookie 存储 Promise
  const cookieStorePromise = cookies()

  // 在访问前 await Promise
  const resolvedCookieStore = await cookieStorePromise

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // get/set/remove 方法本身是同步的，直接操作 cookieStore
        get(name: string) {
          return resolvedCookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            resolvedCookieStore.set({ name, value, ...options })
          } catch {
            // 处理在 Server Components 中调用 set 可能引发的错误
            // 如果有刷新 session 的中间件，通常可以忽略
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            resolvedCookieStore.set({ name, value: '', ...options })
          } catch {
            // 处理在 Server Components 中调用 remove 可能引发的错误
            // 如果有刷新 session 的中间件，通常可以忽略
          }
        },
      },
    }
  )
} 
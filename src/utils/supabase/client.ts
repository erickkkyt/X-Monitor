import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // 注意：这里的环境变量必须有 NEXT_PUBLIC_ 前缀才能在浏览器中访问
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 
import { createClient } from '@supabase/supabase-js';

// 从环境变量获取 Supabase URL 和 Anon Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 记录加载的环境变量 (调试用，生产环境可移除)
console.log(`[Supabase Client] Initializing with URL: ${supabaseUrl ? 'Loaded' : '*** NOT FOUND ***'}`);
console.log(`[Supabase Client] Initializing with Anon Key: ${supabaseAnonKey ? 'Loaded' : '*** NOT FOUND ***'}`);

// 检查环境变量是否已设置
if (!supabaseUrl) {
  console.error("[Supabase Client] FATAL: NEXT_PUBLIC_SUPABASE_URL environment variable is not set.");
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.");
}
if (!supabaseAnonKey) {
  console.error("[Supabase Client] FATAL: NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set.");
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables.");
}

// 创建并导出 Supabase 客户端
// 注意：这里使用的是 Anon Key，适用于客户端和服务端。
// 如果需要进行需要更高权限的操作（如绕过 RLS），你可能需要创建一个使用 Service Role Key 的独立客户端（仅限服务端使用）。
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("[Supabase Client] Supabase client initialized successfully."); 
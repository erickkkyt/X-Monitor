'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server' // 使用服务器端客户端

export async function login(formData: FormData) {
  const supabase = await createClient()

  // 从表单数据获取邮箱和密码
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 输入验证 (基本)
  if (!email || !password) {
    // 返回错误对象
    return { success: false, message: '邮箱和密码不能为空' }
    // return redirect('/login?message=邮箱和密码不能为空')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[Server Action - Login] Error:', error)
     // 返回错误对象
    return { success: false, message: `登录失败: ${error.message}` }
    // return redirect(`/login?message=登录失败: ${error.message}`)
  }

  revalidatePath('/', 'layout') // 重新验证缓存，确保layout获取最新状态
  // 登录成功仍然重定向
  redirect('/dashboard') // 登录成功，重定向到仪表盘
}

// 修改 signup 函数使其返回 Promise<{ success: boolean; message: string }>
export async function signup(formData: FormData): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 输入验证 (基本)
  if (!email || !password) {
    // 返回错误对象
    return { success: false, message: '邮箱和密码不能为空' }
    // return redirect('/login?message=邮箱和密码不能为空') // 或重定向到注册页
  }
  if (password.length < 6) {
    // 返回错误对象
    return { success: false, message: '密码长度必须至少为6个字符' }
    // return redirect('/login?message=密码长度必须至少为6个字符') // 或重定向到注册页
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // 可选：如果您的应用需要，可以在这里传递 email_redirect_to
      // emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('[Server Action - Signup] Error:', error)
    // 返回错误对象
    return { success: false, message: `注册失败: ${error.message}` }
    // return redirect(`/login?message=注册失败: ${error.message}`)
  }

  // 根据 Supabase 项目设置决定是直接重定向还是显示确认消息
  // 如果开启了邮件确认，这里应该重定向到一个提示用户检查邮箱的页面
  // 如果未开启邮件确认，用户已注册并登录，可以重定向到仪表盘
  revalidatePath('/', 'layout')
  // 注册成功，返回成功消息对象
  return { success: true, message: '注册请求已发送，请检查您的邮箱进行确认。' }
  // 不再重定向: return redirect('/login?message=注册请求已发送，请检查您的邮箱进行确认')
  // 如果未开启，则 redirect('/dashboard')
} 
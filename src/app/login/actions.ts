'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server' // 使用服务器端客户端

export async function login(formData: FormData) {
  const supabase = createClient()

  // 从表单数据获取邮箱和密码
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 输入验证 (基本)
  if (!email || !password) {
    return redirect('/login?message=邮箱和密码不能为空')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[Server Action - Login] Error:', error)
    return redirect(`/login?message=登录失败: ${error.message}`)
  }

  revalidatePath('/', 'layout') // 重新验证缓存，确保layout获取最新状态
  redirect('/dashboard') // 登录成功，重定向到仪表盘
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 输入验证 (基本)
  if (!email || !password) {
    return redirect('/login?message=邮箱和密码不能为空') // 或重定向到注册页
  }
  if (password.length < 6) {
    return redirect('/login?message=密码长度必须至少为6个字符') // 或重定向到注册页
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
    return redirect(`/login?message=注册失败: ${error.message}`)
  }

  // 根据 Supabase 项目设置决定是直接重定向还是显示确认消息
  // 如果开启了邮件确认，这里应该重定向到一个提示用户检查邮箱的页面
  // 如果未开启邮件确认，用户已注册并登录，可以重定向到仪表盘
  revalidatePath('/', 'layout')
  // 假设开启了邮件确认，重定向到登录页并提示检查邮箱
  return redirect('/login?message=注册请求已发送，请检查您的邮箱进行确认') 
  // 如果未开启，则 redirect('/dashboard')
} 
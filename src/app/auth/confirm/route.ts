import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // 使用服务器端客户端

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // 验证成功，重定向到目标页面 (例如 /dashboard)
      return NextResponse.redirect(new URL(next, request.url))
    }
    console.error('[Auth Confirm Route] Error verifying OTP:', error)
    // OTP 验证失败，可以重定向到错误页面或登录页并带错误信息
    return NextResponse.redirect(new URL('/login?message=邮箱确认失败，链接可能已失效', request.url))

  }

  // token_hash 或 type 参数缺失
  console.error('[Auth Confirm Route] Missing token_hash or type.')
  return NextResponse.redirect(new URL('/login?message=无效的确认链接', request.url))
} 
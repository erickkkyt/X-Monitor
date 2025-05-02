import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * API Route: 获取监控账号列表
 * @route GET /api/twitter/accounts
 */
export async function GET(request: NextRequest) {
  console.log('[API Get Accounts] Received request');

  // 1. Create Supabase client using the server utility function
  const supabase = createClient();
  let userId = 'unknown'; // 用于日志记录

  try {
    // --- 2. 获取并验证当前登录用户 ---
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('[API Get Accounts] Auth error:', authError);
      console.error('[API Get Accounts] Full auth error object:', JSON.stringify(authError, null, 2));
      return NextResponse.json({ success: false, message: '用户认证时出错。' }, { status: 500 });
    }

    if (!user) {
      console.warn('[API Get Accounts] User not authenticated.');
      return NextResponse.json({ success: false, message: '用户未登录或认证已过期。' }, { status: 401 });
    }

    userId = user.id;
    console.log(`[API Get Accounts] Fetching accounts for authenticated userId: ${userId}`);

    // --- 3. 从数据库查询监控账号 ---
    const { data: accounts, error: dbError } = await supabase
      .from('monitored_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error(`[API Get Accounts] Supabase error fetching accounts for user ${userId}:`, dbError);
      console.error(`[API Get Accounts] Full DB error object for user ${userId}:`, JSON.stringify(dbError, null, 2));
      // Throwing here will be caught by the outer catch block
      throw new Error('从数据库获取监控账号失败: ' + dbError.message);
    }

    console.log(`[API Get Accounts] Successfully fetched ${accounts?.length || 0} accounts for user ${userId}.`);

    // --- 4. 返回成功响应 ---
    return NextResponse.json({
      success: true,
      accounts: accounts || [],
    });

  } catch (error: unknown) {
    console.error(`[API Get Accounts] Unhandled exception in GET handler (User ID: ${userId}):`, error);
    console.error(`[API Get Accounts] Full unhandled error object (User ID: ${userId}):`, JSON.stringify(error, null, 2));
    let message = '获取监控账号时发生服务器内部错误';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({
      success: false,
      message: `处理请求时发生意外错误: ${message}`,
    }, { status: 500 });
  }
} 
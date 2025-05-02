import { NextRequest, NextResponse } from 'next/server';
import { addMonitoredAccount } from '@/lib/twitter-api/monitoring';
import { createClient } from '@/utils/supabase/server';

/**
 * API Route: 添加监控账号
 * @route POST /api/twitter/add-account
 */
export async function POST(req: NextRequest) {
  console.log('[API Add Account] Received request');

  // 1. Create Supabase client using the server utility function
  const supabase = createClient();

  // 2. Get user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[API Add Account] Auth error or no user:', authError);
    return NextResponse.json({ success: false, message: '用户未认证' }, { status: 401 });
  }
  console.log(`[API Add Account] Authenticated user: ${user.id}`);

  // 3. Parse request body
  let username: string;
  try {
    const body = await req.json();
    username = body.username;
    if (!username || typeof username !== 'string') {
      throw new Error('Missing or invalid username in request body');
    }
    console.log(`[API Add Account] Parsed username: ${username}`);
  } catch (error) {
    console.error('[API Add Account] Error parsing request body:', error);
    return NextResponse.json({ success: false, message: '请求体无效或缺少用户名' }, { status: 400 });
  }

  // 4. Call the monitoring logic
  try {
    console.log(`[API Add Account] Calling addMonitoredAccount for user ${user.id} and username ${username}`);
    const result = await addMonitoredAccount(user.id, username);
    console.log('[API Add Account] addMonitoredAccount result:', result);

    if (result.success && result.account) {
      return NextResponse.json({
        success: true,
        message: '账号添加成功',
        account: result.account, // Return the full account object
      }, { status: 201 });
    } else {
      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (result.error === 'Account already monitored.') {
        statusCode = 409; // Conflict
      } else if (result.error?.includes('not found')) {
          statusCode = 404; // Not Found
      } else if (result.error?.includes('rate limit')) {
          statusCode = 429; // Too Many Requests
      }
      return NextResponse.json({ success: false, message: result.error || '添加账号失败' }, { status: statusCode });
    }
  } catch (error: Error) {
    console.error('[API Add Account] Unexpected error calling addMonitoredAccount:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误: ' + error.message }, { status: 500 });
  }
} 
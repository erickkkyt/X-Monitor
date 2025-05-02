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
  const supabase = await createClient();

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
      // Determine appropriate status code based on the result.message
      let statusCode = 500;
      // Check if message exists and is a string before comparing/including
      const errorMessage = typeof result.message === 'string' ? result.message : '';

      if (errorMessage === 'Account already monitored.') {
        statusCode = 409; // Conflict
      } else if (errorMessage.includes('not found')) {
          statusCode = 404; // Not Found
      } else if (errorMessage.includes('rate limit')) {
          statusCode = 429; // Too Many Requests
      }
      // Return the message from the result, defaulting if needed
      return NextResponse.json({ success: false, message: errorMessage || '添加账号失败' }, { status: statusCode });
    }
  } catch (error: unknown) {
    console.error('[API Add Account] Unexpected error calling addMonitoredAccount:', error);
    // Add type guard before accessing error.message
    let message = '服务器内部错误';
    if (error instanceof Error) {
      message = '服务器内部错误: ' + error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
} 
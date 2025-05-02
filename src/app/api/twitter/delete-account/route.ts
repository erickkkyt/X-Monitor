import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();

  // 1. Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse accountId from request body
  let accountId: string;
  try {
    const body = await request.json();
    accountId = body.accountId;
    if (!accountId) {
      throw new Error('accountId is required');
    }
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  console.log(`[API] User ${user.id} attempting to delete account ${accountId}`);

  try {
    // 3. Delete associated tweets first (important for foreign key constraints if any)
    const { error: deleteTweetsError } = await supabase
      .from('tweets')
      .delete()
      .eq('account_id', accountId);

    if (deleteTweetsError) {
      console.error(`[API] Error deleting tweets for account ${accountId}:`, deleteTweetsError);
      throw new Error('删除关联推文失败: ' + deleteTweetsError.message);
    }
    console.log(`[API] Deleted tweets for account ${accountId}`);

    // 4. Delete the monitored account itself
    // Ensure the user only deletes their own accounts
    const { error: deleteAccountError } = await supabase
      .from('monitored_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id); // Crucial security check

    if (deleteAccountError) {
      console.error(`[API] Error deleting monitored account ${accountId} for user ${user.id}:`, deleteAccountError);
      throw new Error('删除监控账号失败: ' + deleteAccountError.message);
    }
    console.log(`[API] Deleted monitored account ${accountId} for user ${user.id}`);

    // 5. Return success response
    return NextResponse.json({ success: true, message: '账号已成功删除' });

  } catch (error: Error) {
    console.error(`[API] Overall error during deletion for account ${accountId}:`, error);
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message: message }, { status: 500 });
  }
} 
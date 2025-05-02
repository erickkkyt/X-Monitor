import { supabase } from '../supabase/client'; // Assume Supabase client is configured here
import { fetchTwitterUserByUsername } from './utils';

/**
 * 添加监控账号的核心逻辑
 * @param userId 用户的 UUID (需要替换为真实用户ID)
 * @param twitterUsername 要监控的 Twitter 用户名
 * @returns 包含 success 和 message 的结果对象，以及可能的 account 数据或错误代码
 */
export async function addMonitoredAccount(userId: string, twitterUsername: string) {
  console.log(`[Monitoring Logic] addMonitoredAccount called for user: ${userId}, username: ${twitterUsername}`);

  // --- 1. 获取 Twitter 用户信息 --- 
  let twitterUser;
  try {
    twitterUser = await fetchTwitterUserByUsername(twitterUsername);
  } catch (error: unknown) {
    console.error(`[Monitoring Logic] Failed to fetch Twitter user info for ${twitterUsername} due to API error:`, error);
    // 将 Twitter API 抛出的错误包装成标准失败结果
    const message = error instanceof Error ? error.message : '获取 Twitter 用户信息失败';
    return { success: false, message: message };
  }
  
  // 检查用户是否存在
  if (!twitterUser) {
    console.warn(`[Monitoring Logic] Twitter user ${twitterUsername} not found.`);
    return { success: false, message: `无法找到 Twitter 用户 @${twitterUsername}` };
  }
  console.log(`[Monitoring Logic] Fetched Twitter user: ${twitterUser.username} (ID: ${twitterUser.id})`);

  // --- 2. 检查数据库是否已存在该监控项 --- 
  try {
    console.log(`[Monitoring Logic] Checking database for existing monitor: User ${userId}, Twitter ID ${twitterUser.id}`);
    const { data: existingAccount, error: checkError } = await supabase
      .from('monitored_accounts')
      .select('id') // 只选择 id 即可，减少数据量
      .eq('user_id', userId) 
      .eq('twitter_id', twitterUser.id)
      .maybeSingle(); // 使用 maybeSingle 避免 PQRST116 错误
      
    // 处理查询错误 (排除记录不存在的情况)
    if (checkError) {
      console.error('[Monitoring Logic] Supabase error checking for existing account:', checkError);
      throw new Error('检查数据库时出错'); // 向上抛出通用错误
    }
    
    // 如果记录已存在
    if (existingAccount) {
      console.warn(`[Monitoring Logic] Account ${twitterUsername} is already monitored by user ${userId}.`);
      return { 
        success: false, 
        message: `您已经在监控 @${twitterUsername} 了。`, 
        code: 'ALREADY_EXISTS' // 添加一个代码方便前端识别
      };
    }
    console.log(`[Monitoring Logic] Account ${twitterUsername} not currently monitored by user ${userId}.`);

  } catch (error: unknown) {
    console.error('[Monitoring Logic] Error during database check:', error);
    const message = error instanceof Error ? error.message : '检查账号是否存在时出错';
    return { success: false, message: message };
  }

  // --- 3. 添加新监控账号到数据库 --- 
  try {
    console.log(`[Monitoring Logic] Inserting new account into database for user ${userId}, username ${twitterUsername}`);
    const { data: newDbEntry, error: insertError } = await supabase
      .from('monitored_accounts')
      .insert([
        { 
          user_id: userId,
          twitter_id: twitterUser.id,
          username: twitterUser.username,
          // Store display name and profile image URL
          display_name: twitterUser.name, 
          profile_image_url: twitterUser.profile_image_url, // Will be null/undefined if not available from API
          check_frequency: 5
        }
      ])
      .select() 
      .single(); 

    if (insertError) {
      console.error('[Monitoring Logic] Supabase error inserting new account:', insertError);
      // Consider more specific error handling, e.g., based on insertError.code
      throw new Error('添加账号到数据库失败'); 
    }

    if (!newDbEntry) {
        console.error('[Monitoring Logic] Supabase insert succeeded but returned no data.');
        throw new Error('添加账号后未能获取确认数据');
    }

    console.log(`[Monitoring Logic] Successfully added ${twitterUsername} for user ${userId}. DB ID: ${newDbEntry.id}`);
    return { 
      success: true, 
      message: `成功添加监控账号 @${twitterUsername}`, 
      account: newDbEntry // 返回新创建的记录
    };

  } catch (error: unknown) { 
    console.error('[Monitoring Logic] Error during database insert:', error);
    const message = error instanceof Error ? error.message : '添加账号时发生数据库错误';
    return { success: false, message: message };
  }
}

// 可以根据需要在此处添加其他监控相关函数，如 removeMonitoredAccount, getUserMonitoredAccounts 等 
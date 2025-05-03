import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TwitterApi } from 'npm:twitter-api-v2@1.16.0'; // Use npm specifier for Deno
// Import Aliyun SDKs
import Dyvmsapi20170525, * as $Dyvmsapi20170525 from '@alicloud/dyvmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import Credential from '@alicloud/credentials';

import { makeTwitterCall, logCallToDatabase } from './twilio-helper.ts'; // <-- TWILIO HELPER!

console.log('Initializing Twitter Monitor Cron Function...');

// --- Aliyun Helper Function ---
async function createAliyunClient(): Promise<$Dyvmsapi20170525.default> {
  // 1. 创建 Credential 对象
  console.log("尝试创建阿里云凭证对象 (从环境变量)...");
  const credential = new Credential.default(); // 保持这个成功的修改
  console.log("阿里云凭证对象已创建。");

  // 2. 创建 Config 对象
  console.log("正在创建 OpenApi 配置对象...");
  const config = new $OpenApi.Config({
    credential: credential, 
  });
  console.log("OpenApi 配置对象已创建。"); // 修正日志文本

  // 3. 设置 Endpoint
  config.endpoint = `dyvmsapi.aliyuncs.com`;
  console.log("OpenApi 配置已设置 Endpoint:", config.endpoint); // 修正日志文本

  // 4. 创建并返回客户端实例 (应用 .default 修正)
  console.log("正在创建 Dyvmsapi 客户端实例 (应用 .default)...");
  return new Dyvmsapi20170525.default(config); // <--- 应用 .default 修正
}

interface SendTtsNotificationParams {
  phoneNumber: string;
  templateId: string; // TtsCode
  templateParams?: Record<string, string>; // 例如 { name: '张三', item: 'CPU使用率', value: '95%' }
  calledShowNumber?: string; // 专属模式下需要提供
  outId?: string; // 可选的自定义ID
}

async function sendAliyunTtsNotification(params: SendTtsNotificationParams) {
   if (!params.phoneNumber || !params.templateId) {
     console.error('缺少必要的参数: 手机号或模板ID');
     return { success: false, error: '缺少必要的参数: 手机号或模板ID' }; // Return error object
   }

  try {
    // 1. 创建 Aliyun 客户端 (使用我们之前的辅助函数)
    const client = await createAliyunClient();

    // --- 新增：处理手机号格式 ---
    let formattedPhoneNumber = params.phoneNumber;
    if (formattedPhoneNumber.startsWith('+86')) {
      formattedPhoneNumber = formattedPhoneNumber.substring(3); // 去掉前3位 '+86'
      console.log(`[Aliyun TTS] 移除了+86前缀，格式化号码为: ${formattedPhoneNumber}`);
    } else if (formattedPhoneNumber.startsWith('86')) {
        formattedPhoneNumber = formattedPhoneNumber.substring(2); // 去掉前2位 '86'
        console.log(`[Aliyun TTS] 移除了86前缀，格式化号码为: ${formattedPhoneNumber}`);
    }
    // --- 结束处理 ---

    // 2. 构造请求对象 (使用格式化后的号码)
    const singleCallByTtsRequest = new $Dyvmsapi20170525.SingleCallByTtsRequest({ // 使用命名空间中的 Request 类型
      // 必填参数
      calledNumber: formattedPhoneNumber, // <--- 使用处理后的号码
      ttsCode: params.templateId,
      // 可选参数
      ttsParam: params.templateParams ? JSON.stringify(params.templateParams) : undefined, // 确保这个对象匹配你的模板变量
      calledShowNumber: params.calledShowNumber, // 公共模式不填或 undefined
      outId: params.outId, // 自定义ID
      playTimes: 3,   // 可选：播放次数，参照示例默认为 3
      volume: 100,  // 可选：音量，参照示例默认为 100
      speed: 5,     // 可选：语速，参照示例默认为 5
    });

    // 3. 准备 Runtime Options (参照官方示例)
    const runtime = new $Util.RuntimeOptions({}); // 通常不需要特殊配置

    console.log(`[Aliyun TTS] 准备呼叫 ${formattedPhoneNumber} 使用模板 ${params.templateId} 参数: ${singleCallByTtsRequest.ttsParam || '{}'}`);

    // 4. 发起 API 调用 (参照官方示例)
    const response = await client.singleCallByTtsWithOptions(singleCallByTtsRequest, runtime);

    console.log('[Aliyun TTS] API 响应:', JSON.stringify(response.body)); // Log entire response body

    // 5. 处理响应
    if (response.body?.code === 'OK') {
      console.log(`[Aliyun TTS] 呼叫请求成功，CallId: ${response.body.callId}`);
      return { success: true, callId: response.body.callId };
    } else {
      const errorCode = response.body?.code || 'Unknown Code';
      const errorMessage = response.body?.message || 'Unknown Message';
      console.error(`[Aliyun TTS] 呼叫请求失败: Code=${errorCode}, Message=${errorMessage}`);
      return { success: false, error: `阿里云语音通知失败: ${errorMessage} (${errorCode})`, errorCode: errorCode };
    }

  } catch (error: any) {
    // 6. 处理异常 (参照官方示例改进)
    console.error('[Aliyun TTS] 调用异常:', error.message);
    let errorMessage = error.message || '未知错误';
    let errorCode = error.code; // SDK 异常可能有 code
    // 尝试获取更详细的错误信息或建议 (参照官方示例)
    if (error.data?.Recommend) {
         console.error('[Aliyun TTS] 阿里云建议:', error.data.Recommend);
         // 可以考虑将 Recommend 信息也加入返回的 error 中
    }
    if (error.data?.Message) { // 使用 SDK error data 中的 Message
         errorMessage = `${error.data.Message} (${errorMessage})`; // 组合消息
    }
     if (error.data?.Code) { // 使用 SDK error data 中的 Code
         errorCode = error.data.Code;
     }

    return { success: false, error: `调用阿里云语音服务异常: ${errorMessage}`, errorCode: errorCode };
  }
}
// --- End Aliyun Helper ---


// eslint-disable-next-line @typescript-eslint/no-unused-vars
serve(async (_req)=>{
  console.log('Cron function invoked.');
  const invocationTime = new Date(); // Record invocation time

  try {
    // 1. Initialize Clients using Environment Variables (Secrets)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const twitterBearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');

    // Twilio 环境变量
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    // Aliyun 环境变量
    const aliyunAccessKeyId = Deno.env.get('ALIYUN_ACCESS_KEY_ID');
    const aliyunAccessKeySecret = Deno.env.get('ALIYUN_ACCESS_KEY_SECRET');
    const aliyunTtsTemplateId = Deno.env.get('ALIYUN_TTS_TEMPLATE_ID');
    // 可选：如果使用专属号码，则需要配置
    // const aliyunCalledShowNumber = Deno.env.get('ALIYUN_CALLED_SHOW_NUMBER');

    if (!supabaseUrl || !supabaseServiceKey || !twitterBearerToken) {
      throw new Error('Missing environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or TWITTER_BEARER_TOKEN');
    }

    // 检查Twilio环境变量
    const isTwilioEnabled = !!(twilioAccountSid && twilioAuthToken && twilioPhoneNumber);
    if (!isTwilioEnabled) {
      console.warn('Twilio环境变量未配置，国际电话通知功能将被禁用');
    } else {
      console.log('Twilio配置已加载，国际电话通知功能已启用');
    }

    // 检查Aliyun环境变量
    const isAliyunEnabled = !!(aliyunAccessKeyId && aliyunAccessKeySecret && aliyunTtsTemplateId);
    if (!isAliyunEnabled) {
      console.warn('Aliyun环境变量未完全配置 (需要 ID, Secret, TemplateID)，中国大陆电话通知功能将被禁用');
    } else {
      console.log('Aliyun配置已加载，中国大陆电话通知功能已启用');
    }


    // Use Service Role Key for admin-level access
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    });
    console.log('Supabase client initialized.');

    // --- Frequency Check Logic ---
    console.log('Fetching monitoring settings...');
    const { data: settingsData, error: settingsError } = await supabase.from('monitoring_settings').select('*').eq('id', 1) // Assuming global settings are stored with id = 1
    .maybeSingle(); // Use maybeSingle to handle potential null result gracefully
    if (settingsError) {
      throw new Error(`Error fetching monitoring settings: ${settingsError.message}`);
    }
    if (!settingsData) {
      console.warn('Monitoring settings not found in database (id=1). Running check.');
    }
    const settings = settingsData;
    const targetFrequencyMinutes = settings?.target_frequency_minutes ?? 5; // Default to 5 min if null
    const lastExecutionTime = settings?.last_execution_time ? new Date(settings.last_execution_time) : null;
    console.log(`Target frequency: ${targetFrequencyMinutes} minutes.`);
    if (lastExecutionTime) {
      console.log(`Last execution time: ${lastExecutionTime.toISOString()}`);
    } else {
      console.log('Last execution time not recorded yet.');
    }
    let shouldExecute = true; // Default to true if no last execution time
    if (lastExecutionTime) {
      const diffMilliseconds = invocationTime.getTime() - lastExecutionTime.getTime();
      const diffMinutes = Math.floor(diffMilliseconds / (1000 * 60));
      console.log(`Minutes since last execution: ${diffMinutes}`);
      if (diffMinutes < targetFrequencyMinutes) {
        shouldExecute = false;
      }
    }
    if (!shouldExecute) {
      console.log(`Skipping execution: Not enough time has passed since the last run (required ${targetFrequencyMinutes} min).`);
      return new Response(JSON.stringify({
        message: 'Skipped execution due to frequency limit.'
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    console.log('Proceeding with Twitter check...');
    // --- End Frequency Check Logic ---

    // Use App-only authentication (Bearer Token)
    const twitterClient = new TwitterApi(twitterBearerToken);
    const twitterApi = twitterClient.readOnly.v2 // Use v2 API endpoints
    ;
    console.log('Twitter client initialized.');

    // 2. Fetch all monitored accounts from the database
    const { data: accounts, error: fetchAccountsError } = await supabase.from('monitored_accounts').select('*, user_id'); // Ensure user_id is selected
    if (fetchAccountsError) {
      throw new Error(`Error fetching monitored accounts: ${fetchAccountsError.message}`);
    }
    if (!accounts || accounts.length === 0) {
      console.log('No accounts to monitor.');
      return new Response(JSON.stringify({
        message: 'No accounts to monitor.'
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    console.log(`Found ${accounts.length} accounts to monitor.`);
    let totalNewTweets = 0;

    // 3. Loop through each account and fetch new tweets
    for (const account of accounts){
      const initialLastTweetId = account.last_tweet_id;
      let wasIncrementalUpdate = initialLastTweetId !== null;
      console.log(`Processing account: @${account.username} (Twitter ID: ${account.twitter_id}), Initial Last Tweet ID: ${initialLastTweetId}`);
      let newTweetsForThisAccount = [];
      let latestTweetIdFetched = account.last_tweet_id;
      let fetchedTweetsCount = 0;
      try {
        // Fetch user timeline using Twitter User ID
        const timelineParams = {
          'tweet.fields': [
            'created_at',
            'entities'
          ],
          'expansions': [
            'attachments.media_keys'
          ],
          'media.fields': [
            'url',
            'preview_image_url'
          ],
          'max_results': 5,
          since_id: undefined
        };
        if (account.last_tweet_id) {
          timelineParams.since_id = account.last_tweet_id;
        }
        console.log(`Fetching timeline for ${account.username} with params:`, timelineParams);
        // Pass the object directly
        const timeline = await twitterApi.userTimeline(account.twitter_id, timelineParams);
        if (timeline.data.data && timeline.data.data.length > 0) {
          fetchedTweetsCount = timeline.data.data.length;
          console.log(`Fetched ${fetchedTweetsCount} new tweets for @${account.username}.`);
          if (timeline.meta.newest_id) {
            if (!latestTweetIdFetched || BigInt(timeline.meta.newest_id) > BigInt(latestTweetIdFetched)) {
              latestTweetIdFetched = timeline.meta.newest_id;
            }
          }
          // Map tweets to our database schema
          newTweetsForThisAccount = timeline.data.data.map((tweet)=>{
            let mediaUrls = [];
            if (tweet.attachments?.media_keys && timeline.includes?.media) {
              mediaUrls = tweet.attachments.media_keys.map((key)=>timeline.includes.media.find((m)=>m.media_key === key)).filter((media)=>!!media) // Type guard
              .map((media)=>media.url || media.preview_image_url) // Prefer full URL
              .filter((url)=>!!url); // Filter out undefined URLs
            }
            return {
              account_id: account.id,
              tweet_id: tweet.id,
              content: tweet.text,
              media_urls: mediaUrls.length > 0 ? mediaUrls : null,
              tweet_created_at: tweet.created_at
            };
          });
          totalNewTweets += newTweetsForThisAccount.length;
          // 4. Insert new tweets into the database
          if (newTweetsForThisAccount.length > 0) {
            console.log(`Inserting ${newTweetsForThisAccount.length} tweets into DB for @${account.username}...`);
            const { error: insertTweetsError } = await supabase.from('tweets').insert(newTweetsForThisAccount);
            if (insertTweetsError) {
              console.error(`Error inserting tweets for @${account.username}: ${insertTweetsError.message}`);
              wasIncrementalUpdate = false; // Do not send notifications on insertion failure
            } else {
              console.log(`Successfully inserted tweets for @${account.username}.`);
              // --- Realtime Notification Logic ---
              if (wasIncrementalUpdate && account.user_id) {
                const channelName = `new-tweets-notifications:${account.user_id}`;
                const notificationPayload = {
                  type: 'broadcast',
                  event: 'new_tweets',
                  payload: {
                    account_username: account.username,
                    count: newTweetsForThisAccount.length,
                    tweets: newTweetsForThisAccount
                  }
                };
                console.log(`Sending Realtime notification to channel: ${channelName}`);
                try {
                  const { error: realtimeError } = await supabase.channel(channelName).send(notificationPayload);
                  if (realtimeError) {
                    console.error(`Error sending Realtime notification for ${account.username}:`, realtimeError);
                  } else {
                    console.log(`Successfully sent Realtime notification for ${account.username}.`);
                  }
                } catch (rtError) {
                  console.error(`Exception sending Realtime notification for ${account.username}:`, rtError);
                }
              } else if (!account.user_id) {
                console.warn(`Cannot send Realtime notification for ${account.username}: missing user_id.`);
              } else {
                console.log(`Skipping Realtime notification for ${account.username}: Not an incremental update.`);
              }
              // --- End Realtime Notification Logic ---
              // --- Phone Notification Logic (Twilio) ---
              if (isTwilioEnabled && wasIncrementalUpdate && account.user_id) {
                console.log(`检查账号 @${account.username} 的新推文是否需要电话通知...`);
                // 1. Fetch users who need phone notifications
                const { data: usersForCalls, error: usersFetchError } = await supabase.from('user_preferences').select('user_id, phone_number') // Select user_id as well
                .eq('phone_notifications_enabled', true).not('phone_number', 'is', null);
                if (usersFetchError) {
                  console.error(`获取电话通知用户失败:`, usersFetchError);
                } else if (usersForCalls && usersForCalls.length > 0) {
                  console.log(`找到 ${usersForCalls.length} 个用户需要接收电话通知 for @${account.username}'s tweet(s).`);
                  // Use only the first new tweet's content for the notification
                  const tweetForNotification = newTweetsForThisAccount[0]?.content;
                  if (!tweetForNotification) {
                    console.warn('No tweet content available for phone notification.');
                    continue; // Skip phone calls if no content
                  }
                  // 2. Initiate calls for each user
                  for (const user of usersForCalls){
                    if (!user.phone_number || !user.user_id) {
                      console.warn(`Skipping call for user due to missing phone number or user ID.`);
                      continue;
                    }
                    const userPhoneNumber = user.phone_number;
                    const targetUserId = user.user_id;
                    let callProvider = null;
                    let callIdentifier = null;
                    // Check if it's a China number
                    const isChinaNumber = userPhoneNumber.startsWith('+86') || userPhoneNumber.startsWith('86');
                    if (isChinaNumber) {
                      // --- Make Aliyun Call ---
                      console.log(`Routing call for ${userPhoneNumber} (China) via Aliyun TTS.`);
                      callProvider = 'aliyun';
                      try {
                        // Prepare template parameters matching the Aliyun template
                        const templateParams = {
                          account: account.username, // Match template variable ${account}
                          content: tweetForNotification // Match template variable ${content}
                        };

                        const callResult = await sendAliyunTtsNotification({
                          phoneNumber: userPhoneNumber,
                          templateId: aliyunTtsTemplateId,
                          templateParams: templateParams,
                          // calledShowNumber: aliyunCalledShowNumber, // Uncomment if using exclusive number
                          outId: `twitter-${targetUserId}-${account.id}` // Example custom ID
                        });
                        
                        callIdentifier = callResult.success ? callResult.callId : null;
                        
                        if (!callResult.success) {
                          console.error(`Aliyun call failed for ${userPhoneNumber}:`, callResult.error);
                        }
                      } catch (aliyunError) {
                        console.error(`Aliyun call exception for ${userPhoneNumber}:`, aliyunError);
                        callIdentifier = null; // Ensure identifier is null on error
                      }
                    } else if (!isChinaNumber && isTwilioEnabled) {
                      // --- Make Twilio Call ---
                      console.log(`Routing call for ${userPhoneNumber} (International) via Twilio.`);
                      callProvider = 'twilio';
                      try {
                        const statusCallbackUrl = 'https://hgoisxycpcgrnmserjqb.supabase.co/functions/v1/twilio-status-callback'; // Ensure this is correct
                        callIdentifier = await makeTwitterCall({
                          to: userPhoneNumber,
                          content: tweetForNotification,
                          accountName: account.username,
                          accountSid: twilioAccountSid,
                          authToken: twilioAuthToken,
                          fromNumber: twilioPhoneNumber,
                          statusCallback: statusCallbackUrl // Add callback URL
                        });
                      } catch (twilioError) {
                        console.error(`Twilio call failed for ${userPhoneNumber}:`, twilioError);
                        callIdentifier = null; // Ensure identifier is null on error
                      }
                    } else {
                      console.warn(`无法为号码 ${userPhoneNumber} 路由电话: 匹配的服务未启用或号码格式不符。`);
                    }
                    // 3. Log the call attempt (if provider was determined)
                    if (callProvider && callIdentifier !== null) {
                      await logCallToDatabase({
                        supabaseClient: supabase,
                        userId: targetUserId,
                        phoneNumber: userPhoneNumber,
                        message: tweetForNotification,
                        provider: callProvider,
                        callSidOrTaskId: String(callIdentifier),
                        status: 'initiated',
                        accountName: account.username // Log which account triggered the call
                      });
                    } else if (callProvider && callIdentifier === null) {
                      // Log failed initiation attempt
                      await logCallToDatabase({
                        supabaseClient: supabase,
                        userId: targetUserId,
                        phoneNumber: userPhoneNumber,
                        message: tweetForNotification,
                        provider: callProvider,
                        callSidOrTaskId: null,
                        status: 'failed_to_initiate',
                        accountName: account.username
                      });
                    }
                  } // End user loop
                } else {
                  console.log(`No users found requiring phone notification for @${account.username}'s tweet(s).`);
                }
              } else if (!wasIncrementalUpdate) {
                console.log(`Skipping phone notification for @${account.username}: Not an incremental update or insert failed.`);
              } else if (!isTwilioEnabled) {
                console.log(`Skipping phone notification for @${account.username}: No call providers enabled.`);
              } else if (!account.user_id) {
                console.warn(`Cannot determine users for phone notification for @${account.username}: missing account.user_id.`);
              }
            }
          }
        } else {
          console.log(`No new tweets found for @${account.username} since ${account.last_tweet_id || 'the beginning'}.`);
        }
      } catch (error) {
        console.error(`Error processing account @${account.username}: ${error.message}`, error.stack);
        // Continue to the next account even if one fails
        // Resetting latestTweetIdFetched to avoid incorrectly updating last_tweet_id on error
        latestTweetIdFetched = initialLastTweetId; // Revert to initial ID on error
      }
      // 5. Update the account's last checked time and last tweet ID
      if (latestTweetIdFetched !== initialLastTweetId || fetchedTweetsCount > 0) {
        // Only update if a newer tweet ID was found OR if tweets were fetched (even if ID didn't change, e.g., first run)
        console.log(`Updating account ${account.username}: last_checked_at = ${invocationTime.toISOString()}, last_tweet_id = ${latestTweetIdFetched}`);
        const { error: updateAccountError } = await supabase.from('monitored_accounts').update({
          last_checked_at: invocationTime.toISOString(),
          last_tweet_id: latestTweetIdFetched
        }).eq('id', account.id);
        if (updateAccountError) {
          console.error(`Error updating account @${account.username}: ${updateAccountError.message}`);
        }
      } else {
        // Only update last_checked_at if no new tweets were found and ID didn't change
        console.log(`Updating account ${account.username}: last_checked_at = ${invocationTime.toISOString()} (no new tweets found)`);
        const { error: updateCheckTimeError } = await supabase.from('monitored_accounts').update({
          last_checked_at: invocationTime.toISOString()
        }).eq('id', account.id);
        if (updateCheckTimeError) {
          console.error(`Error updating check time for account @${account.username}: ${updateCheckTimeError.message}`);
        }
      }
    } // End account loop
    // 6. Update global last execution time
    console.log(`Updating global last execution time to: ${invocationTime.toISOString()}`);
    const { error: updateSettingsError } = await supabase.from('monitoring_settings').update({
      last_execution_time: invocationTime.toISOString()
    }).eq('id', 1);
    if (updateSettingsError) {
      // Log error but don't fail the entire function
      console.error(`Error updating monitoring settings: ${updateSettingsError.message}`);
    }
    console.log(`Cron job finished. Processed ${accounts.length} accounts. Found ${totalNewTweets} new tweets.`);
    return new Response(JSON.stringify({
      success: true,
      newTweets: totalNewTweets
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in Cron function:', error.message, error.stack);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
console.log('Twitter Monitor Cron Function initialized successfully.');

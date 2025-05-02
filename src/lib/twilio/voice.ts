import { twilioClient, fromNumber } from './client';

/**
 * 创建推特通知电话的接口定义
 */
export interface TwitterCallOptions {
  to: string;               // 收件人电话号码
  accountName: string;      // Twitter账号名称
  tweetContent: string;     // 推文内容
  statusCallback?: string;  // 可选的状态回调URL
}

/**
 * 生成简单的TwiML用于语音通知
 * @param accountName Twitter账号名称
 * @param tweetContent 推文内容
 * @returns TwiML字符串
 */
function generateNotificationTwiML(accountName: string, tweetContent: string): string {
  // 处理推文内容，移除特殊字符，限制长度
  const sanitizedContent = tweetContent
    .replace(/&/g, '和')
    .replace(/</g, '')
    .replace(/>/g, '')
    .substring(0, 280); // 限制长度，避免过长

  return `
    <Response>
      <Say language="zh-CN">
        您好，这是推特监控通知。${accountName}发布了新推文：${sanitizedContent}
      </Say>
      <Pause length="1"/>
      <Say language="zh-CN">
        感谢您使用我们的服务，再见。
      </Say>
    </Response>
  `;
}

/**
 * 创建Twitter通知电话
 * @param options 电话参数
 * @returns 电话SID
 */
export async function makeTwitterCall(options: TwitterCallOptions): Promise<string> {
  try {
    // 生成TwiML
    const twiml = generateNotificationTwiML(options.accountName, options.tweetContent);
    
    // 创建电话
    const call = await twilioClient.calls.create({
      to: options.to,
      from: fromNumber,
      twiml: twiml,
      statusCallback: options.statusCallback,
      statusCallbackMethod: 'POST'
    });
    
    console.log(`已成功发起电话通知，SID: ${call.sid}`);
    return call.sid;
  } catch (error) {
    console.error('发起电话通知失败:', error);
    throw error;
  }
}

/**
 * 获取电话状态
 * @param callSid 电话SID
 * @returns 电话状态
 */
export async function getCallStatus(callSid: string): Promise<string> {
  try {
    const call = await twilioClient.calls(callSid).fetch();
    return call.status;
  } catch (error) {
    console.error(`获取电话状态失败 (SID: ${callSid}):`, error);
    throw error;
  }
}

/**
 * 进行批量Twitter通知电话
 * @param users 用户对象数组
 * @param accountName Twitter账号名
 * @param tweetContent 推文内容
 * @returns 电话SID数组
 */
export async function makeTwitterCallsBatch(
  users: Array<{ id: string, phone_number: string }>,
  accountName: string,
  tweetContent: string
): Promise<Array<{ userId: string, callSid: string }>> {
  const results: Array<{ userId: string, callSid: string }> = [];
  
  for (const user of users) {
    try {
      if (!user.phone_number) {
        console.warn(`用户 ${user.id} 没有电话号码，跳过通知`);
        continue;
      }
      
      const callSid = await makeTwitterCall({
        to: user.phone_number,
        accountName,
        tweetContent
      });
      
      results.push({
        userId: user.id,
        callSid
      });
    } catch (error) {
      console.error(`为用户 ${user.id} 发起电话失败:`, error);
    }
  }
  
  return results;
} 
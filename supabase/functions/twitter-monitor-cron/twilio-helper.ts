// supabase/functions/twitter-monitor-cron/twilio-helper.ts
// Twilio在Deno中的简化实现

/**
 * 判断电话号码的区域
 * @param phoneNumber 完整的电话号码(带国际区号)
 * @returns 区域信息 {country: 国家代码, isChina: 是否中国地区}
 */
export function detectPhoneRegion(phoneNumber: string): { country: string; isChina: boolean } {
  // 处理中国电话号码
  if (phoneNumber.startsWith('+86') || phoneNumber.startsWith('86')) {
    return { country: 'CN', isChina: true };
  }
  
  // 处理美国/加拿大电话号码
  if (phoneNumber.startsWith('+1') || phoneNumber.startsWith('1')) {
    return { country: 'US', isChina: false };
  }
  
  // 基于前缀判断其他常见国家
  if (phoneNumber.startsWith('+44')) return { country: 'GB', isChina: false }; // 英国
  if (phoneNumber.startsWith('+81')) return { country: 'JP', isChina: false }; // 日本
  if (phoneNumber.startsWith('+82')) return { country: 'KR', isChina: false }; // 韩国
  if (phoneNumber.startsWith('+61')) return { country: 'AU', isChina: false }; // 澳大利亚
  
  // 默认情况，假设不是中国区号
  return { country: 'UNKNOWN', isChina: false };
}

/**
 * 创建推特通知电话
 * @param options 电话选项
 * @returns 电话SID
 */
export async function makeTwitterCall(options: {
  to: string;
  content: string;
  accountName: string;
  accountSid: string;
  authToken: string;
  fromNumber: string;
  statusCallback?: string; // 添加状态回调URL
}): Promise<string> {
  try {
    // 检测电话号码区域
    const { isChina, country } = detectPhoneRegion(options.to);
    
    // 处理推文内容，移除特殊字符，限制长度
    const sanitizedContent = options.content
      .replace(/&/g, '和')
      .replace(/</g, '')
      .replace(/>/g, '')
      .substring(0, 280); // 限制长度，避免过长
    
    // 如果是中国区号，使用替代方案
    if (isChina) {
      console.log(`检测到中国区号 (${country}) 电话: ${options.to}, 使用替代方案`);
      
      // 目前先生成一个模拟的SID并返回
      // 后续这里会替换为对接国内电话服务商的API调用
      const mockSid = `MOCK_CN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      console.log(`中国区号电话通知已记录 (模拟SID: ${mockSid}), 等待集成国内服务商API`);
      
      return mockSid;
    }
    
    // 非中国区号，使用Twilio API
    console.log(`使用Twilio API为非中国区号 (${country}) 电话发送通知: ${options.to}`);

    // 构建TwiML
    const twiml = `
      <Response>
        <Say language="${isChina ? 'zh-CN' : 'en-US'}">
          ${isChina ? 
            `您好，这是推特监控通知。${options.accountName}发布了新推文：${sanitizedContent}` : 
            `Hello, this is a Twitter monitor notification. ${options.accountName} has posted a new tweet: ${sanitizedContent}`
          }
        </Say>
        <Pause length="1"/>
        <Say language="${isChina ? 'zh-CN' : 'en-US'}">
          ${isChina ? '感谢您使用我们的服务，再见。' : 'Thank you for using our service. Goodbye.'}
        </Say>
      </Response>
    `;

    // Twilio API URL
    const url = `https://api.twilio.com/2010-04-01/Accounts/${options.accountSid}/Calls.json`;
    
    // 构建请求体
    const formData = new FormData();
    formData.append('To', options.to);
    formData.append('From', options.fromNumber);
    formData.append('Twiml', twiml);
    
    // 添加回调URL
    if (options.statusCallback) {
      formData.append('StatusCallback', options.statusCallback);
      formData.append('StatusCallbackMethod', 'POST');
    }

    // 创建授权头
    const auth = btoa(`${options.accountSid}:${options.authToken}`);
    
    // 发送请求到Twilio API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twilio API错误: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`已成功发起Twilio电话通知，SID: ${data.sid}`);
    return data.sid;
  } catch (error) {
    console.error('发起电话通知失败:', error);
    throw error;
  }
}

// 定义日志数据类型
interface CallLogData {
  user_id: string;
  phone_number: string; // Add phone number
  message?: string; // Add message content (optional)
  provider: 'twilio' | 'tencent'; // Add provider
  call_sid_or_task_id: string | null; // Use unified ID field, allow null for failed initiation
  status: string;
  account_name?: string; // Add triggering account name (optional)
  created_at: string;
  // Allow adding other fields if needed, though try to keep specific
  // [key: string]: unknown;
}

// 定义数据库错误类型
interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// 定义Supabase客户端类型 (Adapt based on actual Supabase client type if possible)
interface SupabaseClient {
  from: (table: string) => {
    insert: (data: CallLogData[]) => Promise<{ error: DatabaseError | null }>;
  };
}

/**
 * 记录电话日志到数据库
 * @param params 包含 Supabase 客户端和日志数据的对象
 */
export async function logCallToDatabase(params: {
  supabaseClient: SupabaseClient;
  userId: string;
  phoneNumber: string;
  message?: string;
  provider: 'twilio' | 'tencent';
  callSidOrTaskId: string | null; // Renamed parameter
  status: string;
  accountName?: string;
}) {
  try {
    const logEntry: CallLogData = {
      user_id: params.userId,
      phone_number: params.phoneNumber,
      message: params.message,
      provider: params.provider,
      call_sid_or_task_id: params.callSidOrTaskId,
      status: params.status,
      account_name: params.accountName,
      created_at: new Date().toISOString()
    };

    console.log(`Logging call attempt to database:`, logEntry);

    const { error } = await params.supabaseClient
      .from('call_logs')
      .insert([logEntry]); // Pass the structured log entry

    if (error) {
      console.error('记录电话日志到数据库失败:', error);
    } else {
      console.log('电话日志成功记录到数据库。');
    }
  } catch (error) {
    console.error('记录电话日志到数据库时发生异常:', error);
  }
} 
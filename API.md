# Twitter 监控 API 文档

本文档详细介绍 Twitter 监控功能的 API 调用步骤和流程。

## 快速操作步骤

### 1. 系统设置步骤

1. **环境配置**
   - 创建 `.env.local` 文件并配置以下环境变量：
     ```
     # Twitter API配置
     TWITTER_API_KEY=your_twitter_api_key
     TWITTER_API_SECRET=your_twitter_api_secret
     TWITTER_ACCESS_TOKEN=your_twitter_access_token
     TWITTER_ACCESS_SECRET=your_twitter_access_secret
     
     # Supabase配置
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

2. **获取 Twitter API 凭证**
   - 访问 [Twitter 开发者平台](https://developer.twitter.com)
   - 注册开发者账号并创建项目
   - 获取必要的 API 密钥和访问令牌

3. **安装依赖**
   ```bash
   npm install twitter-api-v2 @supabase/supabase-js
   ```

4. **设置 Supabase 数据库**
   - 创建所需的数据表:
     ```sql
     -- 监控账号表
     CREATE TABLE monitored_accounts (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID NOT NULL,
       twitter_id TEXT NOT NULL,
       username TEXT NOT NULL,
       check_frequency INTEGER DEFAULT 5,
       last_checked_at TIMESTAMP,
       last_tweet_id TEXT,
       created_at TIMESTAMP DEFAULT NOW()
     );
     
     -- 推文表
     CREATE TABLE tweets (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       account_id UUID REFERENCES monitored_accounts(id),
       tweet_id TEXT NOT NULL,
       content TEXT,
       media_urls JSONB,
       engagement INTEGER DEFAULT 0,
       created_at TIMESTAMP NOT NULL
     );
     
     -- 账号分组表
     CREATE TABLE account_groups (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID NOT NULL,
       name TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
     );
     
     -- 账号分组关系表
     CREATE TABLE account_group_relations (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       group_id UUID REFERENCES account_groups(id),
       account_id UUID REFERENCES monitored_accounts(id),
       created_at TIMESTAMP DEFAULT NOW()
     );
     ```

5. **启动应用**
   ```bash
   npm run dev
   ```

6. **验证配置**
   - 访问 `/twitter-monitor` 页面
   - 在 API 设置选项卡中验证 Twitter API 配置是否有效

### 2. 使用步骤

1. **添加监控账号**
   - 在监控账号选项卡中输入要监控的 Twitter 用户名
   - 点击"添加监控"按钮

2. **管理监控账号**
   - 查看监控账号列表
   - 调整监控频率: 可选择 1分钟、5分钟、15分钟、30分钟或1小时
   - 删除不需要的监控账号

3. **查看监控结果**
   - 系统会根据设定的频率自动检查账号的新推文
   - 新推文会被保存到数据库中

4. **设置定时任务** (可选)
   - 在 Supabase Edge Functions 或独立服务器上设置定时任务
   - 调用 `performMonitoringCheck` 函数定期检查所有账号

## 目录

1. [快速操作步骤](#快速操作步骤)
2. [环境配置](#环境配置)
3. [API 端点](#api-端点)
4. [Twitter API 客户端](#twitter-api-客户端)
5. [监控功能 API](#监控功能-api)
6. [调用流程示例](#调用流程示例)

## 环境配置

首先需要配置以下环境变量：

```
# Twitter API配置
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API 端点

### 验证 Twitter API 凭证

- **URL**: `/api/twitter/validate`
- **方法**: `GET`
- **功能**: 验证配置的 Twitter API 凭证是否有效
- **返回示例**:
  ```json
  {
    "success": true,
    "message": "Twitter API凭证有效",
    "user": {
      "id": "123456789",
      "name": "账号名称",
      "username": "用户名"
    }
  }
  ```

### 添加监控账号

- **URL**: `/api/twitter/add-account`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "elonmusk"
  }
  ```
- **功能**: 添加一个新的 Twitter 账号到监控列表
- **返回示例**:
  ```json
  {
    "success": true,
    "message": "成功添加监控账号: elonmusk",
    "account": {
      "id": "1",
      "user_id": "user_123",
      "twitter_id": "44196397",
      "username": "elonmusk",
      "check_frequency": 5
    }
  }
  ```

## Twitter API 客户端

Twitter API 客户端负责处理与 Twitter API 的所有通信，包括错误处理和重试逻辑。

### 客户端初始化

```typescript
// src/lib/twitter-api/client.ts
import { TwitterApi } from 'twitter-api-v2';

// 从环境变量获取Twitter API密钥
const twitterApiKey = process.env.TWITTER_API_KEY || '';
const twitterApiSecret = process.env.TWITTER_API_SECRET || '';
const twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN || '';
const twitterAccessSecret = process.env.TWITTER_ACCESS_SECRET || '';

// 创建Twitter API客户端实例
export const twitterClient = new TwitterApi({
  appKey: twitterApiKey,
  appSecret: twitterApiSecret,
  accessToken: twitterAccessToken,
  accessSecret: twitterAccessSecret,
});

// 获取只读客户端
export const readOnlyClient = twitterClient.readOnly;
```

### 错误处理和重试

```typescript
// 错误处理和重试逻辑
export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    // Twitter API速率限制错误处理
    if (error.code === 429) {
      // 获取重试时间（如果有）
      const resetTime = error.rateLimit?.reset ? new Date(error.rateLimit.reset * 1000) : new Date(Date.now() + 60000);
      const waitTime = Math.max(resetTime.getTime() - Date.now(), delay);
      
      console.log(`Twitter API速率限制，等待 ${waitTime}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    } else {
      // 其他错误，简单等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return withRetry(fn, retries - 1, delay * 2);
  }
};
```

## 监控功能 API

### 获取用户信息

```typescript
// src/lib/twitter-api/utils.ts
export async function fetchTwitterUserByUsername(username: string) {
  try {
    const user = await withRetry(() => 
      readOnlyClient.v2.userByUsername(username, {
        'user.fields': 'id,name,username,profile_image_url,description'
      })
    );
    
    return user.data;
  } catch (error) {
    console.error(`获取Twitter用户 ${username} 信息失败:`, error);
    return null;
  }
}
```

### 获取用户最新推文

```typescript
export async function fetchLatestTweets(twitterId: string, sinceId: string | null = null) {
  try {
    const params: any = {
      'tweet.fields': 'created_at,public_metrics,entities,attachments',
      'media.fields': 'url,preview_image_url',
      'expansions': 'attachments.media_keys',
      'max_results': 10
    };
    
    if (sinceId) {
      params.since_id = sinceId;
    }
    
    const tweets = await withRetry(() => 
      readOnlyClient.v2.userTimeline(twitterId, params)
    );
    
    return tweets.data;
  } catch (error) {
    console.error(`获取用户 ${twitterId} 最新推文失败:`, error);
    return [];
  }
}
```

### 添加监控账号

```typescript
// src/lib/twitter-api/monitoring.ts
export async function addMonitoredAccount(userId: string, twitterUsername: string, twitterId: string) {
  try {
    const { data, error } = await supabase
      .from('monitored_accounts')
      .insert([
        { 
          user_id: userId,
          twitter_id: twitterId,
          username: twitterUsername,
          check_frequency: 5 // 默认5分钟检查一次
        }
      ]);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('添加监控账号失败:', error);
    throw error;
  }
}
```

### 删除监控账号

```typescript
export async function removeMonitoredAccount(userId: string, accountId: string) {
  try {
    const { data, error } = await supabase
      .from('monitored_accounts')
      .delete()
      .match({ id: accountId, user_id: userId });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('删除监控账号失败:', error);
    throw error;
  }
}
```

### 更新监控频率

```typescript
export async function updateMonitorFrequency(userId: string, accountId: string, frequency: number) {
  try {
    const { data, error } = await supabase
      .from('monitored_accounts')
      .update({ check_frequency: frequency })
      .match({ id: accountId, user_id: userId });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('更新监控频率失败:', error);
    throw error;
  }
}
```

### 执行监控检查

```typescript
export async function performMonitoringCheck(accountId: string) {
  try {
    // 1. 获取账号信息
    const { data: account, error: accountError } = await supabase
      .from('monitored_accounts')
      .select('*')
      .eq('id', accountId)
      .single();
      
    if (accountError || !account) {
      throw new Error(`获取监控账号信息失败: ${accountError?.message || '账号不存在'}`);
    }
    
    // 2. 获取最新推文
    const newTweets = await fetchLatestTweets(account.twitter_id, account.last_tweet_id);
    
    if (!newTweets || newTweets.length === 0) {
      console.log(`账号 ${account.username} 没有新推文`);
      return { success: true, newTweetsCount: 0 };
    }
    
    // 3. 存储新推文
    const tweetsToStore = newTweets.map(tweet => ({
      account_id: accountId,
      tweet_id: tweet.id,
      content: tweet.text,
      media_urls: extractMediaUrls(tweet),
      engagement: analyzeTweetEngagement(tweet).totalEngagement,
      created_at: tweet.created_at || new Date().toISOString()
    }));
    
    const { error: insertError } = await supabase
      .from('tweets')
      .insert(tweetsToStore);
      
    if (insertError) {
      throw new Error(`存储推文失败: ${insertError.message}`);
    }
    
    // 4. 更新账号最后推文ID
    const { error: updateError } = await supabase
      .from('monitored_accounts')
      .update({ 
        last_tweet_id: newTweets[0].id,
        last_checked_at: new Date().toISOString()
      })
      .eq('id', accountId);
      
    if (updateError) {
      throw new Error(`更新账号最后推文ID失败: ${updateError.message}`);
    }
    
    // 5. 返回结果
    return {
      success: true,
      newTweetsCount: newTweets.length,
      tweets: tweetsToStore
    };
  } catch (error) {
    console.error(`执行监控检查失败:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

## 调用流程示例

下面是一个典型的监控流程示例：

1. **验证 API 配置**
   ```javascript
   // 前端
   const checkApiStatus = async () => {
     try {
       const response = await fetch('/api/twitter/validate');
       const data = await response.json();
       
       if (response.ok && data.success) {
         console.log('Twitter API 配置有效');
       } else {
         console.error('Twitter API 配置无效');
       }
     } catch (error) {
       console.error('验证失败', error);
     }
   };
   ```

2. **添加监控账号**
   ```javascript
   // 前端
   const addAccount = async (username) => {
     try {
       const response = await fetch('/api/twitter/add-account', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({ username })
       });
       
       const data = await response.json();
       
       if (response.ok && data.success) {
         console.log(`成功添加账号: ${data.account.username}`);
       } else {
         console.error(`添加账号失败: ${data.message}`);
       }
     } catch (error) {
       console.error('添加账号出错', error);
     }
   };
   ```

3. **获取监控账号列表**
   ```javascript
   // 前端
   const fetchAccounts = async () => {
     try {
       const accounts = await getUserMonitoredAccounts(userId);
       console.log('监控账号列表', accounts);
     } catch (error) {
       console.error('获取监控账号失败', error);
     }
   };
   ```

4. **执行监控检查**
   ```javascript
   // 后端（定时任务）
   const monitorAllAccounts = async () => {
     // 获取所有需要检查的账号
     const { data: accounts, error } = await supabase
       .from('monitored_accounts')
       .select('*');
       
     if (error || !accounts) {
       console.error('获取监控账号失败', error);
       return;
     }
     
     // 遍历执行检查
     for (const account of accounts) {
       const result = await performMonitoringCheck(account.id);
       
       if (result.success && result.newTweetsCount > 0) {
         console.log(`检测到 ${account.username} 有 ${result.newTweetsCount} 条新推文`);
         // 处理通知逻辑...
       }
     }
   };
   ```

5. **更新监控频率**
   ```javascript
   // 前端
   const updateFrequency = async (accountId, frequency) => {
     try {
       await updateMonitorFrequency(userId, accountId, frequency);
       console.log(`成功更新监控频率为 ${frequency} 分钟`);
     } catch (error) {
       console.error('更新监控频率失败', error);
     }
   };
   ```

6. **删除监控账号**
   ```javascript
   // 前端
   const deleteAccount = async (accountId) => {
     try {
       await removeMonitoredAccount(userId, accountId);
       console.log('成功删除监控账号');
     } catch (error) {
       console.error('删除监控账号失败', error);
     }
   };
   ```

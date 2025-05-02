# Twitter 监控项目开发日志

## ✅ 已完成功能：cron自动化，电话API集成实现通知后通话

## 2025年5月3日 - 集成腾讯云联络中心 (针对中国用户)

**目标:** 为中国大陆地区 (+86) 的用户提供电话通知服务，补充现有的 Twilio 服务。

**核心步骤:**

1.  **申请腾讯云资源与配置:**
    *   注册腾讯云账号，开通云联络中心 (CCC) 服务。
    *   获取 API 密钥 (SecretId, SecretKey) 和应用 ID (SdkAppId)。
    *   购买或配置合规的腾讯云主叫号码。
    *   在腾讯云 CCC 控制台创建并配置 IVR 流程或智能体脚本：
        *   **关键:** 添加 TTS（文本转语音）节点。
        *   配置 TTS 节点播放内容，使其引用通过 API 传递的变量 (例如 `${Variables.tweetContent}`)，用于朗读动态推文。
    *   记录下 IVR ID 或智能体 ID。

2.  **后端开发 (Supabase Function):**
    *   安装腾讯云 Node.js SDK: 在 `supabase/functions/` 目录下运行 `npm install tencentcloud-sdk-nodejs-ccc`。
    *   创建新的 Supabase Function `tencent-callout` (`supabase/functions/tencent-callout/index.ts`)：
        *   引入腾讯云 CCC Client (`import { CccClient } from 'npm:tencentcloud-sdk-nodejs-ccc@4.0.3'`)。
        *   从环境变量读取腾讯云配置 (SecretId, SecretKey, SdkAppId, CallerNumber, IvrId)。
        *   实现接收 `phone`, `message`, `userId` 的请求处理逻辑。
        *   初始化 `CccClient`。
        *   构建 `CreateAutoCalloutTask` API 的参数 (`params`)：
            *   包含 `SdkAppId`, `NotBefore`, `Callees` (传入的 `phone`), `Callers` (环境变量中的主叫号码), `IvrId` (环境变量中的 IVR ID)。
            *   **关键:** 设置 `Variables` 参数，将推文内容 (`message`) 作为变量值传递 (例如 `[{ Key: 'tweetContent', Value: message }]`)。
            *   设置 `Name`, `Tries`, `TimeZone` 等可选参数。
        *   调用 `client.CreateAutoCalloutTask(params)` 发起外呼。
        *   将外呼任务信息 (如 `TaskId`) 记录到 `call_logs` 表 (provider 设置为 'tencent')。
        *   返回成功或失败响应。
    *   配置 Supabase 环境变量 (Secrets):
        *   `TENCENT_SECRET_ID`
        *   `TENCENT_SECRET_KEY`
        *   `TENCENT_SDKAPPID`
        *   `TENCENT_CALLER_NUMBER`
        *   `TENCENT_IVR_ID`

3.  **API 路由与服务工具:**
    *   创建 Next.js API 路由 (`app/api/tencent-callout/route.ts`):
        *   处理前端请求，验证用户会话。
        *   调用 `supabase.functions.invoke('tencent-callout', { body: { ... } })` 来触发 Supabase Function。
        *   返回 Supabase Function 的结果给前端。
    *   创建或更新通知服务工具 (`src/utils/notification-service.ts`):
        *   添加 `sendPhoneNotification` 函数 (如果尚不存在)。
        *   在该函数中，判断电话号码是否为中国号码 (`+86` 或 `86` 开头)。
        *   如果是中国号码，调用 `/api/tencent-callout` 端点。
        *   如果不是，则调用现有的 Twilio 端点 (`/api/twilio-call`)。

4.  **数据库扩展 (如果需要):**
    *   确认 `call_logs` 表已存在 (根据 2025-05-02 的日志，应该已创建)。
    *   确保 `call_logs` 表包含 `provider` (区分 tencent/twilio) 和 `task_id` (腾讯云任务 ID) 字段。

5.  **前端更新:**
    *   在通知设置页面 (`src/app/dashboard/notifications/page.tsx` 或相关组件) 添加说明，告知用户已支持中国大陆电话通知。
    *   确保调用通知服务工具 (`sendPhoneNotification`) 的地方能够正确处理中国和国际号码。

6.  **部署与测试:**
    *   部署 `tencent-callout` Supabase Function (`npx supabase functions deploy tencent-callout --no-verify-jwt`)。
    *   部署 Next.js 应用。
    *   使用中国大陆手机号进行端到端测试，验证：
        *   能否收到电话。
        *   电话中是否正确朗读了推文内容。
        *   `call_logs` 表中是否记录了正确的 `provider` 和 `task_id`。
    *   测试国际号码，确保 Twilio 流程仍然正常工作。

7.  **日志与监控:**
    *   检查 Supabase Function 日志和腾讯云 CCC 控制台的通话记录，排查潜在问题。
    *   考虑添加更详细的错误处理和状态跟踪。

## 2025年5月2日 - Twilio电话通知功能集成

**目标:** 实现当监控账号发布新推文时，系统自动拨打电话通知用户并朗读推文内容。

**主要工作:**

1. **Twilio API集成**
   - 添加Twilio客户端配置 (`src/lib/twilio/client.ts`)
   - 实现语音通话功能 (`src/lib/twilio/voice.ts`)
   - 为Deno环境创建简化版Twilio辅助函数 (`supabase/functions/twitter-monitor-cron/twilio-helper.ts`)

2. **数据库扩展**
   - 创建数据库迁移脚本，添加电话通知相关表和字段
   - 为`user_preferences`表添加电话号码和通知开关
   - 创建`call_logs`表存储通话记录
   - 创建`call_status_updates`表和触发器，用于处理状态更新

3. **监控功能增强**
   - 扩展cron函数，增加电话通知逻辑
   - 实现用户筛选和多用户通知
   - 添加环境变量检查和错误处理

4. **回调处理**
   - 创建`twilio-status-callback` Edge Function
   - 实现电话状态更新的接收和记录

**下一步计划:**
1. 部署更新后的Edge Functions
2. 设置Twilio账号和环境变量
3. 添加用户界面，允许用户配置电话通知选项
4. 测试和优化通知流程

## 2025年4月30日 - 云端函数优化，实时通知实现

## 2025年4月30日 - Twitter 监控 Cron 函数逻辑梳理

**目标:** 自动化、周期性地检查已监控 Twitter 账号的新推文并存储到数据库。

**核心逻辑步骤:**

1.  **初始化与环境检查**：
    *   启动函数，记录调用时间 (`invocationTime`)。
    *   从环境变量加载并初始化 Supabase 客户端和 Twitter API v2 只读客户端。
    *   检查必要的环境变量 (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TWITTER_BEARER_TOKEN`) 是否存在。

2.  **执行频率检查**：
    *   从 Supabase 的 `monitoring_settings` 表读取上次执行时间 (`last_execution_time`) 和目标执行频率 (`target_frequency_minutes`)。
    *   计算当前时间与上次执行时间的差值（分钟）。
    *   如果时间差小于设定的频率，则跳过本次执行，记录日志并返回状态 200。

3.  **获取待监控账号**：
    *   如果频率检查通过，从 Supabase 的 `monitored_accounts` 表中查询所有需要监控的账号列表 (可添加 `is_active` 等过滤条件)。
    *   如果列表为空，记录日志并返回状态 200。

4.  **遍历账号并获取新推文**：
    *   对每个 `account` 进行循环处理：
        *   记录日志，标明正在处理的账号。
        *   **调用 Twitter API (v2 userTimeline)**：
            *   使用 `account.twitter_id`。
            *   设置 `since_id` 为 `account.last_tweet_id` 以获取增量更新。
            *   请求所需字段 (`created_at`, `entities`, `attachments.media_keys` 等) 和 `expansions` (媒体信息)。
            *   注意 `max_results` 的限制，可能需要分页处理高频账号。
        *   **处理 API 响应**：
            *   检查是否有新推文 (`timeline.data.data`)。
            *   **如有新推文**: 
                *   记录数量，更新 `latestTweetIdFetched` (使用 `timeline.meta.newest_id`)。
                *   **数据映射**: 将推文转换为 `tweets` 表结构 (含 `account_id`, `tweet_id`, `content`, `media_urls`, `tweet_created_at`)，处理媒体 URL。
                *   **存储新推文**: 批量插入 `tweets` 表，记录日志。
            *   **如无新推文**: 记录日志。
        *   **更新账号状态 (`monitored_accounts`)**: 
            *   `last_checked_at` 更新为 `invocationTime`。
            *   如果获取到更新的推文 ID，更新 `last_tweet_id` 为 `latestTweetIdFetched`。
            *   执行更新，记录日志。
        *   **错误处理 (单个账号)**: 使用 `try...catch` 包裹，记录错误，继续处理下一个账号。

5.  **更新全局执行时间 (`monitoring_settings`)**：
    *   所有账号处理完毕后，更新 `monitoring_settings` 表中的 `last_execution_time` 为 `invocationTime`。
    *   记录更新日志（即使失败也不中断）。

6.  **完成与响应**：
    *   记录 Cron 作业完成日志，包含新推文总数。
    *   返回成功响应 (状态 200)，包含 `{ success: true, newTweets: totalNewTweets }`。

7.  **全局错误处理**：
    *   顶层 `try...catch` 捕获未处理异常，记录错误，返回失败响应 (状态 500)，包含错误信息。


## 2025年4月29日 - 自动化推文监控实现计划

**目标:** 利用 Supabase Edge Function 和 Cron Job 实现自动化、周期性的 Twitter 账号新推文检查与存储。

**核心步骤:**

1.  **创建 Edge Function 骨架:**
    *   使用 `npx supabase functions new twitter-monitor-cron` 创建函数基础结构 (`supabase/functions/twitter-monitor-cron/index.ts`)。
2.  **编写 Edge Function 核心逻辑:**
    *   在 `index.ts` 中实现以下功能：
        *   连接 Supabase。
        *   获取 `monitored_accounts` 列表。
        *   调用 Twitter API (v2) 获取每个账号的新推文 (使用 `since_id`)。
        *   处理并格式化推文数据。
        *   将新推文存入 `tweets` 表。
        *   更新 `monitored_accounts` 的 `last_checked_at` 和 `last_tweet_id`。
        *   添加错误处理。
3.  **设置环境变量 (Secrets):**
    *   通过 `npx supabase secrets set` 配置 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (重要!), 和 `TWITTER_BEARER_TOKEN`，确保函数安全访问所需服务。
4.  **部署 Edge Function:**
    *   使用 `npx supabase functions deploy twitter-monitor-cron --no-verify-jwt` 将本地代码部署到 Supabase 云端。
5.  **设置 Cron Job 调度:**
    *   通过 Supabase Dashboard UI (推荐) 或数据库内 `pg_cron` 扩展，创建定时任务 (例如 `*/5 * * * *`) 以定期触发已部署的 Edge Function。
6.  **监控与验证:**
    *   检查 Edge Function 日志、`tweets` 表和 `monitored_accounts` 表，确认功能按预期运行并进行调试。

## 2025年4月28日 - 后端代码重构与问题检查

### 今日完成工作

我们对项目的后端代码进行了重构，采用更清晰的分层结构来实现"添加监控账号"功能：

1. **Twitter API 客户端配置** (`src/lib/twitter-api/client.ts`)
   - 初始化 Twitter API 客户端 (基于 Bearer Token)
   - 添加重试逻辑处理临时性失败和速率限制

2. **Twitter API 工具函数** (`src/lib/twitter-api/utils.ts`) 
   - 实现 `fetchTwitterUserByUsername` 函数
   - 统一错误处理和日志记录

3. **核心业务逻辑** (`src/lib/twitter-api/monitoring.ts`)
   - 实现 `addMonitoredAccount` 函数
   - 分离业务流程: 获取用户信息 → 检查数据库 → 添加记录
   - 返回标准化结果对象 (`{ success, message, code?, account? }`)

4. **API 路由** (`src/app/api/twitter/add-account/route.ts`)
   - 接收前端请求
   - 输入验证
   - 处理用户身份 (目前使用测试 UUID)
   - 调用核心逻辑
   - 返回适当的 HTTP 状态码和 JSON 响应

5. **Supabase 客户端配置** (`src/lib/supabase/client.ts`)
   - 初始化并导出 Supabase 客户端

### 潜在问题与待办事项

通过代码检查，我们发现以下需要关注的问题：

1. **⚠️ 硬编码用户身份**
   - 当前使用硬编码的测试用户 ID: 
   - 待办: 集成真实的用户认证系统，从会话中获取用户 ID

2. **🔄 缺失核心监控逻辑**
   - 目前只实现了"添加账号"功能，尚未实现定期检查推文的功能
   - 待办: 
     - 设计触发机制 (定期执行检查的方法)
     - 实现获取最新推文的函数
     - 管理数据库中的监控状态
     - 设计新推文的处理和通知机制

3. **🔒 数据库安全**
   - 使用的是 Anon Key，安全性依赖于 Supabase RLS 策略
   - 待办: 为 `monitored_accounts` 表设置 RLS 策略，确保用户只能访问自己的记录

4. **⚙️ 前端错误处理**
   - 后端返回结构化错误，前端需要相应更新
   - 待办: 更新前端错误处理逻辑，展示友好的错误消息

5. **🔑 环境变量检查**
   - 确保 `.env.local` 包含所有必要的密钥和配置:
     - `TWITTER_BEARER_TOKEN`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

6. **📦 依赖检查**
   - 确保已安装必要的库:
     - `@supabase/supabase-js`
     - `twitter-api-v2`

### 下一步计划

1. 完成前端界面与后端 API 的集成测试
2. 实现账号列表显示功能
3. 设计并实现监控逻辑和定时任务
4. 集成用户认证系统

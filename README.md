# Twitter Monitor

Twitter监控系统，实时监控重要推特账号，智能过滤内容，多渠道通知，让您不错过任何重要动态。

## 功能特点

- **实时监控**: 通过定时任务 (`Cron Job`) 自动检查关注的Twitter账号更新。
- **增量获取**: 只拉取上次检查之后的新推文。
- **数据存储**: 将获取的推文（内容、时间、媒体链接等）存储在Supabase数据库中。
- **智能内容过滤**: (*此功能在当前代码中未明确体现，后续可添加*)
- **多渠道通知**:
    - **Supabase Realtime**: 通过WebSocket实时推送新推文通知到前端。
    - **电话通知**:
        - **Twilio**: 针对国际电话号码。
        - **腾讯云 CCC**: 针对中国大陆电话号码 (+86)。
        - 自动根据号码归属地选择服务商。
- **通话状态跟踪**: 通过Webhook记录Twilio通话状态。
- **频率控制**: 可配置的监控检查频率，避免过于频繁的API调用。
- **自动化监控系统**: 基于Supabase Edge Functions和Cron Jobs实现。

## 环境变量配置

项目依赖以下环境变量，请在Supabase项目或本地`.env`文件中配置：

```env
# Supabase (必需)
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥 # 用于Edge Functions

# Twitter API (必需)
TWITTER_BEARER_TOKEN=你的Twitter API Bearer Token (App-only)

# Twilio (可选, 用于国际电话通知)
TWILIO_ACCOUNT_SID=你的Twilio账号SID
TWILIO_AUTH_TOKEN=你的Twilio认证令牌
TWILIO_PHONE_NUMBER=你的Twilio电话号码 (用于发起呼叫)

# 腾讯云 CCC (可选, 用于中国大陆电话通知)
TENCENT_SECRET_ID=你的腾讯云Secret ID
TENCENT_SECRET_KEY=你的腾讯云Secret Key
TENCENT_SDKAPPID=你的腾讯云语音应用SDKAppID (数字)
TENCENT_CALLER_NUMBER=你在腾讯云配置的主叫号码
TENCENT_IVR_ID=你在腾讯云配置的IVR ID (数字, 用于自动语音流程)
```
*注意：电话通知功能至少需要配置Twilio或腾讯云中的一种。*

## 数据库表结构

主要表结构 (Supabase PostgreSQL):
- `monitored_accounts`: 存储监控的Twitter账号信息 (如 `twitter_id`, `username`, `last_tweet_id`, `last_checked_at`, `user_id`)。
- `tweets`: 存储获取到的推文数据 (如 `tweet_id`, `account_id`, `content`, `media_urls`, `tweet_created_at`)。
- `user_preferences`: 存储用户偏好设置 (如 `user_id`, `phone_number`, `phone_notifications_enabled`)。
- `call_logs`: 记录电话通知的发起日志 (包括提供商 `twilio`/`tencent`, 状态 `initiated`/`failed_to_initiate`, `call_sid`/`task_id`)。
- `call_status_updates`: 记录Twilio电话状态的回调更新 (如 `call_sid`, `status`, `duration`)。
- `monitoring_settings`: 全局监控设置 (如 `target_frequency_minutes`, `last_execution_time`)。

## 核心工作流程 (twitter-monitor-cron)

1.  **触发**: 由Supabase Cron Job按预定时间触发Edge Function `twitter-monitor-cron`。
2.  **频率检查**: 函数首先查询`monitoring_settings`表，检查距离上次成功执行是否已超过`target_frequency_minutes`，否则提前退出。
3.  **获取账号**: 从`monitored_accounts`表获取所有需要监控的账号列表。
4.  **遍历账号**:
    *   对每个账号，使用Twitter API v2的`userTimeline`接口，并传入`since_id=last_tweet_id`来获取新推文。
    *   **存储推文**: 将获取的新推文存入`tweets`表。
    *   **实时通知**: 若有新推文且非首次抓取，通过Supabase Realtime向频道 `new-tweets-notifications:<USER_ID>` 发送通知。
    *   **电话通知**:
        *   查询`user_preferences`获取需要电话通知的用户。
        *   根据用户`phone_number`前缀判断使用Twilio或腾讯云。
        *   调用相应服务商API发起电话，朗读第一条新推文内容。
        *   在`call_logs`表记录呼叫尝试。
    *   **更新状态**: 更新`monitored_accounts`表中该账号的`last_checked_at`和`last_tweet_id`。
5.  **全局更新**: 更新`monitoring_settings`表中的`last_execution_time`。

## 电话通知功能

- **触发**: 当`twitter-monitor-cron`检测到新推文且用户开启了电话通知时触发。
- **服务商选择**: 自动根据`user_preferences`中的`phone_number`判断：
    - `+86`或`86`开头：使用腾讯云CCC。
    - 其他：使用Twilio。
- **内容**: 自动朗读最新一条推文的文本内容。
- **状态回调 (Twilio)**: Twilio通话状态变更时，会调用`twilio-status-callback` Edge Function，该函数将状态记录到`call_status_updates`表。
- **日志**: 所有电话呼叫尝试（无论成功失败）都会记录在`call_logs`表。

### 使用方法

1.  确保配置了所需服务商（Twilio 或 腾讯云）的环境变量。
2.  在用户偏好设置中（例如通过前端界面操作`user_preferences`表）添加用户的电话号码并设置`phone_notifications_enabled = true`。
3.  系统将在`twitter-monitor-cron`函数检测到新推文时自动发起电话通知。

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 运行Next.js开发服务器 (可能需要配置本地Supabase环境或连接远程)
npm run dev
```

### 部署Edge Functions

确保已安装并登录Supabase CLI。

```bash
# 部署监控核心逻辑
supabase functions deploy twitter-monitor-cron

# 部署Twilio状态回调处理逻辑
supabase functions deploy twilio-status-callback
```

### 设置Cron Jobs

在Supabase Dashboard的 "Database" -> "Cron Jobs" 部分，设置一个定时任务来触发`twitter-monitor-cron`函数。例如，设置每5分钟执行一次：
- **Schedule**: `*/5 * * * *`
- **Function**: `twitter-monitor-cron`

## 前端界面

(*此部分可根据`src/`目录下的具体实现进行补充*)
描述前端界面的主要功能，例如如何添加监控账号、查看推文、设置通知偏好等。

# Twitter Monitor

Twitter监控系统，实时监控重要推特账号，智能过滤内容，多渠道通知，让您不错过任何重要动态。

## 功能特点

- 实时监控推特账号更新
- 智能内容过滤
- 多渠道通知（Realtime、电话通知）
- 自动化监控系统

## 环境变量配置

项目依赖以下环境变量：

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥

# Twitter API
TWITTER_BEARER_TOKEN=你的Twitter API Bearer Token

# Twilio（电话通知）
TWILIO_ACCOUNT_SID=你的Twilio账号SID
TWILIO_AUTH_TOKEN=你的Twilio认证令牌
TWILIO_PHONE_NUMBER=你的Twilio电话号码
```

## 数据库表结构

主要表结构：
- `monitored_accounts`: 监控的Twitter账号
- `tweets`: 存储的推文数据
- `user_preferences`: 用户偏好设置
- `call_logs`: 电话通知日志
- `call_status_updates`: 电话状态更新记录

## 电话通知功能

项目集成了Twilio的电话通知功能，当监控的账号发布新推文时，系统将自动拨打电话通知用户，并朗读推文内容。

### 使用方法

1. 确保配置了Twilio相关环境变量
2. 在用户偏好设置中添加电话号码并启用电话通知
3. 系统将在检测到新推文时自动发起电话通知

### 状态回调

系统还提供了状态回调处理，通过`twilio-status-callback` Edge Function接收并记录电话呼叫状态变更。

## 开发指南

### 本地开发

```bash
npm install
npm run dev
```

### 部署Edge Functions

```bash
supabase functions deploy twitter-monitor-cron
supabase functions deploy twilio-status-callback
```

### 设置Cron Jobs

在Supabase Dashboard中设置定时任务触发监控函数。

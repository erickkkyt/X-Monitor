# 推特动态监控工具产品需求文档 (PRD)

## 1. 产品概述

### 1.1 产品定位
一款基于Supabase的推特账号动态监控和通知工具,帮助用户及时获取关注账号的最新动态。

### 1.2 目标用户
- 需要实时监控特定推特账号动态的个人用户
- 媒体从业者
- 社交媒体运营人员
- 数据分析师

## 2. 功能需求

### 2.1 核心功能

1. **账号监控管理**
   - 添加/删除监控的推特账号
   - 支持批量导入账号
   - 设置监控频率(1分钟/5分钟/15分钟等)
   - 账号分组管理

2. **动态检测**
   - 检测新推文
   - 检测转发(Retweet)
   - 检测回复(Reply)
   - 多媒体内容识别(图片/视频/链接)
   - 关键词过滤
   - 智能内容分析
     - 使用OpenAI API进行内容重要性评估
     - 互动量阈值过滤
     - 智能分类标记

3. **通知系统**
   - 多渠道通知:
     - 邮件通知
     - Telegram Bot通知
     - Discord通知
     - Web端实时推送
   - 通知规则设置:
     - 免打扰时间
     - 通知频率
     - 关键词触发
     - 自定义模板
   - 通知分级:
     - 普通通知: 定期汇总推送
     - 紧急通知: 实时推送重要更新

4. **数据存储与分析**
   - 历史动态记录
   - 数据统计分析
   - 导出功能

5. **智能监控系统**
   - 动态频率调整
   - 内容重要性分析
   - 用户时区适配
   - 智能过滤规则

### 2.2 用户功能
1. **账号管理**
   - 用户注册/登录
   - 个人设置
   - 订阅计划管理
   - 社交账号登录:
     - Google账号登录
     - Twitter账号登录
     - GitHub账号登录
   - 双因素认证(2FA)支持

2. **监控配置**
   - 监控账号管理
   - 通知偏好设置
   - 过滤规则设置

3. **订阅与支付**
   - 订阅计划:
     - 免费计划: 基础监控功能
     - 标准计划: 扩展监控账号数量
     - 专业计划: 完整功能访问
   - 支付方式:
     - 信用卡支付(Stripe)
     - PayPal支付
     - 加密货币支付
   - 账单管理:
     - 自动续费设置
     - 发票生成
     - 支付历史记录

## 3. 技术架构

### 3.1 前端技术栈
1. **Web应用**
   - Next.js 14
   - TailwindCSS
   - TypeScript
   - Supabase Auth UI

2. **状态管理**
   - React Query
   - Zustand

### 3.2 后端技术栈(Supabase)

1. **数据库设计**
```sql
-- 用户表
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 监控账号表
create table public.monitored_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  twitter_id text not null,
  username text not null,
  last_tweet_id text,
  check_frequency integer default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 推文记录表
create table public.tweets (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references public.monitored_accounts not null,
  tweet_id text not null,
  content text,
  media_urls text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 通知配置表
create table public.notification_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  channel text not null,
  config jsonb default '{}'::jsonb,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 监控规则表
create table public.monitoring_rules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  account_id uuid references public.monitored_accounts not null,
  keywords text[],
  min_engagement integer default 0,
  active_interval integer default 300,
  inactive_interval integer default 1800,
  timezone text default 'UTC',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

2. **Supabase 功能使用**
   - **Auth**: 用户认证
   - **Database**: PostgreSQL数据存储
   - **Edge Functions**: 定时任务和通知发送
   - **Realtime**: 实时更新推送
   - **Storage**: 媒体文件缓存

3. **定时任务(Edge Functions)**
   - 定期检查Twitter API
   - 更新数据库记录
   - 触发通知

### 3.3 外部服务集成
1. **Twitter API v2**
   - 用户信息获取
   - 推文获取
   - 媒体内容获取

2. **通知渠道**
   - SMTP服务(邮件)
   - Telegram Bot API
   - Discord Webhook
   - Web Push API

3. **支付服务集成**
   - Stripe支付处理
   - PayPal API集成
   - 加密货币支付网关

4. **社交认证服务**
   - Google OAuth
   - Twitter OAuth
   - GitHub OAuth

## 4. 部署架构

### 4.1 Supabase项目配置
- 计算资源: Pro Plan
- 数据库: 4GB RAM
- 存储: 10GB
- 备份: 每日自动备份

### 4.2 安全配置
- JWT认证
- RLS策略配置
- API访问限制
- 数据加密存储

## 5. 开发里程碑

### 第一阶段 (2周)
- 基础架构搭建
- 数据库设计实现
- Twitter API集成
- 基础监控功能

### 第二阶段 (2周)
- 用户系统开发
- 通知系统实现
- Web界面开发
- 实时推送功能

### 第三阶段 (2周)
- 数据分析功能
- 高级过滤功能
- 系统优化
- 测试与部署

## 6. 注意事项

### 6.1 技术风险
- Twitter API限制和政策变更
- 实时性要求带来的性能压力
- 数据安全性保障
- OpenAI API的稳定性和成本
- 多时区支持的复杂性
- 动态频率调整的准确性
- 跨境支付合规性
- 支付服务可用性
- 社交登录API依赖

### 6.2 成本评估
- Supabase Pro Plan: $25/月
- Twitter API费用: 按使用量计费
- 外部服务费用(SMTP等)
- OpenAI API费用: 按使用量计费
- 短信通知服务费用
- Stripe手续费: 2.9% + $0.30/笔
- PayPal手续费: 3.5% + $0.30/笔
- 加密货币支付网关费用

### 6.3 扩展性考虑
- 支持添加更多社交平台
- 数据分析能力扩展
- API集成能力



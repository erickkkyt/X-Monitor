# X-Monitor: Twitter 动态监控与多渠道通知平台

X-Monitor 是一个基于 Supabase 和 Next.js 构建的全栈应用，旨在帮助用户实时监控指定的 Twitter 账号动态，并通过多种渠道（包括电话语音）获取重要更新的通知。

## ✨ 功能特性

*   **实时监控:** 定时检查关注的 Twitter 账号，获取最新推文。
*   **多账号管理:** 用户可以通过 Web 界面添加、查看和管理需要监控的 Twitter 账号。
*   **新推文存储:** 将获取到的推文内容、媒体链接、发布时间等信息持久化存储在 Supabase 数据库中。
*   **实时 Web 通知:** 利用 Supabase Realtime 向登录的前端用户推送新推文的实时通知。
*   **智能电话通知:**
    *   **自动路由:** 根据用户设置的手机号码自动判断归属地。
    *   **阿里云 TTS:** 向中国大陆用户 (+86) 发送定制化的文本转语音 (TTS) 电话通知。
    *   **Twilio Voice:** 向国际用户发送电话通知。
*   **频率控制:** 后端监控任务包含频率检查逻辑，防止因过于频繁的 API 调用导致速率限制问题。
*   **可配置的环境变量:** 通过 Supabase Secrets 管理敏感信息和 API 密钥。
*   **现代 Web 界面:** 使用 Next.js 和 Tailwind CSS 构建的用户友好的控制台。

## 🛠️ 技术栈

*   **前端:** [Next.js], [Tailwind CSS]
*   **后端:** [Supabase]
    *   数据库: PostgreSQL
    *   认证: Supabase Auth
    *   实时功能: Supabase Realtime
    *   无服务器函数: Supabase Edge Functions (Deno, TypeScript)
*   **外部服务 API:**
    *   [X (Twitter) API v2]
    *   [阿里云语音服务 (Dyvmsapi)]
    *   [Twilio Programmable Voice]
*   **主要语言:** [TypeScript]

## 🚀 快速开始

### 先决条件

*   [Node.js]
*   [pnpm]
*   [Supabase CLI]
*   一个 Supabase 项目
*   Twitter 开发者账号及 API v2 访问权限 (至少 Basic 级别以获得合理的速率限制)
*   阿里云账号及开通语音服务
*   Twilio 账号及购买电话号码 (可选，用于国际通知)

### 安装

1.  克隆仓库:
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```
2.  安装前端依赖:
    ```bash
    pnpm install
    ```
3.  链接到你的 Supabase 项目 (项目根目录):
    ```bash
    supabase login
    supabase link --project-ref <your-project-ref>
    supabase secrets set --from-file ./supabase/.env.local # 确保 .env.local 文件包含下面列出的所有密钥
    ```

### 设置

1.  **Supabase 配置:**
    *   根据需要修改 `supabase/config.toml`。
    *   在 Supabase 控制台创建所需的数据库表 (`monitored_accounts`, `tweets`, `user_preferences`, `monitoring_settings`, `call_logs` 等 - 可能需要根据代码调整或提供 schema 文件)。
    *   设置数据库表的行级安全策略 (RLS)（如果需要）。
2.  **创建 `.env.local` 文件 (前端):** 在项目根目录创建 `.env.local` 文件，并添加前端所需的 Supabase URL 和 Anon Key:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
3.  **配置 Supabase Secrets (后端 Edge Function):** 在项目根目录下创建 `supabase/.env.local` 文件（或直接使用 `supabase secrets set` 命令），包含以下所有环境变量：
    *   **Supabase:**
        *   `SUPABASE_URL`
        *   `SUPABASE_SERVICE_ROLE_KEY`
    *   **Twitter:**
        *   `TWITTER_BEARER_TOKEN` (你的 X API v2 App Bearer Token)
    *   **Aliyun:**
        *   `ALIYUN_ACCESS_KEY_ID`
        *   `ALIYUN_ACCESS_KEY_SECRET`
        *   `ALIYUN_TTS_TEMPLATE_ID` (你在阿里云创建的 TTS 模板 ID)
        *   `ALIYUN_CALLED_SHOW_NUMBER` (可选，如果使用专属号码)
    *   **Twilio (可选):**
        *   `TWILIO_ACCOUNT_SID`
        *   `TWILIO_AUTH_TOKEN`
        *   `TWILIO_PHONE_NUMBER` (你在 Twilio 购买的号码)
    *   **TTS 默认配置 (可选):**
        *   `TTS_CALLED_NUMBER` (如果代码中需要默认值)
        *   `TTS_TEMPLATE_CODE` (如果代码中需要默认值，应与 `ALIYUN_TTS_TEMPLATE_ID` 一致)

    然后运行 `supabase secrets set --from-file ./supabase/.env.local` 将它们设置到 Supabase 云端。

### 运行项目

1.  **本地开发:**
    *   启动 Supabase 本地服务:
        ```bash
        supabase start
        ```
    *   启动 Next.js 前端开发服务器:
        ```bash
        pnpm dev
        ```
    *   本地调用 Edge Function (需要 Supabase CLI):
        ```bash
        supabase functions serve --env-file ./supabase/.env.local
        # 可以通过 curl 或其他工具调用本地函数 URL
        ```
2.  **部署:**
    *   部署 Supabase Edge Function:
        ```bash
        # 确保 secrets 已设置
        npx supabase functions deploy twitter-monitor-cron
        ```
    *   部署 Next.js 前端 (例如 Vercel):
        *   连接你的 Git 仓库到 Vercel。
        *   配置 Vercel 项目的环境变量 (Supabase URL 和 Anon Key)。
        *   触发部署。

## ⚠️ 已知问题与限制

*   **X API 速率限制:** Twitter API v2 对请求频率有严格限制 (尤其是 Free Tier)。监控大量账号或过于频繁地运行监控任务会导致 `429 Too Many Requests` 错误。需要根据使用的 API 级别调整函数的执行频率 (Cron Job 间隔)。详情请参考 `API限制.md`。
*   **SDK 实例化:** 阿里云的部分 SDK (`@alicloud/credentials`, `@alicloud/dyvmsapi20170525`) 在 Deno 环境下可能需要使用 `.default` 属性来访问构造函数，这与官方 TypeScript 示例可能存在不一致。
*   **电话通知成本:** 使用阿里云和 Twilio 发送电话通知会产生费用。
*   **前端监控上限:** 当前前端代码限制免费用户最多监控 3 个账号。

## 💡 未来改进 (可选)

*   实现更精细的频率控制（基于 `monitored_accounts` 表的 `check_frequency`）。
*   添加基于用户订阅计划的限制逻辑。
*   优化错误处理和重试机制（特别是针对 429 错误）。
*   添加更多通知渠道 (如 Telegram, Discord, Email)。
*   完善前端用户体验，如批量导入/导出账号。
*   引入 AI 内容分析，对推文进行重要性评估。

---
*欢迎贡献代码或提出改进建议！*

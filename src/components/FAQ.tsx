'use client';

import { useState } from 'react';

export default function FAQ() {
  const faqs = [
    {
      question: '什么是推特动态监控工具？',
      answer: '推特动态监控工具是一款基于Supabase和AI技术的应用，可以帮助您实时跟踪和管理特定推特账号的动态，并通过多种渠道（如电话、Telegram等）通知您重要的更新。系统使用AI技术分析内容重要性，确保您只收到真正关心的信息。',
    },
    {
      question: '我需要提供X API密钥吗？',
      answer: '不需要。我们的系统设计为无需您提供X API密钥即可工作，这大大简化了设置流程。您只需添加您想要监控的推特账号用户名或ID，系统就会自动开始跟踪他们的动态。',
    },
    {
      question: '我可以监控多少个推特账号？',
      answer: '这取决于您选择的订阅计划。免费版可以监控最多2个账号，标准版可以监控最多5个账号，专业版可以监控最多20个账号。您可以根据自己的需求选择合适的方案。',
    },
    {
      question: '如何设置通知？',
      answer: '在您的个人控制面板中，您可以配置通知设置，包括选择通知渠道（电话、Telegram、Discord等）、设置关键词过滤、互动量阈值、免打扰时间段等。您还可以自定义通知模板和分级规则，区分普通通知和紧急通知。',
    },
    {
      question: '什么是AI内容分析？',
      answer: 'AI内容分析是我们的核心功能之一，系统使用先进的AI模型分析推文内容，评估其重要性和相关性。AI可以识别关键信息、判断内容情感、预测内容价值，并根据您的关注点和历史交互进行个性化推送，确保您只收到真正有价值的通知。',
    },
    {
      question: '如何确保我的数据安全？',
      answer: '我们非常重视用户数据安全。系统使用Supabase的安全架构，实施了严格的数据加密存储、JWT认证、RLS策略配置和API访问限制。我们不会访问您的个人社交媒体账号，也不会在未经您同意的情况下分享您的任何数据。',
    },
    {
      question: '系统支持哪些通知渠道？',
      answer: '系统支持电话、Telegram、Discord、Web推送、邮件等多种通知方式，您可以根据自己的需求灵活选择和组合，确保不错过任何重要动态。',
    },
    {
      question: '通知检查频率是多少？',
      answer: '免费版每30分钟检查一次，标准版每15分钟检查一次，专业版可自定义检查频率。',
    },
    {
      question: '是否有数据分析和导出功能？',
      answer: '标准版和专业版都提供数据分析功能，您可以查看历史推文记录、分析账号活跃度和互动情况。专业版还提供更全面的数据分析工具和无限数据存储。',
    },
    {
      question: '有免费试用吗？',
      answer: '我们提供完全免费的基础版本，您可以监控最多2个推特账号并使用基本功能。',
    },
    {
      question: '如果我遇到问题，如何获得支持？',
      answer: '我们提供多种支持渠道。您可以通过网站上的帮助中心查找常见问题解答，也可以发送邮件至support@x-monitor.com联系客服团队。标准版用户可享受工作日邮件支持，专业版用户则享有优先技术支持，包括实时聊天和快速响应服务。',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">常见问题</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            以下是用户最常提问的问题，如果您有其他疑问，欢迎联系我们
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <div key={index} className="py-6">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex justify-between items-center w-full text-left focus:outline-none"
                >
                  <h3 className="text-lg font-medium text-gray-900 pr-8">{faq.question}</h3>
                  <span className={`flex-shrink-0 ml-2 h-5 w-5 text-gray-500 transition-transform duration-200 ${openIndex === index ? 'transform rotate-180' : ''}`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div className={`mt-2 transition-all duration-200 overflow-hidden ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">还有其他问题？</p>
          <a 
            href="/contact" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            联系我们获取帮助 
            <svg className="ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
} 
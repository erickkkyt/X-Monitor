'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: '免费版',
      description: '适合个人用户入门使用',
      monthlyPrice: '0',
      annualPrice: '0',
      features: [
        '监控最多5个推特账号',
        '邮件通知',
        '基础过滤功能',
        '每5分钟检查更新',
        '3天数据存储',
      ],
      cta: '免费注册',
      highlight: false,
    },
    {
      name: '标准版',
      description: '适合专业用户和小型团队',
      monthlyPrice: '39',
      annualPrice: '29',
      features: [
        '监控最多20个推特账号',
        '邮件 + Telegram通知',
        'AI内容分析',
        '每1分钟检查更新',
        '30天数据存储',
        '数据导出功能',
        '通知规则设置',
      ],
      cta: '开始试用',
      highlight: true,
    },
    {
      name: '专业版',
      description: '适合企业和高级用户',
      monthlyPrice: '99',
      annualPrice: '79',
      features: [
        '监控无限推特账号',
        '全渠道通知(邮件/Telegram/Discord/Web)',
        '高级AI内容分析',
        '自定义检查频率',
        '无限数据存储',
        '完整数据分析',
        '优先技术支持',
        '自定义API集成',
      ],
      cta: '联系我们',
      highlight: false,
    },
  ];

  const switchBg = annual ? 'bg-blue-600' : 'bg-gray-200';
  const switchTranslate = annual ? 'translate-x-6' : 'translate-x-1';

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">选择适合您的计划</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            我们提供灵活的定价方案，从个人用户到企业级需求，总有一款适合您
          </p>
          
          {/* 价格切换器 */}
          <div className="mt-8 flex items-center justify-center">
            <span className={`mr-3 text-sm ${annual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>按年付费</span>
            <button 
              onClick={() => setAnnual(!annual)} 
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${switchBg}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${switchTranslate}`}></span>
            </button>
            <span className={`ml-3 text-sm ${!annual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>按月付费</span>
            {annual && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">省20%</span>}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${plan.highlight ? 'border-blue-600 relative shadow-lg' : 'border-gray-200'}`}
            >
              {plan.highlight && (
                <div className="absolute top-0 inset-x-0 py-1 text-xs text-center text-white font-medium bg-blue-600">
                  推荐方案
                </div>
              )}
              
              <div className={`pt-8 ${plan.highlight ? 'pb-6' : 'pb-8'} px-6 ${plan.highlight ? 'pt-12' : ''}`}>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 mb-6">{plan.description}</p>
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-4xl font-extrabold tracking-tight text-gray-900">¥{annual ? plan.annualPrice : plan.monthlyPrice}</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500">/月</span>
                  </div>
                  {annual && plan.annualPrice !== plan.monthlyPrice && (
                    <p className="mt-1 text-sm text-gray-500">年付账单 ¥{parseInt(plan.annualPrice, 10) * 12}</p>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link 
                    href={plan.name === '免费版' ? '/signup' : (plan.name === '标准版' ? '/signup?plan=standard' : '/contact')} 
                    className={`w-full inline-block text-center py-3 px-6 rounded-lg font-medium ${
                      plan.highlight 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                    } transition-colors`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">需要企业级定制方案？</h3>
                <p className="text-gray-600 max-w-2xl">
                  我们提供定制企业解决方案，包括专属服务器部署、API集成、数据分析和专业技术支持。
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                <Link 
                  href="/contact" 
                  className="inline-block py-3 px-6 rounded-lg font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                  联系销售团队
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
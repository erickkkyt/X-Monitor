'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header'; // Assuming Header is reusable
import Footer from '@/components/Footer'; // Assuming Footer is reusable
import { createClient } from '@/utils/supabase/client';

// Define plan structure (can be expanded)
interface PlanFeature {
  name: string;
  free: boolean | string;
  standard: boolean | string;
  pro: boolean | string;
  description?: string; // Optional description for tooltip/modal
}

// 定义一个简化版Header，仅用于定价页
function PricingHeader() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setLoading(false);
    }
    getUser();
  }, [supabase]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600 mr-2">X-Monitor</span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">AI</span>
            </Link>
          </div>
          {/* 右侧用户信息/控制台按钮 */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="px-6 py-2 border border-blue-600 text-blue-600 font-medium rounded hover:bg-blue-600 hover:text-white transition-colors text-base mr-4"
            >
              控制台
            </Link>
            {loading ? (
              <div className="animate-pulse h-8 w-20 bg-gray-200 rounded-full"></div>
            ) : user ? (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white border-2 border-white shadow-md">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  登录
                </Link>
                <Link href="/login" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    async function checkLogin() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    }
    checkLogin();
  }, [supabase]);

  const plans = [
    {
      id: 'free',
      name: '免费版',
      description: '适合个人用户入门使用',
      monthlyPrice: '0',
      annualPrice: '0',
      features: [
        '监控最多2个推特账号',
        '电话通知',
        '每30分钟检查更新',
        '3天数据存储',
      ],
      cta: '登录/注册',
      ctaLink: '/login',
      highlight: false,
    },
    {
      id: 'standard',
      name: '标准版',
      description: '适合专业用户和小型团队',
      monthlyPrice: '39',
      annualPrice: '29',
      features: [
        '监控最多5个推特账号',
        '全渠道通知(电话/Telegram/Discord/Web)',
        'AI内容分析',
        '每15分钟检查更新',
        '30天数据存储',
        '通知规则设置',
      ],
      cta: '开始试用',
      ctaLink: '/login?plan=standard', // Example link for standard plan signup
      highlight: true,
    },
    {
      id: 'pro',
      name: '专业版',
      description: '适合企业和高级用户',
      monthlyPrice: '99',
      annualPrice: '79',
      features: [
        '监控最多20个推特账号',
        '全渠道通知(电话/Telegram/Discord/Web)',
        '高级AI内容分析',
        '自定义检查频率',
        '无限数据存储',
        '完整数据分析',
        '优先技术支持',
        '自定义API集成',
      ],
      cta: '联系我们',
      ctaLink: '/contact',
      highlight: false,
    },
  ];

  // Detailed feature comparison data
  const detailedFeatures: PlanFeature[] = [
    { name: '监控账号数量', free: '2个', standard: '5个', pro: '20个' },
    { name: '检查更新频率', free: '每30分钟', standard: '每15分钟', pro: '可自定义 (最快1分钟)' },
    { name: '通知渠道 - 电话', free: false, standard: true, pro: true },
    { name: '通知渠道 - Telegram', free: false, standard: true, pro: true },
    { name: '通知渠道 - Discord', free: false, standard: true, pro: true },
    { name: '通知渠道 - Web推送', free: false, standard: true, pro: true },
    { name: 'AI内容分析', free: false, standard: '基础', pro: '高级 (含情感分析、趋势预测)' },
    { name: '数据存储时长', free: '3天', standard: '30天', pro: '无限' },
    { name: '通知规则设置', free: false, standard: true, pro: true },
    { name: '数据分析仪表盘', free: false, standard: '基础', pro: '完整' },
    { name: 'API访问权限', free: false, standard: false, pro: true },
    { name: '优先技术支持', free: false, standard: false, pro: true },
  ];

  // Pricing specific FAQs
  const pricingFaqs = [
    {
      question: '年付和月付有什么区别？',
      answer: '选择按年付费通常可以享受折扣（如此页面所示，年付可节省约20%）。功能上没有区别，只是付费周期和总成本不同。',
    },
    {
      question: '标准版提供免费试用吗？',
      answer: '是的，我们为标准版和专业版提供14天的免费试用期，您可以在试用期内体验全部功能。试用到期前我们会提醒您，您可以选择升级或自动转为免费版。',
    },
    {
      question: '我可以随时升级或降级我的计划吗？',
      answer: '是的，您可以随时在您的账户设置中升级或降级您的订阅计划。升级会立即生效，费用按比例计算；降级将在当前计费周期结束后生效。',
    },
    {
      question: '接受哪些支付方式？',
      answer: '我们接受主流的信用卡支付（Visa, MasterCard, American Express等）以及支付宝和微信支付（针对特定地区）。企业版客户也可以选择银行转账。',
    },
    {
      question: '如果我对服务不满意可以退款吗？',
      answer: '我们提供14天试用期，让您充分评估服务。对于付费计划，我们通常不提供退款，但如果您遇到特殊情况，请联系我们的客服团队，我们会酌情处理。',
    },
    {
      question: '"自定义检查频率"具体是怎样的？',
      answer: '专业版允许您根据需要设置每个监控账号的检查频率，最低可以设置为每1分钟检查一次，以满足对实时性要求极高的场景。',
    },
  ];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const togglePricingFAQ = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };


  const switchBg = annual ? 'bg-blue-600' : 'bg-gray-200';
  const switchTranslate = annual ? 'translate-x-6' : 'translate-x-1';

  return (
    <div className="flex flex-col min-h-screen">
      <PricingHeader />
      {/* 面包屑导航 */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-blue-600 font-medium">首页</Link>
          </li>
          <li>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-700 font-semibold">定价</li>
        </ol>
      </nav>
      <main className="flex-grow">
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">选择最适合您的 X-Monitor 计划</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                从免费开始，或选择功能更强大的付费计划，解锁高级监控和分析能力。
              </p>
              {/* Price Toggler */}
              <div className="mt-10 flex items-center justify-center">
                <span className={`mr-3 text-base ${annual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>按年付费</span>
                <button
                  onClick={() => setAnnual(!annual)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${switchBg}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${switchTranslate}`}></span>
                </button>
                <span className={`ml-3 text-base ${!annual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>按月付费</span>
                {annual && <span className="ml-3 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">立省20%</span>}
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col ${plan.highlight ? 'border-blue-600 relative ring-2 ring-blue-500 shadow-lg' : 'border-gray-200'}`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 inset-x-0 py-1.5 text-sm text-center text-white font-semibold bg-blue-600">
                      推荐方案
                    </div>
                  )}
                  <div className={`pt-8 px-6 ${plan.highlight ? 'pt-12' : ''} text-center`}>
                     <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                     <p className="text-gray-500 mb-6 h-10">{plan.description}</p>
                     <div className="mt-4 flex items-baseline justify-center">
                       <span className="text-5xl font-extrabold tracking-tight text-gray-900">¥{annual ? plan.annualPrice : plan.monthlyPrice}</span>
                       <span className="ml-1 text-xl font-semibold text-gray-500">/月</span>
                     </div>
                     {annual && plan.annualPrice !== plan.monthlyPrice && (
                       <p className="mt-1 text-sm text-gray-500">年付账单 ¥{parseInt(plan.annualPrice, 10) * 12}</p>
                     )}
                  </div>
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-8 flex-grow flex flex-col justify-between">
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <svg className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="ml-3 text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.id === 'free' ? (
                      <button
                        onClick={() => {
                          if (isLoggedIn) {
                            window.location.href = '/dashboard';
                          } else {
                            window.location.href = '/login';
                          }
                        }}
                        className={`w-full block text-center py-3 px-6 rounded-lg font-medium text-lg ${
                          plan.highlight
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                        } transition-colors`}
                      >
                        登录/注册
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className={`w-full block text-center py-3 px-6 rounded-lg font-medium text-lg ${
                          plan.highlight
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                        } transition-colors`}
                      >
                        升级计划
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* 升级计划提示弹窗 */}
            {showUpgradeModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center flex flex-col items-center">
                  <div className="text-3xl font-extrabold mb-3 text-blue-600 tracking-tight">升级计划即将更新</div>
                  <div className="text-base text-gray-500 mb-8">敬请期待</div>
                  <button
                    className="mt-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                    onClick={() => setShowUpgradeModal(false)}
                  >
                    知道了
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">功能详细对比</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600 w-1/4">功能特性</th>
                    {plans.map(plan => (
                      <th key={plan.id} className={`py-4 px-6 text-center text-sm font-semibold w-1/4 ${plan.highlight ? 'text-blue-700' : 'text-gray-600'}`}>{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detailedFeatures.map((feature, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm text-gray-800 font-medium">
                        {feature.name}
                        {feature.description && (
                           <span className="ml-1 text-gray-400 cursor-help" title={feature.description}>ⓘ</span>
                         )}
                       </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-600">
                        {typeof feature.free === 'boolean' ? (feature.free ? '✔️' : '❌') : feature.free}
                      </td>
                      <td className={`py-4 px-6 text-center text-sm ${plans[1].highlight ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
                        {typeof feature.standard === 'boolean' ? (feature.standard ? '✔️' : '❌') : feature.standard}
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-600">
                        {typeof feature.pro === 'boolean' ? (feature.pro ? '✔️' : '❌') : feature.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pricing FAQ Section */}
        <section className="py-20 bg-white">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-gray-900 mb-4">定价常见问题</h2>
             </div>
             <div className="max-w-3xl mx-auto">
               <div className="divide-y divide-gray-200">
                 {pricingFaqs.map((faq, index) => (
                   <div key={index} className="py-6">
                     <button
                       onClick={() => togglePricingFAQ(index)}
                       className="flex justify-between items-center w-full text-left focus:outline-none"
                     >
                       <h3 className="text-lg font-medium text-gray-900 pr-8">{faq.question}</h3>
                       <span className={`flex-shrink-0 ml-2 h-5 w-5 text-gray-500 transition-transform duration-200 ${openFaqIndex === index ? 'transform rotate-180' : ''}`}>
                         <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                         </svg>
                       </span>
                     </button>
                     <div className={`mt-3 transition-all duration-300 overflow-hidden ${openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                       <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </section>
      </main>
      <Footer />
    </div>
  );
} 
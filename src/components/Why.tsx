'use client';

export default function Why() {
  const benefits = [
    {
      title: '省时高效',
      description: '无需手动刷新推特页面，系统自动监控并通知您重要动态，节省您的宝贵时间。',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'AI智能筛选',
      description: '先进的AI技术分析内容重要性，只推送真正有价值的信息，避免信息过载。',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: '多渠道通知',
      description: '支持电话、Telegram、Discord等多种通知方式，确保您不错过任何重要更新。',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
    },
    {
      title: '无需X API密钥',
      description: '我们的系统不需要您提供X API密钥，简化了设置流程，同时保持强大的功能。',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
  ];

  const metrics = [
    { value: '500+', label: '满意用户' },
    { value: '5,000+', label: '监控账号' },
    { value: '100,000+', label: '推送通知' },
    { value: '99.9%', label: '服务可用性' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">为什么选择我们的推特监控工具</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            我们提供业内领先的推特监控解决方案，帮助您更高效地管理社交媒体信息流
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {benefit.icon}
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-12 sm:p-16">
            <div className="text-center mb-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">值得信赖的推特监控平台</h3>
              <p className="text-blue-100 text-lg md:max-w-2xl md:mx-auto">
                我们帮助各行各业的用户实时掌握推特动态，提高工作效率，避免错过重要信息
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {metrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{metric.value}</div>
                  <div className="text-sm text-blue-100">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center p-1 bg-blue-100 rounded-full">
            <span className="px-3 py-1 text-sm font-medium text-blue-800 bg-white rounded-full">
              客户反馈
            </span>
          </div>
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="relative">
              <svg className="absolute top-0 left-0 transform -translate-x-6 -translate-y-8 h-16 w-16 text-blue-100" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M7.39762 10.3C7.39762 11.0733 7.14888 11.7 6.6514 12.18C6.15392 12.6333 5.52552 12.86 4.76621 12.86C3.84979 12.86 3.09047 12.5533 2.48825 11.94C1.91222 11.3266 1.62421 10.4467 1.62421 9.29999C1.62421 8.07332 1.96459 6.87332 2.64535 5.69999C3.35231 4.49999 4.33418 3.55332 5.59098 2.85999L6.4943 4.25999C5.81354 4.73999 5.26369 5.27332 4.84476 5.85999C4.45201 6.44666 4.19017 7.12666 4.05926 7.89999C4.29491 7.79332 4.56983 7.73999 4.88403 7.73999C5.61716 7.73999 6.21938 7.97999 6.68996 8.45999C7.16054 8.93999 7.39762 9.55333 7.39762 10.3ZM14.6242 10.3C14.6242 11.0733 14.3755 11.7 13.878 12.18C13.3805 12.6333 12.7521 12.86 11.9928 12.86C11.0764 12.86 10.3171 12.5533 9.71484 11.94C9.13881 11.3266 8.85079 10.4467 8.85079 9.29999C8.85079 8.07332 9.19117 6.87332 9.87194 5.69999C10.5789 4.49999 11.5608 3.55332 12.8176 2.85999L13.7209 4.25999C13.0401 4.73999 12.4903 5.27332 12.0713 5.85999C11.6786 6.44666 11.4168 7.12666 11.2858 7.89999C11.5215 7.79332 11.7964 7.73999 12.1106 7.73999C12.8437 7.73999 13.446 7.97999 13.9166 8.45999C14.3872 8.93999 14.6242 9.55333 14.6242 10.3Z" fill="currentColor" />
              </svg>
              <blockquote className="relative text-xl md:text-2xl font-medium text-gray-900">
                这款工具帮助我们社交媒体团队大大提高了工作效率。我们可以第一时间获知关键账号的动态，AI筛选功能确保我们只收到真正重要的通知。非常推荐给需要实时关注推特动态的专业人士。
              </blockquote>
              <svg className="absolute bottom-0 right-0 transform translate-x-6 translate-y-8 h-16 w-16 text-blue-100" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8.60238 5.7C8.60238 4.92667 8.85112 4.3 9.3486 3.82C9.84608 3.36667 10.4745 3.14 11.2338 3.14C12.1502 3.14 12.9095 3.44667 13.5118 4.06C14.0878 4.67333 14.3758 5.55333 14.3758 6.7C14.3758 7.92667 14.0354 9.12667 13.3547 10.3C12.6477 11.5 11.6658 12.4467 10.409 13.14L9.5057 11.74C10.1865 11.26 10.7363 10.7267 11.1552 10.14C11.548 9.55333 11.8098 8.87333 11.9407 8.1C11.7051 8.20667 11.4302 8.26 11.116 8.26C10.3828 8.26 9.78062 8.02 9.31004 7.54C8.83946 7.06 8.60238 6.44667 8.60238 5.7ZM1.37579 5.7C1.37579 4.92667 1.62453 4.3 2.12201 3.82C2.61949 3.36667 3.24789 3.14 4.0072 3.14C4.92362 3.14 5.68294 3.44667 6.28516 4.06C6.86119 4.67333 7.14921 5.55333 7.14921 6.7C7.14921 7.92667 6.80883 9.12667 6.12806 10.3C5.42111 11.5 4.43923 12.4467 3.18243 13.14L2.27911 11.74C2.95988 11.26 3.50973 10.7267 3.92866 10.14C4.32142 9.55333 4.58326 8.87333 4.71417 8.1C4.4785 8.20667 4.20358 8.26 3.88938 8.26C3.15625 8.26 2.55403 8.02 2.08345 7.54C1.61287 7.06 1.37579 6.44667 1.37579 5.7Z" fill="currentColor" />
              </svg>
            </div>
            <div className="mt-8 flex items-center justify-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
              </div>
              <div className="ml-3 text-left">
                <div className="text-base font-medium text-gray-900">王小明</div>
                <div className="text-sm text-gray-500">社交媒体总监 @ 某科技公司</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
} 
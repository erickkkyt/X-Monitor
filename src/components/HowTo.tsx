'use client';

export default function HowTo() {
  const steps = [
    {
      title: '创建账号',
      description: '注册并创建您的个人账号，可使用Google、Twitter或GitHub账号直接登录，快速开始使用。',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: '添加监控账号',
      description: '输入您想要监控的推特账号用户名或ID，也可以批量导入多个账号，并设置分组和监控频率。',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: '设置通知规则',
      description: '选择您偏好的通知渠道，设置关键词过滤、互动量阈值和通知时段，自定义您的通知模板。',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: '接收智能通知',
      description: '系统会自动监控推特动态，AI分析内容重要性，并根据您的设置发送通知，让您随时掌握重要信息。',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">如何使用推特监控工具</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            简单四步，轻松开始监控您关注的推特账号动态
          </p>
        </div>

        <div className="relative">
          {/* 连接线 */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-200 -translate-x-1/2"></div>
          
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className={`lg:flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  <div className="hidden lg:flex lg:w-1/2 justify-center">
                    <div className="relative">
                      {/* 步骤圆圈 */}
                      <div className="w-16 h-16 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center z-10 relative text-blue-600">
                        {step.icon}
                      </div>
                      {/* 步骤数字 */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                  <div className={`lg:w-1/2 p-6 bg-white rounded-xl shadow-sm border border-gray-100 ${index % 2 === 0 ? 'lg:ml-6' : 'lg:mr-6'}`}>
                    {/* 移动端步骤展示 */}
                    <div className="flex items-center mb-4 lg:hidden">
                      <div className="flex-shrink-0 relative mr-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          {step.icon}
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                    {/* 桌面端标题 */}
                    <h3 className="hidden lg:block text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 
'use client';

export default function WhatIs() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center">
          <div className="lg:w-1/2 mb-12 lg:mb-0 lg:pr-12">
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-500/10 rounded-full"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-500/10 rounded-full"></div>
              
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-1">
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="aspect-video relative">
                    {/* 在实际项目中替换为实际图片 */}
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <div className="text-gray-400 flex flex-col items-center">
                        <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>产品演示视频</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              推特动态监控工具是什么？
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              推特动态监控工具是一款基于Supabase和AI技术的应用，旨在帮助用户实时跟踪和管理重要推特账号的动态。无论您是社交媒体运营人员、媒体从业者、数据分析师，还是普通用户，都能从中受益。
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">不再错过重要动态</h3>
                  <p className="mt-1 text-gray-600">系统会自动检测您关注账号的新推文、转发和回复，并根据您设置的规则发送通知。</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">智能内容过滤</h3>
                  <p className="mt-1 text-gray-600">AI分析技术能够评估内容重要性，自动过滤无关信息，只向您推送真正有价值的内容。</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">灵活的通知选项</h3>
                  <p className="mt-1 text-gray-600">支持邮件、Telegram、Discord等多种通知方式，您可以根据自己的偏好和场景灵活选择。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
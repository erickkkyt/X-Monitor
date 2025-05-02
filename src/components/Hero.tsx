'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-12">
          <div className="lg:w-1/2 mb-12 lg:mb-0">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
              <span className="text-blue-600">AI驱动</span>的推特动态<br />监控与通知系统
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg">
              实时监控重要推特账号，智能过滤内容，多渠道通知，让您不错过任何重要动态。
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/dashboard" 
                className="inline-block bg-blue-600 text-white font-medium px-8 py-4 rounded-full text-center hover:bg-blue-700 transition-colors"
              >
                开始使用 - 免费试用
              </Link>
              <Link 
                href="#how-it-works" 
                className="inline-block bg-gray-100 text-gray-800 font-medium px-8 py-4 rounded-full text-center hover:bg-gray-200 transition-colors"
              >
                了解详情
              </Link>
            </div>
            <div className="mt-8 text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>无需Twitter API密钥</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>免费计划每月可监控5个账号</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>支持邮件、Telegram等多渠道通知</span>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2">
            <div className="relative bg-white shadow-xl rounded-2xl p-2 border border-gray-200">
              <div className="relative bg-gray-50 rounded-xl overflow-hidden">
                {/* 在实际项目中，这里可以替换为真实的应用截图 */}
                <div className="w-full aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 flex flex-col p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        T
                      </div>
                      <div className="text-white">
                        <div className="font-bold">TwitterMonitor</div>
                        <div className="text-xs opacity-70">实时监控控制台</div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-xs text-white/70 mb-1">监控账号</div>
                        <div className="text-white font-medium">23 个</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-xs text-white/70 mb-1">今日通知</div>
                        <div className="text-white font-medium">47 条</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-xs text-white/70 mb-1">重要更新</div>
                        <div className="text-white font-medium">5 条</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-xs text-white/70 mb-1">AI分析</div>
                        <div className="text-white font-medium">启用</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="h-16 flex items-center space-x-4">
                    <div className="w-full">
                      <div className="bg-gray-200 h-10 rounded-full flex items-center px-4">
                        <span className="text-gray-500">添加推特账号...</span>
                      </div>
                    </div>
                    <button className="h-10 w-10 flex-shrink-0 bg-blue-600 rounded-full flex items-center justify-center text-white">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';

import Link from 'next/link';
// import Image from 'next/image'; // 不再需要 Image 组件

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
                <span>无需X API密钥</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>免费计划每月可监控3个账号</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>支持邮件、Telegram等多渠道通知</span>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 scale-110 origin-right">
            <div className="relative bg-white shadow-xl rounded-2xl p-2 border border-gray-200">
              <div className="relative bg-gray-50 rounded-xl overflow-hidden">
                {/* 控制台示意图仿真优化（无header，左右均分） */}
                <div className="w-full aspect-[16/7] bg-gray-900 rounded-lg overflow-hidden relative flex flex-row p-6 gap-6">
                  {/* 左侧监控账号 */}
                  <div className="flex-1 bg-[#181c22] rounded-lg p-5 flex flex-col justify-start">
                    <div className="text-white text-base font-bold mb-4">监控账号 (1)</div>
                    <div className="flex items-center bg-[#23272f] rounded-lg p-4 mb-2 shadow-sm">
                      {/* <Image src="https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png" alt="avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-gray-700" /> */}
                      {/* 移除图片占位 */}
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 mr-3"></div> {/* 添加一个灰色占位符 */}
                      <div className="flex-1">
                        <div className="text-white font-semibold">kkkkeric</div>
                        <div className="text-xs text-gray-400">@kkkkericAI</div>
                      </div>
                      <div className="text-xs text-gray-400">添加于: 2025/4/30</div>
                    </div>
                  </div>
                  {/* 右侧今日通知 */}
                  <div className="flex-1 bg-[#181c22] rounded-lg p-5 flex flex-col justify-start">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-white text-base font-bold">今日通知</div>
                      <button className="text-xs text-red-400 hover:underline">清除全部</button>
                    </div>
                    <div className="space-y-4">
                      {/* 示例推文1 */}
                      <div className="bg-[#23272f] rounded-lg p-4 flex items-start shadow-sm">
                        {/* <Image src="https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png" alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-gray-700 mt-1" /> */}
                        {/* 移除图片占位 */}
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 mr-3 mt-1"></div> {/* 添加一个灰色占位符 */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-semibold text-sm">kkkkeric</span>
                            <span className="text-xs text-gray-400">@kkkkericAI</span>
                          </div>
                          <div className="text-gray-200 text-sm mt-1">5.2 testing 20.11</div>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-500">2 小时前</span>
                            <button className="text-xs text-blue-400 hover:underline">查看详情</button>
                          </div>
                        </div>
                      </div>
                      {/* 示例推文2 */}
                      <div className="bg-[#23272f] rounded-lg p-4 flex items-start shadow-sm">
                        {/* <Image src="https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png" alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-gray-700 mt-1" /> */}
                        {/* 移除图片占位 */}
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 mr-3 mt-1"></div> {/* 添加一个灰色占位符 */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-semibold text-sm">kkkkeric</span>
                            <span className="text-xs text-gray-400">@kkkkericAI</span>
                          </div>
                          <div className="text-gray-200 text-sm mt-1">5.2 retesting, 17.31</div>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-500">4 小时前</span>
                            <button className="text-xs text-blue-400 hover:underline">查看详情</button>
                          </div>
                        </div>
                      </div>
                      {/* 示例推文3 */}
                      <div className="bg-[#23272f] rounded-lg p-4 flex items-start shadow-sm">
                        {/* <Image src="https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png" alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-gray-700 mt-1" /> */}
                        {/* 移除图片占位 */}
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 mr-3 mt-1"></div> {/* 添加一个灰色占位符 */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-semibold text-sm">kkkkeric</span>
                            <span className="text-xs text-gray-400">@kkkkericAI</span>
                          </div>
                          <div className="text-gray-200 text-sm mt-1">5.2 testing again ,16.57</div>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-500">5 小时前</span>
                            <button className="text-xs text-blue-400 hover:underline">查看详情</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* 底部添加账号输入区保持不变 */}
                <div className="p-4">
                  <div className="h-12 flex items-center space-x-4">
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
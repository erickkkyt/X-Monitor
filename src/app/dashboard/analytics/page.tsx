'use client';

import React from 'react';
import { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7天');
  const [selectedAccount, setSelectedAccount] = useState('全部账号');

  return (
    <div className="min-h-screen bg-[#0f1218] text-white">
      <DashboardHeader />

      {/* 主内容区 */}
      <main className="p-6">
        {/* 升级提示框 */}
        <div className="mb-6 bg-[#182032] border border-blue-500 rounded-md p-6 shadow flex flex-col items-center text-center">
          <div className="mb-3">
            <svg className="w-10 h-10 text-blue-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-blue-100 text-base mb-4 max-w-xl mx-auto">免费计划不支持更多的数据分析功能，请升级版本以解锁高级分析与导出。</p>
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-md text-base transition-colors duration-200 flex items-center justify-center mt-1" onClick={() => window.location.href = '/pricing'}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            升级计划
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">数据分析</h2>
          <div className="flex space-x-4">
            <select 
              value={selectedAccount} 
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-[#1c2128] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-75"
              disabled
            >
              <option>全部账号</option>
              <option>@elonmusk</option>
              <option>@BillGates</option>
              <option>@satyanadella</option>
              <option>@tim_cook</option>
            </select>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#1c2128] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-75"
              disabled
            >
              <option>今天</option>
              <option>7天</option>
              <option>30天</option>
              <option>90天</option>
              <option>自定义</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 推文数量趋势 */}
          <div className="bg-[#1c2128] rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">推文数量趋势</h3>
            <div className="h-64 flex items-center justify-center">
              {/* 这里将来会放置实际的图表组件 */}
              <div className="w-full h-full bg-[#161b22] rounded-md flex items-center justify-center">
                <div className="text-gray-400 flex flex-col items-center">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <span>推文数量趋势图</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#161b22] p-2 rounded">
                <p className="text-sm text-gray-400">总推文</p>
                <p className="text-xl font-bold">1,245</p>
              </div>
              <div className="bg-[#161b22] p-2 rounded">
                <p className="text-sm text-gray-400">平均/天</p>
                <p className="text-xl font-bold">42</p>
              </div>
              <div className="bg-[#161b22] p-2 rounded">
                <p className="text-sm text-gray-400">增长率</p>
                <p className="text-xl font-bold text-green-500">+12%</p>
              </div>
              <div className="bg-[#161b22] p-2 rounded">
                <p className="text-sm text-gray-400">高峰日</p>
                <p className="text-xl font-bold">周三</p>
              </div>
            </div>
          </div>

          {/* 互动数据分析 */}
          <div className="bg-[#1c2128] rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">互动数据分析</h3>
            <div className="h-64 flex items-center justify-center">
              {/* 这里将来会放置实际的图表组件 */}
              <div className="w-full h-full bg-[#161b22] rounded-md flex items-center justify-center">
                <div className="text-gray-400 flex flex-col items-center">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <span>互动数据饼图</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#161b22] p-2 rounded">
                <p className="text-sm text-gray-400">点赞</p>
                <p className="text-xl font-bold">24.5K</p>
              </div>
              <div className="bg-[#161b22] p-2 rounded">
                <p className="text-sm text-gray-400">转发</p>
                <p className="text-xl font-bold">8.3K</p>
              </div>
              <div className="bg-[#161b22] p-2 rounded">
                <p className="text-sm text-gray-400">评论</p>
                <p className="text-xl font-bold">12.7K</p>
              </div>
              <div className="bg-[#161b22] p-2 rounded">
                <p className="text-sm text-gray-400">引用</p>
                <p className="text-xl font-bold">3.2K</p>
              </div>
            </div>
          </div>

          {/* 热门推文 */}
          <div className="bg-[#1c2128] rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">热门推文</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-3 bg-[#161b22] rounded-md">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">@username{index + 1}</p>
                        <span className="text-sm text-gray-400">· {index + 1}天前</span>
                      </div>
                      <p className="text-sm mt-1">这是一条热门推文示例，展示了高互动量的内容。实际使用时会替换为真实的推文内容。</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{(5 - index) * 1250}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>{(5 - index) * 450}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{(5 - index) * 320}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 关键词分析 */}
          <div className="bg-[#1c2128] rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">关键词分析</h3>
            <div className="p-4 bg-[#161b22] rounded-md mb-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { text: '产品', size: 'text-2xl', color: 'text-blue-400' },
                  { text: '更新', size: 'text-xl', color: 'text-green-400' },
                  { text: '发布', size: 'text-lg', color: 'text-yellow-400' },
                  { text: '技术', size: 'text-xl', color: 'text-purple-400' },
                  { text: '创新', size: 'text-lg', color: 'text-red-400' },
                  { text: '用户', size: 'text-base', color: 'text-blue-300' },
                  { text: '体验', size: 'text-base', color: 'text-green-300' },
                  { text: '功能', size: 'text-lg', color: 'text-yellow-300' },
                  { text: '设计', size: 'text-base', color: 'text-purple-300' },
                  { text: '市场', size: 'text-sm', color: 'text-red-300' },
                  { text: '反馈', size: 'text-sm', color: 'text-blue-200' },
                  { text: '改进', size: 'text-base', color: 'text-green-200' },
                  { text: '版本', size: 'text-sm', color: 'text-yellow-200' },
                  { text: '合作', size: 'text-xs', color: 'text-purple-200' },
                  { text: '未来', size: 'text-xs', color: 'text-red-200' },
                ].map((keyword, index) => (
                  <span key={index} className={`${keyword.size} ${keyword.color} font-medium px-2 py-1`}>
                    {keyword.text}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#161b22] p-3 rounded-md">
                <h4 className="font-medium mb-2">热门话题</h4>
                <ul className="space-y-2">
                  <li className="flex justify-between items-center">
                    <span className="text-sm">#产品更新</span>
                    <span className="text-sm text-gray-400">32%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm">#技术创新</span>
                    <span className="text-sm text-gray-400">24%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm">#用户体验</span>
                    <span className="text-sm text-gray-400">18%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm">#市场动态</span>
                    <span className="text-sm text-gray-400">14%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm">#合作伙伴</span>
                    <span className="text-sm text-gray-400">12%</span>
                  </li>
                </ul>
              </div>
              <div className="bg-[#161b22] p-3 rounded-md">
                <h4 className="font-medium mb-2">情感分析</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">积极</span>
                      <span className="text-sm text-gray-400">65%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">中性</span>
                      <span className="text-sm text-gray-400">25%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gray-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">消极</span>
                      <span className="text-sm text-gray-400">10%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 导出报告 */}
        <div className="mt-6 flex justify-end">
          <button className="bg-blue-600 text-white rounded-md px-6 py-2 opacity-75 cursor-not-allowed" disabled>
            导出分析报告
          </button>
        </div>
      </main>
    </div>
  );
}
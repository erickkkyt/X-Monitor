'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([
    { id: 1, username: 'elonmusk', displayName: 'Elon Musk', avatar: '', lastUpdate: '10分钟前', isActive: true },
    { id: 2, username: 'BillGates', displayName: 'Bill Gates', avatar: '', lastUpdate: '25分钟前', isActive: true },
    { id: 3, username: 'satyanadella', displayName: 'Satya Nadella', avatar: '', lastUpdate: '1小时前', isActive: true },
    { id: 4, username: 'sundarpichai', displayName: 'Sundar Pichai', avatar: '', lastUpdate: '2小时前', isActive: false },
    { id: 5, username: 'tim_cook', displayName: 'Tim Cook', avatar: '', lastUpdate: '3小时前', isActive: true },
  ]);

  const [newAccount, setNewAccount] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('全部');

  const handleAddAccount = () => {
    if (!newAccount.trim()) return;
    
    // 这里将来会添加实际的账号添加逻辑
    const newId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
    setAccounts([...accounts, {
      id: newId,
      username: newAccount,
      displayName: newAccount,
      avatar: '',
      lastUpdate: '刚刚',
      isActive: true
    }]);
    setNewAccount('');
  };

  const handleToggleStatus = (id: number) => {
    setAccounts(accounts.map(account => 
      account.id === id ? {...account, isActive: !account.isActive} : account
    ));
  };

  const handleDeleteAccount = (id: number) => {
    setAccounts(accounts.filter(account => account.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0f1218] text-white">
      <DashboardHeader />

      {/* 主内容区 */}
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">监控账号管理</h2>
          <div className="flex space-x-4">
            <select 
              value={selectedGroup} 
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-[#1c2128] border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>全部</option>
              <option>科技</option>
              <option>金融</option>
              <option>媒体</option>
              <option>自定义</option>
            </select>
            <button className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              创建分组
            </button>
          </div>
        </div>

        {/* 账号列表 */}
        <div className="bg-[#1c2128] rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-12 bg-[#161b22] py-3 px-6 border-b border-gray-800 text-gray-400">
            <div className="col-span-1">状态</div>
            <div className="col-span-3">账号</div>
            <div className="col-span-2">分组</div>
            <div className="col-span-2">监控频率</div>
            <div className="col-span-2">上次更新</div>
            <div className="col-span-2 text-right">操作</div>
          </div>
          
          {accounts.map((account) => (
            <div key={account.id} className="grid grid-cols-12 py-4 px-6 border-b border-gray-800 items-center">
              <div className="col-span-1">
                <div className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </div>
              <div className="col-span-3 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                  {account.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{account.displayName}</p>
                  <p className="text-sm text-gray-400">@{account.username}</p>
                </div>
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 bg-[#0d1117] rounded text-xs">科技</span>
              </div>
              <div className="col-span-2">
                <select className="bg-[#0d1117] border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>1分钟</option>
                  <option>5分钟</option>
                  <option>15分钟</option>
                  <option>30分钟</option>
                  <option>1小时</option>
                </select>
              </div>
              <div className="col-span-2 text-gray-400">{account.lastUpdate}</div>
              <div className="col-span-2 flex justify-end space-x-3">
                <button 
                  onClick={() => handleToggleStatus(account.id)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  {account.isActive ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
                <button className="p-1 text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDeleteAccount(account.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 添加推特账号 */}
        <div className="mt-6 bg-[#1c2128] rounded-lg p-4 shadow-lg">
          <div className="flex items-center">
            <input
              type="text"
              value={newAccount}
              onChange={(e) => setNewAccount(e.target.value)}
              placeholder="添加推特账号..."
              className="flex-1 bg-[#0d1117] border border-gray-700 rounded-full py-3 px-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddAccount}
              className="ml-4 bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1c2128]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* 批量导入 */}
        <div className="mt-6 bg-[#1c2128] rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">批量导入账号</h3>
          <p className="text-gray-400 mb-4">您可以通过上传CSV文件或直接粘贴账号列表来批量导入推特账号。</p>
          <div className="flex space-x-4">
            <button className="bg-[#0d1117] border border-gray-700 text-white rounded-md px-4 py-2 hover:bg-[#161b22] focus:outline-none focus:ring-2 focus:ring-blue-500">
              上传CSV文件
            </button>
            <button className="bg-[#0d1117] border border-gray-700 text-white rounded-md px-4 py-2 hover:bg-[#161b22] focus:outline-none focus:ring-2 focus:ring-blue-500">
              粘贴账号列表
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
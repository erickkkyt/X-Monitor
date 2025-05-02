'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { type User } from '@supabase/supabase-js';

export default function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 默认激活控制台标签
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user in DashboardHeader:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 从URL路径确定当前标签
    const pathname = window.location.pathname;
    if (pathname.includes('/accounts')) {
      setActiveTab('accounts');
    } else if (pathname.includes('/notifications')) {
      setActiveTab('notifications');
    } else if (pathname.includes('/analytics')) {
      setActiveTab('analytics');
    } else {
      setActiveTab('dashboard');
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-[#161b22] py-4 px-6 flex items-center justify-between border-b border-gray-800 relative">
      <div className="flex items-center space-x-3">
        <Link href="/dashboard">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold cursor-pointer">
            X
          </div>
        </Link>
        <div>
          <h1 className="text-xl font-bold">X-Monitor</h1>
          <p className="text-sm text-gray-400">
            {activeTab === 'dashboard' && '控制台'}
            {activeTab === 'accounts' && '账号管理'}
            {activeTab === 'notifications' && '通知设置'}
            {activeTab === 'analytics' && '数据分析'}
          </p>
        </div>
      </div>
      {/* 绝对居中返回首页按钮 */}
      <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors text-sm font-medium z-10">
        返回首页
      </Link>
      <nav className="flex items-center space-x-6">
        <Link 
          href="/dashboard" 
          className={activeTab === 'dashboard' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-400 hover:text-white'}
        >
          控制台
        </Link>
        <Link 
          href="/dashboard/accounts" 
          className={activeTab === 'accounts' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-400 hover:text-white'}
        >
          账号管理
        </Link>
        <Link 
          href="/dashboard/notifications" 
          className={activeTab === 'notifications' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-400 hover:text-white'}
        >
          通知设置
        </Link>
        <Link 
          href="/dashboard/analytics" 
          className={activeTab === 'analytics' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-400 hover:text-white'}
        >
          数据分析
        </Link>
        
        {/* 用户信息 */}
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
        ) : user ? (
          <div className="relative group">
            <div className="flex items-center space-x-2 cursor-pointer">
              {/* 用户头像 */}
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
            
            {/* 下拉菜单 */}
            <div className="absolute right-0 mt-2 w-48 bg-[#1c2128] rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <div className="px-4 py-2 text-xs text-gray-400 border-b border-[#30363d]">
                {user.email}
              </div>
              <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#30363d]">
                控制台
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#30363d]"
              >
                退出登录
              </button>
            </div>
          </div>
        ) : (
          <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300">
            登录
          </Link>
        )}
      </nav>
    </header>
  );
}
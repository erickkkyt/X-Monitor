'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client'; // 导入浏览器客户端
import { type User } from '@supabase/supabase-js'; // 导入 Supabase User 类型

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient(); // 创建客户端实例

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user in Header:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // 监听认证状态变化，以便在登录/登出后更新 Header
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };

  }, [supabase]); // 依赖 supabase 实例

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange 会自动处理 setUser(null)
    // 可能需要 router.push('/')，但这通常在 AuthContext 或 Server Action 中处理
    setMobileMenuOpen(false); // 关闭移动菜单
  };

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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
              功能
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
              使用方法
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
              定价
            </Link>
            <Link href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors">
              常见问题
            </Link>
          </nav>

          {/* Call to Action Buttons / User Info */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-1.5 border border-blue-600 text-blue-600 font-bold rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-colors text-sm mr-24 ml-2 h-8 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              控制台
            </Link>
            {loading ? (
              <div className="animate-pulse h-8 w-20 bg-gray-200 rounded-full"></div> // 加载占位符
            ) : user ? (
              // 用户已登录
              <div className="relative group">
                 <div className="w-8 h-8 rounded-full bg-gray-700 cursor-pointer flex items-center justify-center text-white border-2 border-white shadow-md">
                   {user.email?.charAt(0).toUpperCase()}
                 </div>
                 <div className="absolute right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-1 w-56 hidden group-hover:block z-50">
                   <div className="px-4 py-2 text-xs text-gray-400 truncate border-b border-gray-700 font-mono tracking-wide">
                     {user.email}
                   </div>
                   <Link href="/dashboard" className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 hover:text-blue-400 transition-colors">
                     仪表盘
                    </Link>
                   <button
                     onClick={handleSignOut}
                     className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-600 hover:text-white rounded-b-xl transition-colors"
                   >
                     退出登录
                   </button>
                 </div>
               </div>
            ) : (
              // 用户未登录
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

          {/* Mobile Menu Button */}
           <div className="md:hidden">
             <button
               type="button"
               className="text-gray-500 hover:text-blue-600"
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             >
               {mobileMenuOpen ? (
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               ) : (
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                 </svg>
               )}
             </button>
           </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 py-3 space-y-1">
            <Link href="#features" className="block py-2 text-gray-600 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
              功能
            </Link>
            <Link href="#how-it-works" className="block py-2 text-gray-600 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
              使用方法
            </Link>
            <Link href="#pricing" className="block py-2 text-gray-600 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
              定价
            </Link>
            <Link href="#faq" className="block py-2 text-gray-600 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
              常见问题
            </Link>
            
            <div className="pt-4 flex space-x-4">
              {loading ? (
                 <div className="animate-pulse h-10 w-full bg-gray-200 rounded-lg"></div>
              ) : user ? (
                 <button
                     onClick={handleSignOut}
                     className="w-full text-center px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                 >
                     退出登录
                 </button>
              ) : (
                <>
                  <Link href="/login" className="w-1/2 text-center px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                    登录
                  </Link>
                  <Link href="/login" className="w-1/2 text-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => setMobileMenuOpen(false)}>
                    注册
                  </Link>
                 </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Re-define interfaces here or import from a shared types file
interface MonitoredAccount {
  id: string;
  user_id: string;
  username: string;
  twitter_id: string;
  display_name: string;
  profile_image_url: string | null;
  last_checked_at: string | null;
  last_tweet_id: string | null;
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  account?: MonitoredAccount;
  accounts?: MonitoredAccount[]; // Keep if list endpoint uses it
}

interface Notification {
  id: string;
  accountUsername: string;
  accountDisplayName?: string;
  profileImageUrl?: string | null;
  content: string;
  timestamp: Date;
  isImportant: boolean;
}

interface DashboardClientProps {
  initialAccounts: MonitoredAccount[];
  initialFetchError: string | null;
}

// 推文数据接口
interface TweetData {
  tweet_id: string;
  content: string;
  tweet_created_at?: string; // 接收来自后端的推文创建时间
  [key: string]: unknown; // 允许其他可能的字段
}

// Presence数据接口
interface PresenceData {
  key: string;
  newPresences?: unknown[];
  leftPresences?: unknown[];
}

// 新增为 presence sync 事件定义的接口
interface PresenceState {
  [key: string]: {
    [id: string]: Record<string, unknown>;
  }
}

// 获取今天的起始时间 (00:00:00)
const getStartOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

export default function DashboardClient({ initialAccounts, initialFetchError }: DashboardClientProps) {
  // Client-side state
  const [newAccount, setNewAccount] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [addAccountError, setAddAccountError] = useState<string | null>(null);
  const [addAccountSuccess, setAddAccountSuccess] = useState<string | null>(null);
  const [monitoredAccounts, setMonitoredAccounts] = useState<MonitoredAccount[]>(initialAccounts);
  const [accountsError, setAccountsError] = useState<string | null>(initialFetchError); // Use initial error from server
  const [allReceivedNotifications, setAllReceivedNotifications] = useState<Notification[]>([]); // 存储所有接收到的通知
  const [isLoading, setIsLoading] = useState(false); // 初始不加载，等 Realtime 连接后再加载
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const dailyClearTimerRef = useRef<NodeJS.Timeout | null>(null); // 用于存储每日清除定时器

  // --- 每日自动清除通知逻辑 ---
  useEffect(() => {
    const scheduleDailyClear = () => {
      // 清除旧的定时器（如果有）
      if (dailyClearTimerRef.current) {
        clearTimeout(dailyClearTimerRef.current);
      }

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // 设置为明天凌晨 0 点

      const timeUntilMidnight = tomorrow.getTime() - now.getTime();

      console.log(`定时器将在 ${timeUntilMidnight / 1000 / 60} 分钟后触发清空`);

      dailyClearTimerRef.current = setTimeout(() => {
        console.log('凌晨到达，清除昨日通知...');
        setAllReceivedNotifications([]); // 清空所有通知
        scheduleDailyClear(); // 重新安排下一次清空
      }, timeUntilMidnight);
    };

    scheduleDailyClear();

    // 组件卸载时清除定时器
    return () => {
      if (dailyClearTimerRef.current) {
        clearTimeout(dailyClearTimerRef.current);
        console.log('组件卸载，清除每日定时器');
      }
    };
  }, []); // 空依赖数组，仅在挂载和卸载时运行

  // --- Realtime 设置与通知处理 ---
  useEffect(() => {
    const isCleanedUp = { current: false };

    const setupRealtime = async () => {
      if (isCleanedUp.current) return;
      setIsLoading(true); // 开始加载状态

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('用户未登录，无法设置实时通知');
          setAccountsError('用户未登录，请重新登录'); // 提供用户反馈
          setIsLoading(false);
          return;
        }

        // 清理旧通道（如果存在且未关闭）
        if (channelRef.current && channelRef.current.state !== 'closed') {
          console.log('检测到旧通道，正在移除...');
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
          console.log('旧通道已移除。');
        }

        const channelName = `new-tweets-notifications:${user.id}`;
        console.log(`创建 Realtime 通道: ${channelName}`);
        const newChannel = supabase.channel(channelName, {
          config: { broadcast: { self: true }, presence: { key: user.id } }
        });
        channelRef.current = newChannel;

        newChannel.on('broadcast', { event: 'new_tweets' }, (message) => {
          if (isCleanedUp.current) return;
          console.log('收到新推文通知:', message);

          try {
            const { account_username, tweets } = message.payload;
            if (tweets && Array.isArray(tweets) && tweets.length > 0) {
              const newNotifications: Notification[] = tweets.map((tweet: TweetData) => ({
                id: tweet.tweet_id,
                accountUsername: account_username,
                // 尝试从当前监控列表中获取显示名和头像
                accountDisplayName: monitoredAccounts.find(a => a.username === account_username)?.display_name || account_username,
                profileImageUrl: monitoredAccounts.find(a => a.username === account_username)?.profile_image_url,
                content: tweet.content,
                // 优先使用推文的创建时间，否则使用当前时间
                timestamp: tweet.tweet_created_at ? new Date(tweet.tweet_created_at) : new Date(),
                isImportant: tweet.content?.includes('#') || tweet.content?.toLowerCase().includes('important')
              }));

              setAllReceivedNotifications(prevNotifications => {
                const combined = [...newNotifications, ...prevNotifications];
                // 去重，确保 id 唯一
                const uniqueNotifications = Array.from(new Map(combined.map(n => [n.id, n])).values());
                return uniqueNotifications; // 存储所有去重后的通知
              });
            }
          } catch (error) {
            console.error('处理广播消息时出错:', error);
          }
        });

        // 修改回调函数签名，接收完整 payload
        newChannel.on('system', {}, (payload) => { 
           if (isCleanedUp.current) return;
           // 从 payload 中访问 event
           const event = payload?.event; 
           console.log(`Realtime 系统事件: ${event}`);
        });
        
        // 修改 presence sync 事件处理，使用更具体的类型
        newChannel.on('presence', { event: 'sync' }, () => {
           if (isCleanedUp.current) return;
           console.log('Presence 同步');
           // const presenceState = channelRef.current?.presenceState(); // Access via ref
           // console.log('当前 Presence 状态:', presenceState);
        });
        
        newChannel.on('presence', { event: 'join' }, (data: PresenceData) => {
           if (isCleanedUp.current) return;
          console.log(`用户加入: ${data.key}`, data.newPresences);
        });
        newChannel.on('presence', { event: 'leave' }, (data: PresenceData) => {
           if (isCleanedUp.current) return;
          console.log(`用户离开: ${data.key}`, data.leftPresences);
        });
        
        // Subscribe only ONCE per channel instance
        newChannel.subscribe((status, err) => {
          // Prevent processing if cleanup happened
          if (isCleanedUp.current) return;

          console.log(`Realtime 订阅状态: ${status}`);
              if (status === 'SUBSCRIBED') {
            console.log('成功订阅 Realtime 通道');
            // Optionally track presence after successful subscription
            // channelRef.current?.track({ online_at: new Date().toISOString() });
                setIsLoading(false);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime 通道错误:', err);
                  setIsLoading(false);
            // Let Supabase client handle retries automatically
          } else if (status === 'TIMED_OUT') {
            console.warn('Realtime 订阅超时');
            setIsLoading(false);
            // Let Supabase client handle retries automatically
          } else if (status === 'CLOSED') {
            console.log('Realtime 通道已关闭');
            // Channel was closed, perhaps intentionally via cleanup or due to error.
            // If unexpected, investigate why.
          }
        });

      } catch (error) {
        console.error('设置 Realtime 通知失败:', error);
        setAccountsError('无法设置通知服务');
        setIsLoading(false);
      }
    };

    setupRealtime();

    // Cleanup function
    return () => {
      isCleanedUp.current = true; // Mark as cleaned up
      const currentChannel = channelRef.current; // Get channel from ref
      if (currentChannel) {
        console.log('清理 Realtime 订阅...');
        supabase.removeChannel(currentChannel)
          .then(() => console.log('通道已成功移除'))
          .catch(err => console.error('移除通道时出错:', err));
        channelRef.current = null; // Clear the ref
      }
    };
  }, [supabase, monitoredAccounts]);

  // --- 计算今日通知 ---
  const startOfToday = useMemo(() => getStartOfToday(), []);
  const todayNotifications = useMemo(() => {
    return allReceivedNotifications
      .filter(n => n.timestamp >= startOfToday)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // 按时间降序
  }, [allReceivedNotifications, startOfToday]);

  // --- 添加账号处理 ---
  const handleAddAccount = async () => {
    if (!newAccount.trim()) {
      setAddAccountError('请输入推特用户名。');
      return;
    }

    // --- 新增：检查监控账号数量限制 ---
    const MAX_ACCOUNTS_FREE_PLAN = 3;
    if (monitoredAccounts.length >= MAX_ACCOUNTS_FREE_PLAN) {
      setAddAccountError(`免费计划最多只能监控 ${MAX_ACCOUNTS_FREE_PLAN} 个账号。请升级套餐以监控更多账号。`);
      // 可选：未来可以在这里添加跳转到升级页面的链接或按钮
      setIsAddingAccount(false); // 确保重置加载状态
      return; // 阻止继续执行添加逻辑
    }
    // --- 检查结束 ---

    const usernameToAdd = newAccount.trim();
    console.log(`[Client] Attempting to add account: ${usernameToAdd}`);
    setIsAddingAccount(true);
    setAddAccountError(null);
    setAddAccountSuccess(null);

    try {
      // Use the correct API endpoint which should now use server-side auth
      const response = await fetch('/api/twitter/add-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameToAdd }),
      });

      console.log(`[Client] Received response status: ${response.status}`);
      let data: ApiResponse = { success: false, message: '响应格式错误或API调用失败' };
      try {
        data = await response.json();
        console.log('[Client] Received response data:', data);
      } catch (parseError) {
        console.error('[Client] Failed to parse JSON response:', parseError);
      }

      if (response.ok && data.success && data.account) {
        console.log(`[Client] Successfully added account: ${usernameToAdd}`);
        setAddAccountSuccess(data.message || `成功添加账号: ${usernameToAdd}`);
        setNewAccount('');
        // Update client-side list immediately
        setMonitoredAccounts(prevAccounts => [data.account!, ...prevAccounts]); // Add to the top
        setAccountsError(null); // Clear any previous fetch error
      } else {
        console.error(`[Client] Failed to add account: ${data.message || '未知后端错误'}`);
        setAddAccountError(data.message || `添加账号失败 (状态: ${response.status})`);
      }
    } catch (err: Error | unknown) {
      console.error('[Client] Network or other error adding account:', err);
      setAddAccountError(`网络或客户端错误: ${err instanceof Error ? err.message : '请检查连接或稍后再试'}`);
    } finally {
      setIsAddingAccount(false);
    }
  };

  // --- 时间格式化 ---
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} 年前`;
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} 个月前`;
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} 天前`;
     // 今天的时间显示具体时分
     if (date >= getStartOfToday()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
     }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} 小时前`;
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} 分钟前`;
    return `${Math.floor(seconds)} 秒前`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">仪表盘</h1>

      {/* 添加新监控账号表单 */}
      <div className="bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl font-semibold mb-4">添加新的监控账号</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newAccount}
            onChange={(e) => setNewAccount(e.target.value)}
            placeholder="输入推特用户名... (例如: elonmusk)"
            disabled={isAddingAccount}
            className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
          />
          <button
            onClick={handleAddAccount}
            disabled={isAddingAccount || !newAccount.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isAddingAccount ? '添加中...' : '添加'}
          </button>
        </div>
        {addAccountError && <p className="text-red-400 text-sm mt-2">{addAccountError}</p>}
        {addAccountSuccess && <p className="text-green-400 text-sm mt-2">{addAccountSuccess}</p>}
      </div>

      {/* 恢复并放置原始的提示信息框 */}
      <div className="mt-8 bg-[#0d1117] rounded-lg p-4 border border-gray-800 mb-6 sm:mb-8"> {/* 使用原始样式并添加下边距 */}
        <div className="flex items-center justify-between">
          <div className="flex items-start flex-1">
            <div className="flex-shrink-0 mt-1">
              {/* Original SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-300">提示信息</h3>
              <div className="mt-2 text-sm text-gray-300">
                <p>为了确保您能及时获取监控账号的最新动态，建议绑定您的手机号码。系统将在监控账号发布新内容时，通过电话通知您第一时间了解最新信息。</p>
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            {/* Original Link Button */}
            <a href="/dashboard/notifications" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
              前往通知设置
            </a>
          </div>
        </div>
      </div>

      {/* 监控账号和今日通知网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* 监控账号列表 */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4">监控账号 ({monitoredAccounts.length})</h2>
          {accountsError && <p className="text-red-400 mb-4">加载监控账号失败: {accountsError}</p>}
          {isLoading && <p>加载中...</p>} {/* Display loading state */}
          {!isLoading && !accountsError && monitoredAccounts.length === 0 && (
            <p className="text-gray-400">暂无监控账号，请在上方添加。</p>
          )}
          {!isLoading && monitoredAccounts.length > 0 && (
            <ul className="space-y-3">
              {monitoredAccounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
                  <div className="flex items-center space-x-3">
                    <Image
                      src={account.profile_image_url || '/default-avatar.png'} // Provide a default avatar
                      alt={`${account.display_name} avatar`}
                      width={40}
                      height={40}
                      className="rounded-full"
                      unoptimized // If profile URLs are external and not optimized by Next/Image
                    />
                    <div>
                      <p className="font-medium text-sm sm:text-base">{account.display_name}</p>
                      <p className="text-xs text-gray-400">@{account.username}</p>
                    </div>
                  </div>
                  {/* Optional: Add remove button or other actions here */}
                  {/* <button className="text-red-400 hover:text-red-300 text-xs">移除</button> */}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 今日通知 */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4">今日通知</h2>
          {todayNotifications.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                 <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <p className="text-sm">今日暂无通知</p>
              <p className="text-xs mt-1">有新通知时将在此处显示</p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2"> {/* Add scroll for long lists */}
              {todayNotifications.map((notification) => (
                <li key={notification.id} className={`border-l-4 ${notification.isImportant ? 'border-red-500' : 'border-blue-500'} bg-gray-700 p-3 rounded-r-md`}>
                   <div className="flex items-start space-x-3">
                      <Image
                        src={notification.profileImageUrl || '/default-avatar.png'}
                        alt={`${notification.accountDisplayName} avatar`}
                        width={32} // Smaller avatar for notifications
                        height={32}
                        className="rounded-full mt-1"
                        unoptimized
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                           <span className="font-medium text-sm">{notification.accountDisplayName || notification.accountUsername}</span>
                          <span className="text-xs text-gray-400">{formatTimeAgo(notification.timestamp)}</span>
                         </div>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{notification.content}</p>
                      </div>
                    </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
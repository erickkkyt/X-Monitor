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
    [id: string]: Record<string, any>;
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

        newChannel.on('system', ({ event }) => {
           if (isCleanedUp.current) return;
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
        newChannel.subscribe((status, err, _channel) => {
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

  // --- 计算用于展示的通知 ---
  const latestThreeTodayNotifications = useMemo(() => {
    const startOfToday = getStartOfToday();
    return allReceivedNotifications
      .filter(notification => notification.timestamp >= startOfToday) // 1. 筛选今天
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // 2. 按时间倒序
      .slice(0, 3); // 3. 取最新的 3 条
  }, [allReceivedNotifications]); // 当所有通知列表变化时重新计算

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

  // Helper function to format date/time
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
    <div className="min-h-screen bg-[#010409] text-gray-300 p-4 sm:p-6 lg:p-8">
      {/* 添加推特账号 Section */}
      <div className="mb-8 p-6 bg-[#0d1117] rounded-lg shadow-md border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">添加新的监控账号</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            value={newAccount}
            onChange={(e) => setNewAccount(e.target.value)}
            placeholder="输入推特用户名... (例如: elonmusk)"
            className="flex-grow px-4 py-2 bg-[#161b22] border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isAddingAccount}
          />
          <button
            onClick={handleAddAccount}
            disabled={isAddingAccount || !newAccount.trim()}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#010409] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAddingAccount ? '添加中...' : '添加'}
          </button>
        </div>
        {addAccountError && <p className="mt-3 text-sm text-red-500">{addAccountError}</p>}
        {addAccountSuccess && <p className="mt-3 text-sm text-green-500">{addAccountSuccess}</p>}
      </div>

      {/* 分为两列的布局：监控账号列表和今日通知 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 监控账号列表 Section - 宽度减半 */}
        <div className="bg-[#0d1117] rounded-lg shadow-md p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-5">监控账号 ({monitoredAccounts.length})</h2>
          {accountsError && <p className="text-red-500 mb-4">{accountsError}</p>}

          {monitoredAccounts.length === 0 && !accountsError && (
            <p className="text-gray-500 italic">暂无监控账号，请在上方添加。</p>
          )}

          {monitoredAccounts.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2"> {/* 添加滚动 */}
              {monitoredAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-[#161b22] rounded-md space-x-3 hover:bg-[#22272e] transition-colors duration-150">
                  <div className="flex items-center space-x-3 flex-shrink min-w-0"> {/* Added min-w-0 for truncation */}
                    {account.profile_image_url ? (
                      <Image
                        src={account.profile_image_url}
                        alt={`${account.username} profile picture`}
                        width={40} // Slightly larger image
                        height={40}
                        className="rounded-full flex-shrink-0" // Prevent image shrinking
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {account.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0"> {/* Added min-w-0 for truncation */}
                      <p className="font-medium text-white truncate">{account.display_name}</p> {/* Added truncate */}
                      <p className="text-xs text-gray-400 truncate">@{account.username}</p> {/* Added truncate */}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="text-xs text-gray-400">添加于: {new Date(account.created_at).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 今日通知 Section - 与监控账号列表宽度一致 */}
        <div className="bg-[#0d1117] rounded-lg shadow-md p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-white">今日通知</h2>
          </div>
          
          {/* 加载状态 */}
          {isLoading && (
             <div className="flex justify-center items-center h-40">
               <p className="text-gray-500 italic">正在加载通知服务...</p>
             </div>
           )}
          
          {/* 无通知状态 */}
          {!isLoading && accountsError && !accountsError.includes('无法设置通知服务') && !accountsError.includes('无法连接通知服务') && (
             <div className="flex justify-center items-center h-40">
               <p className="text-red-500 italic">{accountsError}</p>
             </div>
           )}
          
          {!isLoading && latestThreeTodayNotifications.length === 0 && !accountsError && (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 h-40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p>今日暂无通知</p>
              <p className="text-xs mt-1">有新通知时将在此处显示</p>
            </div>
          )}
          
          {/* 通知列表 */}
          {!isLoading && latestThreeTodayNotifications.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2"> {/* 添加滚动 */}
              {latestThreeTodayNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start p-4 bg-[#161b22] rounded-md space-x-3 shadow-sm hover:bg-[#22272e] transition-colors duration-150">
                  {notification.profileImageUrl ? (
                    <Image
                      src={notification.profileImageUrl}
                      alt={`${notification.accountUsername} profile picture`}
                      width={32}
                      height={32}
                      className="rounded-full mt-1 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium mt-1 flex-shrink-0">
                      {notification.accountUsername.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                       <div className="flex items-baseline space-x-2">
                         <span className="font-semibold text-white text-sm truncate">{notification.accountDisplayName || notification.accountUsername}</span>
                         <span className="text-xs text-gray-400 truncate hidden sm:inline">@{notification.accountUsername}</span>
                       </div>
                       <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatTimeAgo(notification.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{notification.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
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

  const todayStart = useMemo(() => getStartOfToday(), []); // 仅在挂载时计算一次

  // 筛选出今天的通知
  const todayNotifications = useMemo(() => {
    return allReceivedNotifications
      .filter(n => n.timestamp >= todayStart)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // 按时间降序排列
  }, [allReceivedNotifications, todayStart]);

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

  // 处理删除账号
  const handleDeleteAccount = async (accountId: string) => {
    // 可选：添加确认对话框
    if (!confirm('确定要删除这个监控账号吗？相关的通知历史不会被删除。')) {
      return;
    }

    // TODO: 添加删除时的加载状态
    console.log(`尝试删除账号: ${accountId}`);

    try {
      const response = await fetch('/api/monitored-accounts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || '删除失败，请重试。');
      }

      console.log('账号删除成功');
      // 从前端状态中移除账号
      setMonitoredAccounts(prev => prev.filter(acc => acc.id !== accountId));
      // 可选：显示成功消息

    } catch (error: unknown) {
      console.error('删除账号时出错:', error);
      // 显示错误消息给用户
      alert('删除账号失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 添加新账号部分 */}
      <div className="bg-[#1a1f26] p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">添加新的监控账号</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newAccount}
            onChange={(e) => setNewAccount(e.target.value.trim())}
            placeholder="输入推特用户名... (例如: elonmusk)"
            className="flex-grow bg-[#2b3139] border border-[#444c56] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAddingAccount}
          />
          <button
            onClick={handleAddAccount}
            disabled={isAddingAccount || !newAccount}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-semibold px-6 py-2 rounded-md transition duration-150 ease-in-out"
          >
            {isAddingAccount ? '添加中...' : '添加'}
          </button>
        </div>
        {addAccountError && <p className="text-red-400 mt-3 text-sm">{addAccountError}</p>}
        {addAccountSuccess && <p className="text-green-400 mt-3 text-sm">{addAccountSuccess}</p>}
      </div>

      {/* *** 提示信息框的新位置 *** */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 rounded-md shadow flex items-center justify-between" role="alert">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-yellow-700" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
          <p>
            <span className="font-medium">提示信息：</span> 为了确保您能及时获取监控账号的最新动态，建议绑定您的手机号码。系统将在监控账号发布新内容时，通过电话语音通知您第一时间了解最新信息。
          </p>
        </div>
         <button
            // TODO: Implement navigation to settings page
            onClick={() => alert('跳转到通知设置页面（待实现）')}
            className="ml-4 flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-sm transition duration-150 ease-in-out"
         >
            前往通知设置
          </button>
      </div>

      {/* 2. 监控账号和今日通知卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 监控账号卡片 */}
        <div className="bg-[#1a1f26] p-6 rounded-lg shadow-md min-h-[200px]"> {/* 添加最小高度 */}
          <h2 className="text-xl font-semibold mb-4">监控账号 ({monitoredAccounts.length})</h2>
          {accountsError && <p className="text-red-400 text-sm">{accountsError}</p>}
          {monitoredAccounts.length > 0 ? (
            <ul className="space-y-3">
              {monitoredAccounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between bg-[#2b3139] p-3 rounded-md">
                  <div className="flex items-center space-x-3">
                    {account.profile_image_url ? (
                       <Image
                        src={account.profile_image_url}
                        alt={`${account.display_name}'s profile picture`}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                     ) : (
                       <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
                         {account.display_name?.[0] || account.username[0]}
                       </div>
                     )
                    }
                    <div>
                      <p className="font-medium text-white">{account.display_name}</p>
                      <p className="text-sm text-gray-400">@{account.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    // TODO: Add loading state for delete button
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
          ) : (
             !accountsError && <p className="text-gray-400">暂无监控账号，请在上方添加。</p>
          )}
        </div>

        {/* 今日通知卡片 */}
        <div className="bg-[#1a1f26] p-6 rounded-lg shadow-md min-h-[200px]"> {/* 添加最小高度 */}
          <h2 className="text-xl font-semibold mb-4">今日通知</h2>
           {isLoading ? (
            <div className="flex justify-center items-center h-full text-gray-400">加载通知中...</div>
          ) : todayNotifications.length > 0 ? (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2"> {/* 添加最大高度和滚动 */}
              {todayNotifications.map((notification) => (
                <li key={notification.id} className="bg-[#2b3139] p-3 rounded-md">
                  <div className="flex items-start space-x-3">
                     {notification.profileImageUrl ? (
                       <Image
                        src={notification.profileImageUrl}
                        alt={`${notification.accountDisplayName}'s profile picture`}
                        width={32}
                        height={32}
                        className="rounded-full mt-1"
                      />
                     ) : (
                       <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold flex-shrink-0 mt-1">
                         {notification.accountDisplayName?.[0] || notification.accountUsername[0]}
                       </div>
                     )
                     }
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium text-white text-sm">{notification.accountDisplayName || notification.accountUsername}</p>
                        <p className="text-xs text-gray-400">{formatTimeAgo(notification.timestamp)}</p>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{notification.content}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <p>今日暂无通知</p>
                <p className="text-xs mt-1">有新通知时将在此处显示</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

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
  [key: string]: unknown; // 允许其他可能的字段
}

// Presence数据接口
interface PresenceData {
  key: string;
  newPresences?: unknown[];
  leftPresences?: unknown[];
}

// 新增：本地存储通知的键名
const NOTIFICATIONS_STORAGE_KEY = 'twitter_monitor_notifications';

export default function DashboardClient({ initialAccounts, initialFetchError }: DashboardClientProps) {
  // Client-side state
  const [newAccount, setNewAccount] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [addAccountError, setAddAccountError] = useState<string | null>(null);
  const [addAccountSuccess, setAddAccountSuccess] = useState<string | null>(null);
  const [monitoredAccounts, setMonitoredAccounts] = useState<MonitoredAccount[]>(initialAccounts);
  const [accountsError, setAccountsError] = useState<string | null>(initialFetchError); // Use initial error from server
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // 从localStorage加载通知
  useEffect(() => {
    // 只在客户端运行
    if (typeof window !== 'undefined') {
      try {
        const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedNotifications) {
          // 解析存储的通知并修复日期对象（JSON.parse不会自动将字符串转换为Date）
          const parsedNotifications = JSON.parse(storedNotifications);
          const notificationsWithDateObjects = parsedNotifications.map((notification: Notification & {timestamp: string}) => ({
            ...notification,
            timestamp: new Date(notification.timestamp)
          }));
          setNotifications(notificationsWithDateObjects);
        }
      } catch (error) {
        console.error('从本地存储加载通知失败:', error);
        // 如果加载失败，不影响使用，继续使用空数组
      }
    }
  }, []);

  // 当通知更新时保存到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && notifications.length > 0) {
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
      } catch (error) {
        console.error('保存通知到本地存储失败:', error);
      }
    }
  }, [notifications]);

  useEffect(() => {
    // 获取当前登录用户
    const fetchUserAndSetupRealtime = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('用户未登录，无法设置实时通知');
          setIsLoading(false);
          return;
        }

        // 设置Supabase Realtime订阅
        const channelName = `new-tweets-notifications:${user.id}`;
        console.log(`订阅Realtime通道: ${channelName}`);
        
        // 增强的通道配置
        const channel = supabase.channel(channelName, {
          config: {
            broadcast: { self: true }, // 允许接收自己发送的广播
            presence: { key: user.id }
          }
        })
        .on('broadcast', { event: 'new_tweets' }, (payload) => {
          console.log('收到新推文通知:', payload);
          
          try {
            // 处理接收到的通知
            const { account_username, tweets } = payload.payload;
            
            if (tweets && tweets.length > 0) {
              // 为每条推文创建一个通知
              const newNotifications = tweets.map((tweet: TweetData) => ({
                id: `${tweet.tweet_id}`,
                accountUsername: account_username,
                accountDisplayName: monitoredAccounts.find(a => a.username === account_username)?.display_name || account_username,
                profileImageUrl: monitoredAccounts.find(a => a.username === account_username)?.profile_image_url,
                content: tweet.content,
                timestamp: new Date(),
                isImportant: tweet.content.includes('#') || tweet.content.toLowerCase().includes('important')
              }));
              
              // 合并通知并保存，确保不重复（检查推文ID）
              setNotifications(prevNotifications => {
                // 过滤掉已存在的通知（避免重复）
                const existingIds = prevNotifications.map(n => n.id);
                const uniqueNewNotifications = newNotifications.filter(
                  n => !existingIds.includes(n.id)
                );
                
                // 添加日志以跟踪通知状态
                console.log(`添加了 ${uniqueNewNotifications.length} 条新通知，现有 ${prevNotifications.length} 条通知`);
                
                return [...uniqueNewNotifications, ...prevNotifications];
              });
            }
          } catch (error) {
            // 捕获并记录处理通知时的错误
            console.error('处理通知时出错:', error);
          }
        })
        // 增加更多事件处理
        .on('system', ({ event }) => {
          console.log(`Realtime系统事件: ${event}`);
        })
        .on('presence', { event: 'sync' }, () => {
          console.log('Presence同步');
        })
        .on('presence', { event: 'join' }, (data: PresenceData) => {
          console.log(`用户加入: ${data.key}`, data.newPresences);
        })
        .on('presence', { event: 'leave' }, (data: PresenceData) => {
          console.log(`用户离开: ${data.key}`, data.leftPresences);
        });
        
        // 使用更健壮的订阅方式
        let subscribeAttempts = 0;
        const maxSubscribeAttempts = 3;
        
        const attemptSubscribe = () => {
          try {
            console.log(`尝试订阅 (${subscribeAttempts + 1}/${maxSubscribeAttempts + 1})`);
            channel.subscribe((status) => {
              console.log(`Realtime订阅状态: ${status}`);
              
              if (status === 'SUBSCRIBED') {
                console.log('成功订阅Realtime通道');
                setIsLoading(false);
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error(`Realtime通道错误: ${status}`);
                
                if (subscribeAttempts < maxSubscribeAttempts) {
                  subscribeAttempts++;
                  const retryDelay = 2000 * subscribeAttempts;
                  console.log(`将在 ${retryDelay}ms 后重试订阅 (${subscribeAttempts}/${maxSubscribeAttempts})`);
                  
                  setTimeout(() => {
                    try {
                      supabase.removeChannel(channel);
                    } catch (error) {
                      console.error('移除通道失败:', error);
                    }
                    attemptSubscribe();
                  }, retryDelay);
                } else {
                  console.error(`达到最大重试次数 (${maxSubscribeAttempts})，不再重试`);
                  setIsLoading(false);
                }
              }
            });
          } catch (error) {
            console.error('订阅通道时出错:', error);
            setIsLoading(false);
          }
        };
        
        // 开始订阅尝试
        attemptSubscribe();
        
        // 清理函数：组件卸载时取消订阅
        return () => {
          try {
            console.log('清理Realtime订阅...');
            supabase.removeChannel(channel);
          } catch (error) {
            console.error('移除通道时出错:', error);
          }
        };
      } catch (error) {
        console.error('设置Realtime通知失败:', error);
        setIsLoading(false);
      }
    };

    fetchUserAndSetupRealtime();
  }, [supabase, monitoredAccounts]);

  const handleAddAccount = async () => {
    if (!newAccount.trim()) {
      setAddAccountError('请输入推特用户名。');
      return;
    }

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
  const formatTimeAgo = (isoString: string | null): string => {
    if (!isoString) return '从未';
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' 年前';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' 月前';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' 天前';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' 小时前';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' 分钟前';
    return Math.floor(seconds) + ' 秒前';
  };

  // 清除所有通知的函数
  const clearAllNotifications = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      setNotifications([]);
    }
  };

  // 移除筛选通知的逻辑
  const filteredNotifications = notifications;

  return (
    <>
      {/* 添加推特账号 Section */}
      <div className="mb-6 bg-[#1c2128] rounded-lg p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">添加新的监控账号</h2>
        {addAccountSuccess && <div className="mb-3 p-2 text-sm text-green-400 bg-green-900/50 border border-green-700 rounded-md">{addAccountSuccess}</div>}
        {addAccountError && <div className="mb-3 p-2 text-sm text-red-400 bg-red-900/50 border border-red-700 rounded-md">{addAccountError}</div>}
        <div className="flex items-center">
          <input
            type="text"
            value={newAccount}
            onChange={(e) => {
              setNewAccount(e.target.value);
              if (addAccountError) setAddAccountError(null);
              if (addAccountSuccess) setAddAccountSuccess(null);
            }}
            placeholder="输入推特用户名... (例如: elonmusk)"
            className="flex-1 bg-[#0d1117] border border-gray-700 rounded-l-md py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            disabled={isAddingAccount}
          />
          <button
            onClick={handleAddAccount}
            className="bg-blue-600 text-white rounded-r-md px-5 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1c2128] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[42px]" // Match input height
            disabled={isAddingAccount}
          >
            {isAddingAccount ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              '添加'
            )}
          </button>
        </div>
      </div>

      {/* 分为两列的布局：监控账号列表和今日通知 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 监控账号列表 Section - 宽度减半 */}
        <div className="bg-[#1c2128] rounded-lg p-6 shadow-lg lg:w-1/2">
          <h2 className="text-xl font-semibold mb-4">监控账号 ({monitoredAccounts.length})</h2>
          {accountsError && <div className="mb-3 p-2 text-sm text-red-400 bg-red-900/50 border border-red-700 rounded-md">错误: {accountsError}</div>}

          {monitoredAccounts.length === 0 && !accountsError && (
            <p className="text-center text-gray-500">您还没有添加任何监控账号。</p>
          )}

          {monitoredAccounts.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2"> {/* Added max-height and scroll */}
              {monitoredAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-[#0d1117] rounded-md space-x-3 hover:bg-[#22272e] transition-colors duration-150">
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
        <div className="bg-[#1c2128] rounded-lg p-6 shadow-lg lg:w-1/2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">今日通知</h2>
            {notifications.length > 0 && (
              <button 
                onClick={clearAllNotifications}
                className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/30"
              >
                清除全部
              </button>
            )}
          </div>
          
          {/* 加载状态 */}
          {isLoading && notifications.length === 0 && (
            <div className="bg-[#0d1117] rounded-md p-8 text-center">
              <svg className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-400">正在加载通知...</p>
            </div>
          )}
          
          {/* 无通知状态 */}
          {!isLoading && filteredNotifications.length === 0 && (
            <div className="bg-[#0d1117] rounded-md p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-400">今日暂无通知</p>
              <p className="text-xs text-gray-500 mt-2">有新通知时将在此处显示</p>
            </div>
          )}
          
          {/* 通知列表 */}
          {filteredNotifications.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 bg-[#0d1117] rounded-md border-l-4 ${notification.isImportant ? 'border-yellow-500' : 'border-blue-500'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {notification.profileImageUrl ? (
                        <Image
                          src={notification.profileImageUrl}
                          alt="Profile picture"
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium">
                          {notification.accountUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-white">{notification.accountDisplayName || notification.accountUsername}</span>
                      <span className="text-xs text-gray-400">@{notification.accountUsername}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatTimeAgo(notification.timestamp.toISOString())}</span>
                  </div>
                  <p className="text-sm text-gray-300">{notification.content}</p>
                  <div className="mt-2 text-xs text-blue-400 hover:underline cursor-pointer">查看详情</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
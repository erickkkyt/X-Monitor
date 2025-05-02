'use client';

import { useState } from 'react';
import Image from 'next/image';

// Define the interface for account data (should match the one in page.tsx or be imported)
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
  // Add other potential fields if needed for display/logic
  isActive?: boolean; // Assuming this might exist or be added later
  check_frequency?: number; 
  group?: string;
}

interface AccountsListClientProps {
  initialAccounts: MonitoredAccount[];
}

export default function AccountsListClient({ initialAccounts }: AccountsListClientProps) {
  const [accounts, setAccounts] = useState<MonitoredAccount[]>(initialAccounts);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // --- State for Custom Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; username: string } | null>(null);
  // -----------------------------

  // Function to open the confirmation modal
  const openDeleteModal = (id: string, username: string) => {
    setAccountToDelete({ id, username });
    setIsModalOpen(true);
    setError(null); // Clear previous errors when opening modal
  };

  // Function to close the confirmation modal
  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setAccountToDelete(null);
  };

  // Renamed function: Performs the actual deletion after confirmation
  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    const { id } = accountToDelete;

    // Close modal immediately
    closeDeleteModal(); 

    if (deletingId) return; // Prevent multiple deletions at once
    setDeletingId(id);
    setError(null);

    try {
      console.log(`[Client] Attempting to delete account ID: ${id}`);
      
      const response = await fetch('/api/twitter/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: id }),
      });
      
      if (!response.ok) {
        let errorMsg = `删除失败 (状态: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Ignore */ }
        throw new Error(errorMsg);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '后端删除操作失败');
      }

      setAccounts(prevAccounts => prevAccounts.filter(account => account.id !== id));
      console.log(`[Client] Successfully removed account ID: ${id} from local state.`);

    } catch (err: any) {
      console.error('[Client] Error deleting account:', err);
      setError(err.message || '删除账号时出错');
    } finally {
      setDeletingId(null);
    }
  };

  // Placeholder for toggling status (if needed)
  const handleToggleStatus = (id: string) => {
    console.log(`Toggle status for account ${id}`);
    // TODO: Implement status toggling logic (API call + state update)
    // setAccounts(accounts.map(account =>
    //   account.id === id ? {...account, isActive: !account.isActive} : account
    // ));
  };

  return (
    <>
      <div className="bg-[#1c2128] rounded-lg shadow-lg overflow-hidden">
        {error && (
            <div className="m-4 p-3 text-sm text-red-400 bg-red-900/50 border border-red-700 rounded-md">
              删除时出错: {error}
            </div>
          )}
        <div className="grid grid-cols-12 bg-[#161b22] py-3 px-6 border-b border-gray-800 text-gray-400 text-sm font-semibold">
          <div className="col-span-4">账号</div>
          <div className="col-span-3">Twitter ID</div>
          <div className="col-span-3">添加时间</div>
          <div className="col-span-2 text-right">操作</div>
        </div>
        {accounts.map((account) => (
          <div key={account.id} className="grid grid-cols-12 py-4 px-6 border-b border-gray-800 items-center text-base">
            <div className="col-span-4 flex items-center space-x-3">
              {account.profile_image_url ? (
                <Image
                  src={account.profile_image_url}
                  alt={`${account.username} profile picture`}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {account.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-white truncate">{account.display_name}</p>
                <p className="text-sm text-gray-400 truncate">@{account.username}</p>
              </div>
            </div>
            <div className="col-span-3 text-gray-300">{account.twitter_id}</div>
            <div className="col-span-3 text-gray-400">{new Date(account.created_at).toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            <div className="col-span-2 flex justify-end space-x-3">
              <button 
                onClick={() => openDeleteModal(account.id, account.username)}
                className={`p-1 text-gray-400 hover:text-red-500 ${deletingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!!deletingId}
                title="删除监控"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
            <div className="p-6 text-center text-gray-500">您还没有添加任何监控账号。</div>
        )}
      </div>

      {isModalOpen && accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-[#1c2128] rounded-lg shadow-xl p-6 border border-gray-700 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">确认删除</h3>
            <p className="text-gray-300 mb-6">
              您确定要删除对 <strong className="text-white">@{accountToDelete.username}</strong> 的监控吗？<br/>
              <span className="text-sm text-gray-400">这将同时删除所有相关的历史推文记录。</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#1c2128]"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={!!deletingId}
                className={`px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1c2128] ${deletingId ? 'opacity-50 cursor-wait' : ''}`}
              >
                {deletingId ? (
                  <svg className="animate-spin h-5 w-5 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
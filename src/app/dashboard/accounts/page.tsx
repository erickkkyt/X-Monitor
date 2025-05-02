import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // Use server client
import DashboardHeader from '@/components/DashboardHeader';
import AccountsListClient from '@/components/AccountsListClient'; // Import the new client component

// Define the interface for account data (can be shared)
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
  // Add other fields displayed in the table if necessary
  // e.g., isActive, check_frequency, group
}

export default async function AccountsPage() {
  const supabase = createClient();

  // Get user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
    
  // Redirect if not logged in
  if (authError || !user) {
    redirect('/login?message=请先登录以访问账号管理');
  }

  // Fetch monitored accounts for the user
  let accounts: MonitoredAccount[] = [];
  let fetchError: string | null = null;
  try {
    const { data, error } = await supabase
      .from('monitored_accounts')
      .select('*') // Select all columns needed for display
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    accounts = data || [];
  } catch (error: unknown) {
    console.error('Error fetching monitored accounts for accounts page:', error);
    fetchError = '无法加载监控账号列表: ' + (error instanceof Error ? error.message : '未知错误');
  }

  return (
    <div className="min-h-screen bg-[#0f1218] text-white">
      <DashboardHeader />

      {/* 主内容区 */}
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">监控账号管理</h2>
          {/* Actions like grouping might be added to AccountsListClient later */}
        </div>

        {/* Display fetch error if any */}
        {fetchError && (
          <div className="mb-3 p-3 text-sm text-red-400 bg-red-900/50 border border-red-700 rounded-md">
            错误: {fetchError}
          </div>
        )}

        {/* Render the client component, passing initial accounts */}
        {!fetchError && <AccountsListClient initialAccounts={accounts} />}
        
        {/* Remove the placeholder table rendering from here */}

        {/* Add account and Bulk Import sections are removed for now */}

      </main>
    </div>
  );
}
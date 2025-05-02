import { redirect } from 'next/navigation';
// Removed unused Link import: import Link from 'next/link'; 
// Removed useState, useEffect, useAuth, useRouter

import { createClient } from '@/utils/supabase/server'; // Import server client
import DashboardHeader from '@/components/DashboardHeader'; // 使用新的DashboardHeader组件
import DashboardClient from '@/components/DashboardClient'; // Import the new client component

// Define interfaces (can stay here or move)
interface MonitoredAccount {
  id: string;
  user_id: string; // Ensure this matches your table
  username: string;
  twitter_id: string;
  display_name: string;
  profile_image_url: string | null;
  last_checked_at: string | null;
  last_tweet_id: string | null; // Added
  created_at: string;
}

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError, // Capture auth error
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated or if there was an error getting user
  if (authError || !user) {
    console.error('Auth Error or No User, redirecting to login:', authError);
    redirect('/login?message=请先登录以访问控制台'); // Add a message
  }

  // Fetch monitored accounts server-side for the logged-in user
  let accounts: MonitoredAccount[] = [];
  let fetchError: string | null = null;

  try {
    const { data, error } = await supabase
      .from('monitored_accounts')
      .select('*')
      .eq('user_id', user.id) // Filter by logged-in user
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    accounts = data || [];
  } catch (error: unknown) {
    console.error('Error fetching monitored accounts:', error);
    // Check if error has a message property before accessing it
    fetchError = '无法加载监控账号列表: ' + (error instanceof Error ? error.message : '未知错误');
    // Decide how to handle this - maybe show an error message in the UI
    // For now, we'll pass the error state down
  }

  // Removed client-side state and effects

  return (
    <div className="min-h-screen bg-[#0f1218] text-white">
      {/* Header component likely needs to be a client component to handle logout etc. */}
      {/* Ensure Header component is adapted or created */}
      <DashboardHeader /> 

      <main className="p-6">
        {/* Render the client component, passing initial data */}
        <DashboardClient initialAccounts={accounts} initialFetchError={fetchError} />
      </main>
    </div>
  );
}
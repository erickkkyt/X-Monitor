import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { AuthProvider } from "@/contexts/AuthContext"; // 移除旧的 AuthProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Twitter Monitor - AI驱动的推特动态监控系统",
  description: "实时监控重要推特账号，智能过滤内容，多渠道通知，让您不错过任何重要动态。",
};

export default async function RootLayout({ // 可以是 async 如果需要在这里获取用户
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 可选：在这里使用服务器端 client 获取用户信息，并传递给子组件
  // const supabase = createClient(); // 假设 createClient 来自 server.ts
  // const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="zh">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 不再需要 AuthProvider 包裹 */} 
        {children}
      </body>
    </html>
  );
}

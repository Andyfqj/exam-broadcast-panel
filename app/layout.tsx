import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "考试广播控制面板",
  description: "一个基于 Next.js 的考试广播控制面板",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}

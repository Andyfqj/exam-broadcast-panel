import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window.Proxy === 'undefined' || 
                      typeof window.IntersectionObserver === 'undefined') {
                    throw new Error('Unsupported browser');
                  }
                  // Check for arrow functions
                  eval('var f = () => {};');
                } catch (e) {
                  window.location.href = 'https://old.gb.andyfeng.eu.org/';
                }
              })();
            `,
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

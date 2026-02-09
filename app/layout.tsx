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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var userAgent = navigator.userAgent;
                var isAndroid6 = userAgent.indexOf('Android 6.') > -1;
                var isLegacyBrowser = !window.Proxy || !window.IntersectionObserver;
                
                if (isAndroid6 || isLegacyBrowser) {
                  try {
                    if (window.stop) {
                      window.stop();
                    }
                  } catch (e) {}
                  window.location.href = 'https://old.gb.andyfeng.eu.org/';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

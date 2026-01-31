"use client"

import { useState, useEffect } from "react"
import ExamBroadcastPanel from "./ExamBroadcastPanel"; // 假设您将主面板代码移至此文件
import LegacyPanel from "./legacy-panel";

export default function Page() {
  const [isOldWebKit, setIsOldWebKit] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/.test(userAgent);
    const webKitVersionMatch = userAgent.match(/AppleWebKit\/(\d+)/);

    if (isAndroid && webKitVersionMatch) {
      const version = parseInt(webKitVersionMatch[1], 10);
      if (version < 537) { // 您可以根据需要调整此阈值
        setIsOldWebKit(true);
      }
    }
  }, []);

  if (!isClient) {
    return null; // 或者显示一个加载指示器
  }

  // 为了代码清晰，建议将原 page.tsx 的内容移动到一个新组件中，例如 ExamBroadcastPanel.tsx
  // 然后在这里根据 isOldWebKit 的值来决定渲染哪个组件
  return isOldWebKit ? <LegacyPanel /> : <ExamBroadcastPanel />;
}

// 您需要创建一个 ExamBroadcastPanel.tsx 文件，并将原 page.tsx 的主要组件代码移入其中。

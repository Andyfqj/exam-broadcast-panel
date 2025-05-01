# 考试广播控制面板

一个基于 Next.js 的考试广播控制面板，用于管理和播放考试相关的音频广播。

## 功能特点

- 📅 考试时间管理
- 🔊 音频广播控制
- 🎵 试音功能
- 💾 离线模式支持
- 📱 响应式设计
- 🔄 自动播放功能

## 技术栈

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- IndexedDB

## 安装

1. 克隆仓库
```bash
git clone [你的仓库地址]
cd exam-broadcast-panel
```

2. 安装依赖
```bash
pnpm install
```

3. 运行开发服务器
```bash
pnpm dev
```

## 使用说明

1. 准备音频文件
将以下音频文件放在 `public` 目录下：
- 15min_before.mp3
- start_exam.mp3
- end_exam.mp3
- 15min_remaining.mp3
- 45min_before.mp3
- 30min_before.mp3
- 19min_before.mp3
- 10min_before.mp3
- 5min_before.mp3
- music.mp3

2. 添加考试
- 通过上传文件添加：准备一个符合格式的文本文件
- 通过界面添加：使用"添加考试"按钮手动添加

3. 文件格式示例
```
2025.04.20
数学 09:00 120min {分发试卷,考试开始,考试结束}
英语 14:30 90min
物理 16:30 60min {考试前30分钟,考试前15分钟,考试开始,考试提醒,考试结束}
```

## 开发

```bash
# 运行开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行生产版本
pnpm start
```

## 许可证

MIT 
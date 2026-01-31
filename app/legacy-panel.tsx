"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"

// ... (这里将包含从 page.tsx 复制过来的所有接口、类型定义和常量)

// 定义考试事件类型
interface ExamEvent {
  id: string
  subject: string
  eventType:
    | "分发试卷"
    | "考试开始"
    | "考试结束"
    | "考试提醒"
    | "考试前45分钟"
    | "考试前30分钟"
    | "考试前26分钟"
    | "考试前19分钟"
    | "考试前15分钟"
    | "考试前10分钟"
  scheduledTime: Date
  audioFile: string;
  duration?: number; // 考试时长（分钟），仅对"考试开始"事件有效
  customMessage?: string // 自定义消息
  displayName?: string; // 新增字段，用于存储自定义显示名称
}

// ... (其他接口和类型定义)

const audioFileMap = {
  default: {
    分发试卷: "/15min_before.mp3",
    考试开始: "/start_exam.mp3",
    考试结束: "/end_exam.mp3",
    考试提醒: "/15min_remaining.mp3",
    考试前45分钟: "/45min_before.mp3",
    考试前30分钟: "/30min_before.mp3",
    考试前19分钟: "/19min_before.mp3",
    考试前15分钟: "/15min_before.mp3",
    考试前10分钟: "/10min_before.mp3",
    考试前5分钟: "/5min_before.mp3",
    试音音乐: "/music.mp3",
  },
  guangchuhecheng: {
    分发试卷: "/guangchuhecheng/15min_before.mp3",
    考试开始: "/guangchuhecheng/start_exam.mp3",
    考试结束: "/guangchuhecheng/end_exam.mp3",
    考试提醒: "/guangchuhecheng/15min_remaining.mp3",
    考试前45分钟: "/guangchuhecheng/45min_before.mp3",
    考试前30分钟: "/guangchuhecheng/30min_before.mp3",
    考试前19分钟: "/19min_before.mp3",
    考试前15分钟: "/guangchuhecheng/15min_before.mp3",
    考试前10分钟: "/guangchuhecheng/10min_before.mp3",
    考试前5分钟: "/5min_before.mp3",
    试音音乐: "/music.mp3",
    考试前26分钟: "/26min_before.mp3",
  },
}

export default function LegacyPanel() {
  // ... (这里将包含从 page.tsx 复制过来的所有 state 和 ref)
  const [examEvents, setExamEvents] = useState<ExamEvent[]>([])
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [currentSubject, setCurrentSubject] = useState<string>("")
  const audioRef = useRef<HTMLAudioElement>(null)

  // ... (这里将包含从 page.tsx 复制过来的所有函数和 useEffect 钩子)
  useEffect(() => {
    // 时间同步逻辑
  }, []);

  const playAudio = useCallback(() => {
    // 播放逻辑
  }, []);

  // ... 其他逻辑

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <h1>考试广播面板 (兼容模式)</h1>
      
      <div style={{ marginTop: '16px' }}>
        <h2>当前时间: {currentTime?.toLocaleTimeString()}</h2>
        {/* 其他UI元素将使用基本HTML */} 
      </div>

      {/* 添加考试的表单 */}
      <div style={{ marginTop: '24px', border: '1px solid #ccc', padding: '16px' }}>
        <h3>添加新考试</h3>
        {/* ... 表单输入 ... */}
        <button>添加考试</button>
      </div>

      {/* 考试事件列表 */}
      <div style={{ marginTop: '24px' }}>
        <h3>考试安排</h3>
        {/* ... 事件列表 ... */}
      </div>

      <audio ref={audioRef} />
    </div>
  )
}
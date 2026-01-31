"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Play,
  Clock,
  Calendar,
  Volume2,
  Pause,
  Download,
  Info,
  Music,
  VolumeX,
  Volume1,
  AlertTriangle,
  RefreshCw,
  Plus,
  Save,
  X,
  Wifi,
  WifiOff,
  Check,
  Loader2,
  HardDrive,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

// 音频缓存接口
interface AudioCache {
  url: string
  blob?: Blob
  lastAccessed: number
  status: "pending" | "cached" | "error"
}

// 音频库类型
type AudioLibraryType = "default" | "guangchuhecheng"

// 音频库名称映射
const audioLibraryNames = {
  default: "广高",
  guangchuhecheng: "广初合成",
}


// 广初合成音库不全的音频列表
const guangchuhechengIncompleteAudios = ["考试前19分钟", "考试前26分钟"]


// 修改音频文件映射，添加不同音库的支持
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

// 事件类型颜色映射
const eventTypeColorMap = {
  分发试卷: "bg-blue-500",
  考试开始: "bg-green-500",
  考试结束: "bg-red-500",
  考试提醒: "bg-yellow-500",
  考试前45分钟: "bg-purple-500",
  考试前30分钟: "bg-indigo-500",
  考试前19分钟: "bg-pink-500",
  考试前15分钟: "bg-blue-500",
  考试前10分钟: "bg-cyan-500",
}

// 可选的广播事件类型
const broadcastEventTypes = [
  "分发试卷",
  "考试开始",
  "考试结束",
  "考试提醒",
  "考试前45分钟",
  "考试前30分钟",
  "考试前26分钟",
  "考试前19分钟",
  "考试前15分钟",
  "考试前10分钟",
  // "考试前5分钟", // 移除此行
]

// IndexedDB 数据库名称和版本
const DB_NAME = "examBroadcastDB"
const DB_VERSION = 1
const AUDIO_STORE = "audioCache"
const EXAM_STORE = "examEvents"

export default function ExamBroadcastPanel() {
  const [examEvents, setExamEvents] = useState<ExamEvent[]>([])
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [currentSubject, setCurrentSubject] = useState<string>("")
  const [nextEvent, setNextEvent] = useState<ExamEvent | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [activeEvent, setActiveEvent] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(true)
  const [examDate, setExamDate] = useState<string>("")
  const [volume, setVolume] = useState<number>(80)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [audioProgress, setAudioProgress] = useState<number>(0)
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const [showHelp, setShowHelp] = useState<boolean>(true)
  const [testMusicPlaying, setTestMusicPlaying] = useState<boolean>(false)
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [selectedAudioLibrary, setSelectedAudioLibrary] = useState<AudioLibraryType>("guangchuhecheng") // 改为默认使用广初合成
  const [testMusicSource, setTestMusicSource] = useState<string>(audioFileMap["guangchuhecheng"]["试音音乐"])
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [offlineModeEnabled, setOfflineModeEnabled] = useState<boolean>(false)
  const [audioCache, setAudioCache] = useState<Record<string, AudioCache>>({})
  const [preloadProgress, setPreloadProgress] = useState<number>(0)
  const [isPreloading, setIsPreloading] = useState<boolean>(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [useBackupAudio, setUseBackupAudio] = useState<boolean>(false)

  // 添加考试表单状态
  const [newExamSubject, setNewExamSubject] = useState<string>("")
  const [newExamDate, setNewExamDate] = useState<string>("")
  const [newExamTime, setNewExamTime] = useState<string>("")
  const [isOldWebKit, setIsOldWebKit] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const webkitVersionMatch = userAgent.match(/applewebkit\/(\d+)/);

    if (isAndroid && webkitVersionMatch) {
      const version = parseInt(webkitVersionMatch[1], 10);
      if (version < 537) {
        setIsOldWebKit(true);
      }
    }
  }, []);
  const [newExamDuration, setNewExamDuration] = useState<string>("")
  const [selectedBroadcastTypes, setSelectedBroadcastTypes] = useState<string[]>([])
  const [newExamEventType, setNewExamEventType] = useState<ExamEvent["eventType"] | "">("") // 新增状态变量

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const testMusicRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const oscillator = useRef<OscillatorNode | null>(null)
  const gainNode = useRef<GainNode | null>(null)
  const dbRef = useRef<IDBDatabase | null>(null)

  // 初始化IndexedDB
  useEffect(() => {
    const initDB = () => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error("IndexedDB 打开失败:", event)
        toast({
          title: "离线存储初始化失败",
          description: "无法创建本地数据库，离线模式可能无法正常工作。",
          variant: "destructive",
        })
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建音频缓存存储
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          const audioStore = db.createObjectStore(AUDIO_STORE, { keyPath: "url" })
          audioStore.createIndex("lastAccessed", "lastAccessed", { unique: false })
        }

        // 创建考试事件存储
        if (!db.objectStoreNames.contains(EXAM_STORE)) {
          db.createObjectStore(EXAM_STORE, { keyPath: "id" })
        }
      }

      request.onsuccess = (event) => {
        dbRef.current = (event.target as IDBOpenDBRequest).result
        console.log("IndexedDB 初始化成功")

        // 加载已保存的考试事件
        loadExamEventsFromDB()
      }
    }

    initDB()

    // 监听在线状态变化
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine)
      if (navigator.onLine) {
        toast({
          title: "已恢复网络连接",
          description: "系统已切换到在线模式。",
        })
      } else {
        toast({
          title: "网络连接已断开",
          description: "系统已切换到离线模式，部分功能可能受限。",
          variant: "destructive",
        })
      }
    }

    window.addEventListener("online", handleOnlineStatusChange)
    window.addEventListener("offline", handleOnlineStatusChange)

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange)
      window.removeEventListener("offline", handleOnlineStatusChange)

      // 关闭数据库连接
      if (dbRef.current) {
        dbRef.current.close()
      }
    }
  }, [])

  const loadExamEventsFromDB = useCallback(async () => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(EXAM_STORE, "readonly");
    const store = transaction.objectStore(EXAM_STORE);
    const request = store.getAll();

    request.onsuccess = async () => {
      const savedEvents = request.result;
      let events: ExamEvent[] = [];

      if (savedEvents && savedEvents.length > 0) {
        // 转换日期字符串回Date对象
        events = savedEvents.map((event) => ({
          ...event,
          scheduledTime: new Date(event.scheduledTime),
        }));
        console.log(`从数据库加载了 ${events.length} 个考试事件`);
      }

      // 从 /api/audio-config 获取自定义音频配置
      try {
        const response = await fetch('/api/audio-config');
        if (response.ok) {
          const audioConfigs = await response.json();
          console.log('加载自定义音频配置:', audioConfigs);

          // 将自定义名称匹配到 examEvents
          events = events.map(event => {
            const matchedConfig = audioConfigs.find(
              (config: { defaultName: string; actualFileName: string; displayName: string }) =>
                config.defaultName === event.eventType || config.actualFileName === event.audioFile.split('/').pop()
            );
            return matchedConfig ? { ...event, displayName: matchedConfig.displayName } : event;
          });
        } else {
          console.error('Failed to fetch audio configurations:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching audio configurations:', error);
      }

      setExamEvents(events);

      // 如果有考试日期，设置它
      if (events.length > 0) {
        const firstEvent = events.find((e) => e.eventType === "考试开始");
        if (firstEvent) {
          const date = firstEvent.scheduledTime;
          setExamDate(`${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`);
        }
      }
    };

    request.onerror = (event) => {
      console.error("从数据库加载考试事件失败:", (event.target as IDBRequest).error);
    };
  }, [setExamEvents]);

  // 保存考试事件到IndexedDB
  const saveExamEventsToDB = (events: ExamEvent[]) => {
    if (!dbRef.current) return

    const transaction = dbRef.current.transaction(EXAM_STORE, "readwrite")
    const store = transaction.objectStore(EXAM_STORE)

    // 清除现有数据
    store.clear()

    // 添加新数据
    events.forEach((event) => {
      store.add(event)
    })

    transaction.oncomplete = () => {
      console.log(`成功保存 ${events.length} 个考试事件到数据库`)
    }

    transaction.onerror = (event) => {
      console.error("保存考试事件失败:", event)
    }
  }

  // 改进的音频文件缓存函数
  const cacheAudioFile = async (url: string) => {
    if (!dbRef.current || url.startsWith("data:")) return

    // 检查是否已经缓存
    if (audioCache[url] && audioCache[url].status === "cached") {
      console.log(`音频已缓存: ${url}`)
      return
    }

    // 更新缓存状态为pending
    setAudioCache((prev) => ({
      ...prev,
      [url]: { url, lastAccessed: Date.now(), status: "pending" },
    }))

    try {
      // 增加重试机制和更长的超时时间
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 增加到10秒超时

          const response = await fetch(url, {
            signal: controller.signal,
            cache: "no-store",
            headers: {
              Accept: "audio/*,*/*;q=0.9",
            },
          })
          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const blob = await response.blob()

          // 验证blob是否为有效的音频文件
          if (blob.size === 0) {
            throw new Error("音频文件为空")
          }

          // 保存到IndexedDB
          const transaction = dbRef.current.transaction(AUDIO_STORE, "readwrite")
          const store = transaction.objectStore(AUDIO_STORE)

          const cacheItem = {
            url,
            blob,
            lastAccessed: Date.now(),
            status: "cached",
          }

          store.put(cacheItem)

          // 更新内存中的缓存状态
          setAudioCache((prev) => ({
            ...prev,
            [url]: {
              url: cacheItem.url,
              blob: cacheItem.blob,
              lastAccessed: cacheItem.lastAccessed,
              status: cacheItem.status as "pending" | "cached" | "error",
            },
          }))

          console.log(`音频缓存成功: ${url}`)
          return true
        } catch (error) {
          retryCount++
          console.warn(`缓存音频失败 (${url}), 重试 ${retryCount}/${maxRetries}:`, error)

          if (retryCount >= maxRetries) {
            throw error
          }

          // 等待一段时间后重试
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
        }
      }
    } catch (error) {
      console.error(`缓存音频失败 (${url}):`, error)
      setAudioError(`无法加载音频文件: ${url}. 错误: ${error instanceof Error ? error.message : String(error)}`)

      // 更新缓存状态为error
      setAudioCache((prev) => ({
        ...prev,
        [url]: { url, lastAccessed: Date.now(), status: "error" },
      }))

      return false
    }
  }

  // 从缓存获取音频
  const getAudioFromCache = async (url: string): Promise<string | null> => {
    if (!dbRef.current || url.startsWith("data:")) return url

    try {
      const transaction = dbRef.current.transaction(AUDIO_STORE, "readonly")
      const store = transaction.objectStore(AUDIO_STORE)
      const request = store.get(url)

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const cacheItem = request.result
          if (cacheItem && cacheItem.blob) {
            // 更新最后访问时间
            const updateTx = dbRef.current!.transaction(AUDIO_STORE, "readwrite")
            const updateStore = updateTx.objectStore(AUDIO_STORE)
            updateStore.put({
              ...cacheItem,
              lastAccessed: Date.now(),
            })

            // 创建Blob URL
            const blobUrl = URL.createObjectURL(cacheItem.blob)
            resolve(blobUrl)
          } else {
            resolve(url) // 如果没有缓存，返回原始URL
          }
        }

        request.onerror = () => {
          console.error(`获取缓存音频失败 (${url}):`, request.error)
          resolve(url) // 出错时返回原始URL
        }
      })
    } catch (error) {
      console.error(`获取缓存音频出错 (${url}):`, error)
      return url
    }
  }

  // 预加载所有音频文件
  const preloadAllAudio = useCallback(async () => {
    if (isPreloading) return

    setIsPreloading(true)
    setPreloadProgress(0)

    const allAudioUrls: string[] = []
    for (const libraryKey in audioFileMap) {
      const library = audioFileMap[libraryKey as AudioLibraryType]
      for (const eventType in library) {
        const url = library[eventType as keyof typeof library]
        if (typeof url === "string" && !url.startsWith("data:")) {
          allAudioUrls.push(url)
        }
      }
    }

    let completed = 0

    for (const url of allAudioUrls) {
      await cacheAudioFile(url)
      completed++
      setPreloadProgress(Math.floor((completed / allAudioUrls.length) * 100))
    }

    setIsPreloading(false)

    toast({
      title: "音频预加载完成",
      description: `已成功预加载 ${completed} 个音频文件。`,
    })
  }, [])

  // 改进的暂停音频函数
  const pauseAudio = useCallback(() => {
    try {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)

        if (progressInterval.current) {
          clearInterval(progressInterval.current)
          progressInterval.current = null
        }
      }
    } catch (error) {
      console.error("暂停音频失败:", error)
      toast({
        title: "暂停音频失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }, [isPlaying])

  // 改进的音频播放函数，专门针对广高音频问题进行优化
  const playAudio = useCallback(
    async (eventId: string) => {
      const event = examEvents.find((e) => e.id === eventId)
      if (!event) return

      try {
        // 重置错误状态
        setAudioError(null)

        // 如果当前正在播放同一个事件，则暂停
        if (isPlaying && activeEvent === eventId && audioRef.current) {
          pauseAudio()
          return
        }

        // 如果有其他音频正在播放，先停止
        if (isPlaying && audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          if (progressInterval.current) {
            clearInterval(progressInterval.current)
            progressInterval.current = null
          }
          // 短暂延迟，确保前一个音频操作完成
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        // 如果试音音乐正在播放，停止它
        stopTestMusic()

        setActiveEvent(eventId)
        setIsPlaying(true)
        setIsAudioLoading(true)

        // 确定要使用的音频文件
        let audioUrl = event.audioFile
        console.log(`尝试播放音频: ${audioUrl}`)



        // 如果是离线模式，从缓存获取音频
        let finalAudioUrl = audioUrl
        if (!isOnline || offlineModeEnabled) {
          const cachedUrl = await getAudioFromCache(audioUrl)
          if (cachedUrl) {
            finalAudioUrl = cachedUrl
            console.log(`使用缓存音频: ${finalAudioUrl}`)
          }
        }

        // 创建新的Audio对象进行播放
        const audio = new Audio()

        // 设置音频属性
        audio.volume = isMuted ? 0 : volume / 100
        audio.preload = "auto"

        // 设置错误处理
        audio.onerror = (e) => {
          console.error("音频加载失败:", e)
          setIsPlaying(false)
          setActiveEvent(null)
          setIsAudioLoading(false)

          let errorMessage = "未知错误"
          if (audio.error) {
            switch (audio.error.code) {
              case 1:
                errorMessage = "获取过程被中止"
                break
              case 2:
                errorMessage = "网络错误"
                break
              case 3:
                errorMessage = "解码错误"
                break
              case 4:
                errorMessage = "音频格式不支持"
                break
              default:
                errorMessage = `错误代码: ${audio.error.code}`
            }
          }

          setAudioError(`音频播放失败: ${errorMessage}`)
          toast({
            title: "音频播放失败",
            description: `错误: ${errorMessage}`,
            variant: "destructive",
          })
        }

        // 设置加载完成处理
        audio.oncanplaythrough = () => {
          setAudioDuration(audio.duration)
          setIsAudioLoading(false)
          console.log("音频加载完成，可以播放")
        }

        // 设置播放结束处理
        audio.onended = () => {
          console.log("音频播放结束")
          setIsPlaying(false)
          setActiveEvent(null)
          setAudioProgress(0)

          if (progressInterval.current) {
            clearInterval(progressInterval.current)
            progressInterval.current = null
          }
        }

        // 设置音频源并加载
        audio.src = finalAudioUrl
        audio.load()

        // 等待音频加载完成
        await new Promise((resolve, reject) => {
          const loadTimeout = setTimeout(() => {
            console.warn("音频加载超时")
            reject(new Error("音频加载超时"))
          }, 15000) // 15秒超时

          audio.onloadedmetadata = () => {
            clearTimeout(loadTimeout)
            setAudioDuration(audio.duration)
            setIsAudioLoading(false)
            console.log("音频元数据加载完成")
            resolve(true)
          }

          // 如果音频已经加载完成，直接解析
          if (audio.readyState >= 2) {
            clearTimeout(loadTimeout)
            setAudioDuration(audio.duration)
            setIsAudioLoading(false)
            console.log("音频已经加载完成")
            resolve(true)
          }
        })

        // 尝试播放音频
        try {
          console.log("尝试播放音频...")
          await audio.play()
          console.log("音频开始播放")

          // 更新audioRef引用
          audioRef.current = audio

          // 更新进度条
          if (progressInterval.current) {
            clearInterval(progressInterval.current)
          }

          progressInterval.current = setInterval(() => {
            if (audio && !audio.paused) {
              const progress = (audio.currentTime / audio.duration) * 100
              setAudioProgress(progress)
            }
          }, 100)
        } catch (error) {
          console.error("播放音频失败:", error)
          setIsPlaying(false)
          setActiveEvent(null)
          setIsAudioLoading(false)
          setAudioError(`播放音频失败: ${error instanceof Error ? error.message : "未知错误"}`)

          toast({
            title: "播放音频失败",
            description: error instanceof Error ? error.message : "未知错误",
            variant: "destructive",
          })

          // 如果是用户交互问题，提供提示
          if (error instanceof DOMException && error.name === "NotAllowedError") {
            console.log("用户交互问题，请确保用户已与页面交互")
            toast({
              title: "需要用户交互",
              description: "请先点击页面任意位置，然后再尝试播放音频。",
              variant: "default",
            })
          }
        }
      } catch (error) {
        console.error("音频处理错误:", error)
        setIsPlaying(false)
        setActiveEvent(null)
        setIsAudioLoading(false)
        setAudioError(`音频处理错误: ${error instanceof Error ? error.message : "未知错误"}`)

        toast({
          title: "音频处理错误",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        })
      }
    },
    [
      examEvents,
      isPlaying,
      activeEvent,
      isOnline,
      offlineModeEnabled,
      isMuted,
      volume,
      pauseAudio,
      selectedAudioLibrary,
    ],
  )

  // 在客户端初始化时间
  useEffect(() => {
    setCurrentTime(new Date())
  }, [])

  // 更新当前时间和倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)

      // 找到下一个事件
      const upcoming = examEvents
        .filter((event) => event.scheduledTime > now)
        .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())[0]

      setNextEvent(upcoming || null)

      if (upcoming) {
        setCountdown(Math.floor((upcoming.scheduledTime.getTime() - now.getTime()) / 1000))
      } else {
        setCountdown(0)
      }

      // 更新当前科目
      const currentExams = examEvents.filter(
        (event) =>
          event.eventType === "考试开始" &&
          event.scheduledTime <= now &&
          new Date(event.scheduledTime.getTime() + (event.duration || 0) * 60000) >= now,
      )

      if (currentExams.length > 0) {
        setCurrentSubject(currentExams[0].subject)
      } else {
        setCurrentSubject("无考试进行中")
      }

      // 自动播放功能 - 添加防抖和错误处理
      if (autoPlayEnabled && upcoming && !isPlaying) {
        const timeToEvent = upcoming.scheduledTime.getTime() - now.getTime()
        // 只在事件前后1秒内触发，避免多次触发
        if (timeToEvent >= 0 && timeToEvent <= 1000) {
          playAudio(upcoming.id).catch((error) => {
            console.error("自动播放失败:", error)
          })
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [examEvents, autoPlayEnabled, isPlaying, playAudio])

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
    if (testMusicRef.current) {
      testMusicRef.current.volume = isMuted ? 0 : (volume / 100) * 0.3 // 试音音乐音量较小
    }
    if (gainNode.current) {
      gainNode.current.gain.value = isMuted ? 0 : (volume / 100) * 0.1 // Web Audio API音量控制
    }
  }, [volume, isMuted])

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 停止所有音频播放
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (testMusicRef.current) {
        testMusicRef.current.pause()
      }
      // 清理Web Audio API资源
      if (oscillator.current) {
        try {
          oscillator.current.stop()
        } catch (e) {
          // 忽略已经停止的错误
        }
      }
      if (audioContext.current) {
        try {
          audioContext.current.close()
        } catch (e) {
          // 忽略关闭错误
        }
      }
    }
  }, [])

  // 当选择的音频库变化时，更新测试音乐源
  useEffect(() => {
    setTestMusicSource(audioFileMap[selectedAudioLibrary]["试音音乐"])
    console.log(
      `音频库切换为 ${selectedAudioLibrary}，测试音乐源更新为: ${audioFileMap[selectedAudioLibrary]["试音音乐"]}`,
    )
  }, [selectedAudioLibrary])

  // 监听考试事件变化，保存到数据库
  useEffect(() => {
    if (examEvents.length > 0) {
      saveExamEventsToDB(examEvents)
    }
  }, [examEvents])

  // 解析上传的文件
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      parseExamSchedule(content)
    }
    reader.readAsText(file)
  }

  // 解析考试安排文件
  const parseExamSchedule = (content: string) => {
    const lines = content.split("\n").filter((line) => line.trim() !== "")
    const events: ExamEvent[] = []

    // 第一行是考试日期
    if (lines.length > 0) {
      const dateStr = lines[0].trim()
      setExamDate(dateStr)

      // 处理后续每行
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // 解析格式: 科目 开始时间 考试时长min {可选：自定义广播内容}
        const customBroadcastMatch = line.match(/{([^}]+)}/)
        const customBroadcasts = customBroadcastMatch
          ? customBroadcastMatch[1].split(",").map((item) => item.trim())
          : []

        // 移除自定义广播部分，处理基本信息
        const basicInfo = line.replace(/{[^}]+}/, "").trim()
        const parts = basicInfo.split(/\s+/)

        if (parts.length >= 3) {
          const subject = parts[0]
          const timeStr = parts[1]
          const durationStr = parts[2]

          // 解析考试时长（去掉"min"后缀）
          const duration = Number.parseInt(durationStr.replace("min", ""))

          // 解析日期和时间
          const [year, month, day] = dateStr.split(".").map(Number)
          const [hour, minute] = timeStr.split(":").map(Number)

          const examStartTime = new Date(year, month - 1, day, hour, minute)

          // 确定要创建哪些广播事件
          const eventTypes =
            customBroadcasts.length > 0
              ? customBroadcasts
              : [
                  "考试前45分钟",
                  "考试前30分钟",
                  "考试前19分钟",
                  "考试前15分钟",
                  "考试前10分钟",
                  "考试前5分钟",
                  "分发试卷",
                  "考试开始",
                  "考试提醒",
                  "考试结束",
                ]

          // 创建广播事件
          eventTypes.forEach((eventType) => {
            let eventTime: Date
            let eventTypeKey: string = eventType

            switch (eventType) {
              case "考试前45分钟":
                eventTime = new Date(examStartTime.getTime() - 45 * 60000)
                break
              case "考试前30分钟":
                eventTime = new Date(examStartTime.getTime() - 30 * 60000)
                break
              case "考试前26分钟": // Add this case
                eventTime = new Date(examStartTime.getTime() - 26 * 60000)
                break
              case "考试前19分钟":
                eventTime = new Date(examStartTime.getTime() - 19 * 60000)
                break
              case "考试前15分钟":
                eventTime = new Date(examStartTime.getTime() - 15 * 60000)
                break
              case "考试前10分钟":
                eventTime = new Date(examStartTime.getTime() - 10 * 60000)
                break
              case "考试前5分钟":
                eventTime = new Date(examStartTime.getTime() - 5 * 60000)
                break
              case "分发试卷":
                eventTime = new Date(examStartTime.getTime() - 15 * 60000)
                break
              case "考试开始":
                eventTime = examStartTime
                break
              case "考试提醒":
                eventTime = new Date(examStartTime.getTime() + (duration - 15) * 60000)
                break
              case "考试结束":
                eventTime = new Date(examStartTime.getTime() + duration * 60000)
                break
              default:
                // 如果是未知事件类型，默认设为考试开始时间
                eventTime = examStartTime
                eventTypeKey = "考试开始"
            }

            events.push({
              id: `${eventType}-${i}-${Date.now()}`,
              subject,
              eventType: eventTypeKey as any,
              scheduledTime: eventTime,
              audioFile:
                audioFileMap[selectedAudioLibrary][eventTypeKey as keyof typeof audioFileMap.default] ||
                audioFileMap[selectedAudioLibrary]["考试开始"],
              duration: eventType === "考试开始" ? duration : undefined,
            })
          })
        }
      }
    }

    // 按时间排序
    events.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())

    // 更新考试事件
    setExamEvents((prevEvents) => {
      const newEvents = [...prevEvents, ...events]
      // 保存到数据库
      saveExamEventsToDB(newEvents)
      return newEvents
    })

    // 显示成功提示
    setSuccessMessage(`已成功导入 ${events.length} 个考试事件`)
    setShowSuccessMessage(true)

    // 3秒后自动隐藏成功提示
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 3000)

    // 预加载相关音频
    const audioUrls = new Set<string>()
    events.forEach((event) => {
      if (event.audioFile) {
        audioUrls.add(event.audioFile)
      }
    })

    // 异步预加载音频
    audioUrls.forEach((url) => {
      cacheAudioFile(url)
    })
  }

  // 添加新考试
  const addNewExam = () => {
    if (!newExamSubject || !newExamDate || !newExamTime || !newExamDuration) {
      toast({
        title: "添加失败",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    try {
      // 解析日期和时间
      const [year, month, day] = newExamDate.split("-").map(Number)
      const [hour, minute] = newExamTime.split(":").map(Number)
      const duration = Number.parseInt(newExamDuration)

      if (isNaN(duration) || duration <= 0) {
        toast({
          title: "添加失败",
          description: "考试时长必须是正整数",
          variant: "destructive",
        })
        return
      }

      const examStartTime = new Date(year, month - 1, day, hour, minute)
      const events: ExamEvent[] = []

      // 如果没有选择任何广播类型，使用默认的全部类型
      const eventTypes = selectedBroadcastTypes.length > 0 ? selectedBroadcastTypes : broadcastEventTypes

      // 创建广播事件
      eventTypes.forEach((eventType) => {
        let eventTime: Date
        let eventTypeKey: string = eventType

        switch (eventType) {
          case "考试前45分钟":
            eventTime = new Date(examStartTime.getTime() - 45 * 60000)
            break
          case "考试前30分钟":
            eventTime = new Date(examStartTime.getTime() - 30 * 60000)
            break
          case "考试前26分钟": // Add this case
            eventTime = new Date(examStartTime.getTime() - 26 * 60000)
            break
          case "考试前19分钟":
            eventTime = new Date(examStartTime.getTime() - 19 * 60000)
            break
          case "考试前15分钟":
            eventTime = new Date(examStartTime.getTime() - 15 * 60000)
            break
          case "考试前10分钟":
            eventTime = new Date(examStartTime.getTime() - 10 * 60000)
            break
          case "考试前5分钟":
            eventTime = new Date(examStartTime.getTime() - 5 * 60000)
            break
          case "分发试卷":
            eventTime = new Date(examStartTime.getTime() - 15 * 60000)
            break
          case "考试开始":
            eventTime = examStartTime
            break
          case "考试提醒":
            eventTime = new Date(examStartTime.getTime() + (duration - 15) * 60000)
            break
          case "考试结束":
            eventTime = new Date(examStartTime.getTime() + duration * 60000)
            break
          default:
            // 如果是未知事件类型，默认设为考试开始时间
            eventTime = examStartTime
            eventTypeKey = "考试开始"
        }

        events.push({
          id: `${eventType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          subject: newExamSubject,
          eventType: eventTypeKey as any,
          scheduledTime: eventTime,
          audioFile:
            audioFileMap[selectedAudioLibrary][eventTypeKey as keyof typeof audioFileMap.default] ||
            audioFileMap[selectedAudioLibrary]["考试开始"],
          duration: eventType === "考试开始" ? duration : undefined,
        })
      })

      // 更新考试日期（如果尚未设置）
      if (!examDate) {
        setExamDate(`${year}.${month}.${day}`)
      }

      // 添加新考试事件并按时间排序
      setExamEvents((prevEvents) => {
        const allEvents = [...prevEvents, ...events]
        const sortedEvents = allEvents.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
        // 保存到数据库
        saveExamEventsToDB(sortedEvents)
        return sortedEvents
      })

      // 重置表单
      setNewExamSubject("")
      setNewExamDate("")
      setNewExamTime("")
      setNewExamDuration("")
      setSelectedBroadcastTypes([])

      // 显示成功提示
      setSuccessMessage(`已成功添加 ${newExamSubject} 考试，共 ${events.length} 个广播事件`)
      setShowSuccessMessage(true)

      // 3秒后自动隐藏成功提示
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)

      // 预加载相关音频
      const audioUrls = new Set<string>()
      events.forEach((event) => {
        if (event.audioFile) {
          audioUrls.add(event.audioFile)
        }
      })

      // 异步预加载音频
      audioUrls.forEach((url) => {
        cacheAudioFile(url)
      })
    } catch (error) {
      console.error("添加考试失败:", error)
      toast({
        title: "添加失败",
        description: "添加考试时出现错误，请检查输入格式",
        variant: "destructive",
      })
    }
  }

  // 改进的继续播放音频函数
  const resumeAudio = async () => {
    try {
      if (audioRef.current && !isPlaying && activeEvent) {
        setIsPlaying(true)

        try {
          await audioRef.current.play()

          // 更新进度条
          if (progressInterval.current) {
            clearInterval(progressInterval.current)
          }

          progressInterval.current = setInterval(() => {
            if (audioRef.current) {
              const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
              setAudioProgress(progress)
            }
          }, 100)
        } catch (error) {
          console.error("继续播放音频失败:", error)
          setIsPlaying(false)
          toast({
            title: "继续播放失败",
            description: error instanceof Error ? error.message : "未知错误",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("音频处理错误:", error)
      setIsPlaying(false)
      toast({
        title: "音频处理错误",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  // 播放内置音频作为备用方案
  const playFallbackSound = () => {
    try {
      // 如果已经有音频上下文，先关闭它
      if (audioContext.current) {
        try {
          if (oscillator.current) {
            oscillator.current.stop()
          }
          audioContext.current.close()
        } catch (e) {
          // 忽略关闭错误
        }
      }

      // 创建新的音频上下文
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      oscillator.current = audioContext.current.createOscillator()
      gainNode.current = audioContext.current.createGain()

      // 设置音频参数
      oscillator.current.type = "sine"
      oscillator.current.frequency.setValueAtTime(440, audioContext.current.currentTime) // 440Hz = A4
      gainNode.current.gain.setValueAtTime(isMuted ? 0 : (volume / 100) * 0.1, audioContext.current.currentTime)

      // 连接节点
      oscillator.current.connect(gainNode.current)
      gainNode.current.connect(audioContext.current.destination)

      // 播放1秒钟的音频
      oscillator.current.start()
      setTimeout(() => {
        if (oscillator.current) {
          oscillator.current.stop()
        }
      }, 1000)

      return true
    } catch (e) {
      console.error("创建内置音频失败:", e)
      return false
    }
  }

  // 停止试音音乐
  const stopTestMusic = () => {
    if (testMusicPlaying && testMusicRef.current) {
      testMusicRef.current.pause()
      testMusicRef.current.currentTime = 0
      setTestMusicPlaying(false)
    }
  }

  // 改进的试音音乐播放函数
  const toggleTestMusic = async () => {
    try {
      if (testMusicPlaying) {
        // 如果正在播放，停止音乐
        stopTestMusic()
        return
      }

      // 如果有其他音频正在播放，先停止
      if (isPlaying && audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsPlaying(false)
        setActiveEvent(null)
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
          progressInterval.current = null
        }
      }

      // 设置加载状态
      setIsAudioLoading(true)

      try {
        console.log(`尝试播放试音音乐: ${testMusicSource}，当前音频库: ${selectedAudioLibrary}`)

        // 如果是离线模式，从缓存获取音频
        let sourceUrl = testMusicSource
        if ((!isOnline || offlineModeEnabled) && !sourceUrl.startsWith("data:")) {
          const cachedUrl = await getAudioFromCache(sourceUrl)
          if (cachedUrl) {
            sourceUrl = cachedUrl
            console.log(`使用缓存音频: ${sourceUrl}`)
          } else {
            console.log(`未找到缓存音频，使用原始路径: ${sourceUrl}`)
          }
        }

        // 创建新的Audio元素
        const audio = new Audio()
        audio.volume = isMuted ? 0 : (volume / 100) * 0.3
        audio.preload = "auto"

        // 设置错误处理
        audio.onerror = (e) => {
          console.error("试音音乐加载错误:", e)
          if (audio.error) {
            console.error("错误代码:", audio.error.code, "错误消息:", audio.error.message)
          }
          setIsAudioLoading(false)
          setAudioError("试音音乐加载失败")
        }

        // 设置加载超时
        const loadTimeout = setTimeout(() => {
          if (!testMusicPlaying) {
            console.error("试音音乐加载超时")
            setIsAudioLoading(false)
            setAudioError("试音音乐加载超时")
            toast({
              title: "试音音乐加载超时",
              description: "请检查音频文件是否存在且格式正确",
              variant: "destructive",
            })
          }
        }, 8000) // 8秒超时

        // 设置加载完成处理
        audio.oncanplaythrough = () => {
          clearTimeout(loadTimeout)
          setIsAudioLoading(false)
        }

        // 设置音频源并加载
        audio.src = sourceUrl
        audio.load()

        // 尝试播放
        try {
          await audio.play()
          clearTimeout(loadTimeout)
          setTestMusicPlaying(true)
          testMusicRef.current = audio

          // 设置结束事件
          audio.onended = () => {
            setTestMusicPlaying(false)
          }

          console.log(`试音音乐播放成功: ${sourceUrl}`)
        } catch (playError) {
          clearTimeout(loadTimeout)
          console.error("试音音乐播放失败:", playError)
          setIsAudioLoading(false)
          setAudioError("试音音乐播放失败")

          toast({
            title: "试音音乐播放失败",
            description: playError instanceof Error ? playError.message : "未知错误",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("试音音乐处理错误:", error)
        setIsAudioLoading(false)
        setAudioError("试音音乐处理错误")

        toast({
          title: "试音音乐处理错误",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("试音音乐处理错误:", error)
      setIsAudioLoading(false)
      setAudioError("试音音乐处理错误")

      toast({
        title: "试音音乐处理错误",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  // 重置音频错误状态并尝试使用原始音频
  const resetAudioError = () => {
    setAudioError(null)
    setUseBackupAudio(false)
    toast({
      title: "已重置音频设置",
      description: "将尝试使用原始音频文件。",
    })
  }

  // 下载示例文件
  const downloadSampleFile = () => {
    const content = `2025.04.20
数学 09:00 120min {分发试卷,考试开始,考试结束}
英语 14:30 90min
物理 16:30 60min {考试前30分钟,考试前15分钟,考试开始,考试提醒,考试结束}`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "time.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 格式化时间显示
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  }

  // 格式化日期显示
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
  }

  // 格式化倒计时显示
  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return "00:00:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 格式化音频时长
  const formatAudioTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 处理广播类型选择
  const handleBroadcastTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedBroadcastTypes((prev) => [...prev, type])
    } else {
      setSelectedBroadcastTypes((prev) => prev.filter((t) => t !== type))
    }
  }

  // 清除所有考试事件
  const clearAllExams = () => {
    if (confirm("确定要清除所有考试事件吗？此操作不可撤销。")) {
      setExamEvents([])

      // 清除数据库中的考试事件
      if (dbRef.current) {
        const transaction = dbRef.current.transaction(EXAM_STORE, "readwrite")
        const store = transaction.objectStore(EXAM_STORE)
        store.clear()
      }

      toast({
        title: "已清除所有考试",
        description: "所有考试事件已被删除。",
      })
    }
  }

  // 切换离线模式
  const toggleOfflineMode = () => {
    setOfflineModeEnabled(!offlineModeEnabled)

    toast({
      title: offlineModeEnabled ? "已关闭离线模式" : "已启用离线模式",
      description: offlineModeEnabled
        ? "系统将优先使用在线音频资源。"
        : "系统将优先使用本地缓存的音频资源，适合在网络不稳定的环境下使用。",
    })
  }

  useEffect(() => {
    // 检测浏览器音频支持
    const checkAudioSupport = () => {
      try {
        // 检测Audio API支持
        const audio = new Audio()

        // 检测Web Audio API支持
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContext) {
          console.warn("浏览器不支持Web Audio API")
        } else {
          console.log("浏览器支持Web Audio API")
        }

        // 检测音频格式支持
        const formats = {
          mp3: "audio/mpeg",
          ogg: "audio/ogg",
          wav: "audio/wav",
          aac: "audio/aac",
        }

        for (const [format, mimeType] of Object.entries(formats)) {
          const canPlay = audio.canPlayType(mimeType)
          console.log(`浏览器${canPlay ? "支持" : "不支持"}${format}格式`)
        }
      } catch (e) {
        console.error("音频支持检测失败:", e)
      }
    }

    checkAudioSupport()
  }, [])

  // 添加客户端渲染的网络状态指示器组件
  const NetworkStatus = () => {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    if (!mounted) {
      return null
    }

    return isOnline ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
        <Wifi className="h-3 w-3" />
        在线模式
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        离线模式
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">考试广播控制面板</h1>

      {isOldWebKit && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>兼容性提示</AlertTitle>
          <AlertDescription>
            您似乎正在使用旧版 WebKit 内核的浏览器，部分功能可能无法正常工作。建议使用现代浏览器以获得最佳体验。
          </AlertDescription>
        </Alert>
      )}

      {/* 网络状态指示器 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <NetworkStatus />

          <div className="flex items-center gap-2 ml-4">
            <Switch id="offline-mode" checked={offlineModeEnabled} onCheckedChange={toggleOfflineMode} />
            <Label htmlFor="offline-mode" className="text-sm">
              强制离线模式
            </Label>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <select
              id="audio-library"
              value={selectedAudioLibrary}
              onChange={(e) => setSelectedAudioLibrary(e.target.value as AudioLibraryType)}
              className="text-sm border rounded px-2 py-1"
            >
              {Object.entries(audioLibraryNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
            <Label htmlFor="audio-library" className="text-sm">
              音频库
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={preloadAllAudio}
            disabled={isPreloading}
            className="flex items-center gap-1"
          >
            {isPreloading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                预加载中 {preloadProgress}%
              </>
            ) : (
              <>
                <HardDrive className="h-3 w-3" />
                预加载音频
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={clearAllExams} className="text-red-500 hover:text-red-700">
            清除所有考试
          </Button>
        </div>
      </div>

      {/* 成功提示 */}
      {showSuccessMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">操作成功</AlertTitle>
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      {showHelp && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>使用说明</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              上传符合格式的考试安排文件(time.txt)，系统将自动生成广播事件。您可以点击"下载示例文件"获取格式示例。
            </p>
            <p className="mb-2">
              文件格式：第一行为考试日期(YYYY.MM.DD)，后续每行格式为"科目 开始时间 考试时长min{" "}
              {"{可选：自定义广播内容}"}'"。
            </p>
            <p className="mb-2">您也可以直接在网页上添加考试，点击"添加考试"按钮。</p>
            <p className="mb-2">
              <strong>离线模式：</strong>{" "}
              启用离线模式后，系统将优先使用本地缓存的音频资源，适合在网络不稳定的环境下使用。
              建议首次使用时点击"预加载音频"按钮，将所有音频文件缓存到本地。
            </p>
            <p className="text-sm text-muted-foreground">
              音频库选择： 系统支持多种音频库，包括广高、广初合成。如果音频出现问题，建议使用其他音频库。
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowHelp(false)} className="mt-2">
              关闭提示
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 音频错误提示 */}
      {audioError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>音频加载错误</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{audioError}</p>
            <p>建议尝试以下解决方案：</p>
            <ul className="list-disc list-inside text-sm">
              <li>切换到广初合成音频库</li>
              <li>检查网络连接</li>
              <li>预加载音频文件到本地缓存</li>
              <li>启用离线模式</li>
            </ul>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={resetAudioError}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重置音频设置
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedAudioLibrary("guangchuhecheng")}>
                切换到广初合成
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 当前状态卡片 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              当前状态
            </CardTitle>
            {examDate && <CardDescription>考试日期: {examDate}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">当前时间</div>
                <div className="text-2xl font-bold">{currentTime ? formatTime(currentTime) : "--:--"}</div>
                <div className="text-sm text-muted-foreground">{currentTime ? formatDate(currentTime) : "--"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">当前科目</div>
                <div className="text-xl font-semibold">{currentSubject}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 下一个广播卡片 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              下一个广播
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextEvent ? (
                <>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">科目</div>
                    <div className="text-xl font-semibold">{nextEvent.subject}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">事件</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-semibold">{nextEvent.eventType}</div>
                      <Badge
                        className={cn(
                          "text-white",
                          eventTypeColorMap[nextEvent.eventType as keyof typeof eventTypeColorMap] || "bg-gray-500",
                        )}
                      >
                        {formatTime(nextEvent.scheduledTime)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">倒计时</div>
                    <div className="text-2xl font-bold">{formatCountdown(countdown)}</div>
                  </div>
                </>
              ) : (
                <div className="text-xl font-semibold py-8 text-center">无待播放广播</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 控制卡片 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Volume2 className="mr-2 h-5 w-5" />
              控制面板
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <Plus className="mr-2 h-4 w-4" />
                      添加考试
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>添加新考试</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">
                          科目
                        </Label>
                        <Input
                          id="subject"
                          value={newExamSubject}
                          onChange={(e) => setNewExamSubject(e.target.value)}
                          className="col-span-3"
                          placeholder="例如：数学"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                          日期
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={newExamDate}
                          onChange={(e) => setNewExamDate(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">
                          开始时间
                        </Label>
                        <Input
                          id="time"
                          type="time"
                          value={newExamTime}
                          onChange={(e) => setNewExamTime(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">
                          考试时长(分钟)
                        </Label>
                        <Input
                          id="duration"
                          type="number"
                          value={newExamDuration}
                          onChange={(e) => setNewExamDuration(e.target.value)}
                          className="col-span-3"
                          placeholder="例如：120"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="audioLibrary" className="text-right">
                          音库选择
                        </Label>
                        <div className="col-span-3">
                          <select
                            id="audioLibrary"
                            value={selectedAudioLibrary}
                            onChange={(e) => setSelectedAudioLibrary(e.target.value as AudioLibraryType)}
                            className="w-full p-2 border rounded-md"
                          >
                            {Object.entries(audioLibraryNames).map(([key, name]) => (
                              <option key={key} value={key}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">广播事件</Label>
                        <div className="col-span-3 grid grid-cols-2 gap-2">
                          {broadcastEventTypes.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`broadcast-${type}`}
                                checked={selectedBroadcastTypes.includes(type)}
                                onCheckedChange={(checked) => handleBroadcastTypeChange(type, checked === true)}
                              />
                              <Label htmlFor={`broadcast-${type}`} className="text-sm">
                                {type}
                                {/* 如果选择的是广初合成音库，并且该音频类型在不全列表中，则标注 (广高) */}
                                {selectedAudioLibrary === "guangchuhecheng" && guangchuhechengIncompleteAudios.includes(type) && " (广高)"}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">
                          <X className="mr-2 h-4 w-4" />
                          取消
                        </Button>
                      </DialogClose>
                      <Button onClick={addNewExam}>
                        <Save className="mr-2 h-4 w-4" />
                        保存
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  上传文件
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={downloadSampleFile}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>下载示例文件</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt" className="hidden" />
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">自动播放</div>
                <Button
                  variant={autoPlayEnabled ? "default" : "outline"}
                  onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                  className="w-full"
                >
                  {autoPlayEnabled ? "已启用自动播放" : "启用自动播放"}
                </Button>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">试音音乐</div>
                <Button
                  variant={testMusicPlaying ? "default" : "outline"}
                  onClick={toggleTestMusic}
                  className="w-full"
                  disabled={isAudioLoading}
                >
                  {isAudioLoading ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-current rounded-full border-t-transparent" />
                      加载中...
                    </>
                  ) : (
                    <>
                      <Music className="mr-2 h-4 w-4" />
                      {testMusicPlaying ? "停止试音音乐" : "播放试音音乐"}
                    </>
                  )}
                </Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">音量控制</div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : volume < 50 ? (
                      <Volume1 className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setVolume(value[0])}
                  disabled={isMuted}
                />
              </div>

              {isPlaying && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-muted-foreground">正在播放</div>
                    <div className="text-xs text-muted-foreground">
                      {audioRef.current ? formatAudioTime(audioRef.current.currentTime) : "00:00"} /
                      {formatAudioTime(audioDuration)}
                    </div>
                  </div>
                  <Progress value={audioProgress} className="h-2 mb-2" />
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isPlaying ? pauseAudio : resumeAudio}
                      disabled={isAudioLoading}
                    >
                      {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isPlaying ? "暂停" : "继续"}
                      {isAudioLoading && <span className="ml-2">加载中...</span>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 考试时间线 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>考试时间线</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="timeline">时间线视图</TabsTrigger>
              <TabsTrigger value="list">列表视图</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              <div className="relative">
                {/* 时间轴线 */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                {examEvents.length > 0 ? (
                  <div className="space-y-8 relative ml-10">
                    {examEvents.map((event) => (
                      <div key={event.id} className="relative">
                        {/* 时间点 */}
                        <div
                          className={cn(
                            "absolute -left-10 w-4 h-4 rounded-full mt-1.5 border-2 border-background",
                            activeEvent === event.id ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600",
                            event.scheduledTime < (currentTime || new Date()) ? "bg-gray-500" : "",
                            eventTypeColorMap[event.eventType as keyof typeof eventTypeColorMap] || "",
                          )}
                        />

                        <div
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border",
                            activeEvent === event.id
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                              : "",
                            event.scheduledTime < (currentTime || new Date()) ? "bg-gray-50 dark:bg-gray-800/50" : "",
                          )}
                        >
                          <div className="mb-2 sm:mb-0">
                            <div className="font-medium flex items-center gap-2">
                              {event.subject} - {event.displayName || event.eventType}
                              {event.customMessage && (
                                <span className="text-xs text-amber-600 ml-1">{event.customMessage}</span>
                              )}
                              <Badge
                                className={cn(
                                  "text-white",
                                  eventTypeColorMap[event.eventType as keyof typeof eventTypeColorMap] || "bg-gray-500",
                                )}
                              >
                                {formatTime(event.scheduledTime)}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{formatDate(event.scheduledTime)}</div>
                          </div>
                          {/* 在时间线视图中的播放按钮 */}
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              "gap-1",
                              activeEvent === event.id
                                ? "bg-green-500 text-white hover:bg-green-600 hover:text-white"
                                : "",
                            )}
                            onClick={() => {
                              if (activeEvent === event.id && isPlaying) {
                                pauseAudio()
                              } else {
                                playAudio(event.id)
                              }
                            }}
                            disabled={(isPlaying && activeEvent !== event.id) || isAudioLoading}
                          >
                            {activeEvent === event.id && isPlaying ? (
                              <>
                                <Pause className="h-4 w-4" />
                                暂停广播
                              </>
                            ) : isAudioLoading && activeEvent === event.id ? (
                              <>
                                <span className="animate-spin h-4 w-4 mr-1 border-2 border-current rounded-full border-t-transparent" />
                                加载中...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                播放广播
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    请上传考试安排文件或添加考试以生成时间线
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="list">
              <div className="divide-y">
                {examEvents.length > 0 ? (
                  examEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "py-4 flex items-center justify-between",
                        activeEvent === event.id ? "bg-green-50 dark:bg-green-900/20" : "",
                      )}
                    >
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {formatTime(event.scheduledTime)}
                          <Badge
                            className={cn(
                              "text-white",
                              eventTypeColorMap[event.eventType as keyof typeof eventTypeColorMap] || "bg-gray-500",
                            )}
                          >
                            {event.displayName || event.eventType}
                          </Badge>
                          {event.customMessage && (
                            <span className="text-xs text-amber-600 ml-1">{event.customMessage}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{event.subject}</div>
                      </div>
                      {/* 在列表视图中的播放按钮 */}
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                          activeEvent === event.id ? "bg-green-500 text-white hover:bg-green-600 hover:text-white" : "",
                        )}
                        onClick={() => {
                          if (activeEvent === event.id && isPlaying) {
                            pauseAudio()
                          } else {
                            playAudio(event.id)
                          }
                        }}
                        disabled={(isPlaying && activeEvent !== event.id) || isAudioLoading}
                      >
                        {activeEvent === event.id && isPlaying ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            暂停
                          </>
                        ) : isAudioLoading && activeEvent === event.id ? (
                          <>
                            <span className="animate-spin h-4 w-4 mr-1 border-2 border-current rounded-full border-t-transparent" />
                            加载中
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            播放
                          </>
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground">请上传考试安排文件或添加考试以生成列表</div>
                )}
              </div>

            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 音频元素（隐藏） */}
      <audio ref={audioRef} className="hidden" />
      <audio ref={testMusicRef} className="hidden" />
    </div>
  )
}

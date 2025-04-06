"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Task, UserSettings } from "@/types"
import { supabase } from "@/lib/supabase/client"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import anime from "animejs"

interface PomodoroTimerProps {
  currentTask?: Task
  userSettings: UserSettings
  onComplete: () => void
}

type TimerMode = "pomodoro" | "shortBreak" | "longBreak"

export default function PomodoroTimer({ currentTask, userSettings, onComplete }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(userSettings.pomodoro_duration)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<TimerMode>("pomodoro")
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const timerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<SVGCircleElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3")
  }, [])

  // Set timer duration based on mode
  useEffect(() => {
    switch (mode) {
      case "pomodoro":
        setTimeLeft(userSettings.pomodoro_duration)
        break
      case "shortBreak":
        setTimeLeft(userSettings.short_break_duration)
        break
      case "longBreak":
        setTimeLeft(userSettings.long_break_duration)
        break
    }
  }, [mode, userSettings])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft])

  // Create a new session when starting a pomodoro
  const createSession = async () => {
    if (!currentTask) return null

    const { data, error } = await supabase
      .from("pomodoro_sessions")
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        task_id: currentTask.id,
        duration: userSettings.pomodoro_duration,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating session:", error)
      return null
    }

    return data.id
  }

  // Update session when completing a pomodoro
  const completeSession = async () => {
    if (!sessionId) return

    await supabase
      .from("pomodoro_sessions")
      .update({
        completed: true,
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    // Update task's completed pomodoros if in pomodoro mode
    if (mode === "pomodoro" && currentTask) {
      await supabase
        .from("tasks")
        .update({
          completed_pomodoros: currentTask.completed_pomodoros + 1,
          status: currentTask.completed_pomodoros + 1 >= currentTask.estimated_pomodoros ? "completed" : "in_progress",
          completed_at:
            currentTask.completed_pomodoros + 1 >= currentTask.estimated_pomodoros ? new Date().toISOString() : null,
        })
        .eq("id", currentTask.id)
    }
  }

  const handleStart = async () => {
    if (mode === "pomodoro" && !sessionId) {
      const id = await createSession()
      setSessionId(id)
    }
    setIsActive(true)

    // Animate timer start
    if (timerRef.current) {
      anime({
        targets: timerRef.current,
        scale: [0.95, 1],
        duration: 400,
        easing: "easeOutElastic(1, .8)",
      })
    }
  }

  const handlePause = () => {
    setIsActive(false)

    // Animate timer pause
    if (timerRef.current) {
      anime({
        targets: timerRef.current,
        scale: [1, 0.98],
        duration: 300,
        easing: "easeOutQuad",
      })
    }
  }

  const handleReset = () => {
    setIsActive(false)
    switch (mode) {
      case "pomodoro":
        setTimeLeft(userSettings.pomodoro_duration)
        break
      case "shortBreak":
        setTimeLeft(userSettings.short_break_duration)
        break
      case "longBreak":
        setTimeLeft(userSettings.long_break_duration)
        break
    }

    // Animate timer reset
    if (timerRef.current) {
      anime({
        targets: timerRef.current,
        rotate: [0, 360],
        duration: 800,
        easing: "easeOutQuad",
      })
    }
  }

  const handleSkip = () => {
    handleTimerComplete()
  }

  const handleTimerComplete = async () => {
    setIsActive(false)

    // Play sound if enabled
    if (userSettings.sound_enabled && audioRef.current) {
      audioRef.current.play().catch((e) => console.error("Error playing sound:", e))
    }

    // Vibrate if enabled and supported
    if (userSettings.vibration_enabled && "vibrate" in navigator) {
      navigator.vibrate(1000)
    }

    // Animate timer completion
    if (timerRef.current) {
      anime({
        targets: timerRef.current,
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        duration: 1000,
        easing: "easeInOutQuad",
      })
    }

    if (mode === "pomodoro") {
      await completeSession()
      setSessionId(null)

      const newCompletedPomodoros = completedPomodoros + 1
      setCompletedPomodoros(newCompletedPomodoros)

      // Check if it's time for a long break
      if (newCompletedPomodoros % userSettings.long_break_interval === 0) {
        setMode("longBreak")
      } else {
        setMode("shortBreak")
      }

      onComplete()
    } else {
      // After a break, go back to pomodoro mode
      setMode("pomodoro")
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate progress percentage
  const calculateProgress = (): number => {
    let totalTime
    switch (mode) {
      case "pomodoro":
        totalTime = userSettings.pomodoro_duration
        break
      case "shortBreak":
        totalTime = userSettings.short_break_duration
        break
      case "longBreak":
        totalTime = userSettings.long_break_duration
        break
    }
    return (1 - timeLeft / totalTime) * 100
  }

  // Update progress circle animation
  useEffect(() => {
    if (progressRef.current) {
      const progress = calculateProgress()
      const circumference = 2 * Math.PI * 45 // 45 is the radius of the circle
      const offset = circumference - (progress / 100) * circumference

      anime({
        targets: progressRef.current,
        strokeDashoffset: [anime.get(progressRef.current, "strokeDashoffset"), offset],
        duration: 500,
        easing: "linear",
      })
    }
  }, [timeLeft])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 flex flex-col items-center">
        <div className="mb-4 flex space-x-2">
          <Button
            variant={mode === "pomodoro" ? "default" : "outline"}
            onClick={() => {
              setMode("pomodoro")
              setIsActive(false)
              setTimeLeft(userSettings.pomodoro_duration)
            }}
          >
            Pomodoro
          </Button>
          <Button
            variant={mode === "shortBreak" ? "default" : "outline"}
            onClick={() => {
              setMode("shortBreak")
              setIsActive(false)
              setTimeLeft(userSettings.short_break_duration)
            }}
          >
            Short Break
          </Button>
          <Button
            variant={mode === "longBreak" ? "default" : "outline"}
            onClick={() => {
              setMode("longBreak")
              setIsActive(false)
              setTimeLeft(userSettings.long_break_duration)
            }}
          >
            Long Break
          </Button>
        </div>

        <div ref={timerRef} className="relative w-64 h-64 flex items-center justify-center mb-6">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="5" />
            {/* Progress circle */}
            <circle
              ref={progressRef}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={mode === "pomodoro" ? "#f43f5e" : mode === "shortBreak" ? "#3b82f6" : "#8b5cf6"}
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold">{formatTime(timeLeft)}</div>
            <div className="text-sm text-gray-500 mt-2 capitalize">{mode}</div>
          </div>
        </div>

        <div className="flex space-x-4">
          {!isActive ? (
            <Button onClick={handleStart} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button onClick={handlePause} size="lg" variant="outline">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          <Button onClick={handleReset} size="lg" variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSkip} size="lg" variant="outline">
            <SkipForward className="mr-2 h-4 w-4" />
            Skip
          </Button>
        </div>

        {currentTask && (
          <div className="mt-6 text-center">
            <h3 className="font-medium">Current Task</h3>
            <p className="text-lg font-bold">{currentTask.title}</p>
            <p className="text-sm text-gray-500">
              {currentTask.completed_pomodoros} / {currentTask.estimated_pomodoros} Pomodoros
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          {Array.from({ length: userSettings.long_break_interval }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 mx-1 rounded-full ${
                i < completedPomodoros % userSettings.long_break_interval ? "bg-red-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


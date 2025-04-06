"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PomodoroTimer from "@/components/pomodoro/pomodoro-timer"
import TodoList from "@/components/todo/todo-list"
import StatsView from "@/components/stats/stats-view"
import SettingsForm from "@/components/settings/settings-form"
import type { Task, UserSettings } from "@/types"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, BarChart2, Settings } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default function Dashboard() {
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkSession()
    fetchSettings()
  }, [])

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession()

    if (!data.session) {
      router.push("/")
    } else {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching settings:", error)
    } else if (data) {
      setUserSettings(data)
    } else {
      // Create default settings
      const defaultSettings: Omit<UserSettings, "user_id" | "updated_at"> = {
        pomodoro_duration: 1500, // 25 minutes
        short_break_duration: 300, // 5 minutes
        long_break_duration: 900, // 15 minutes
        long_break_interval: 4,
        sound_enabled: true,
        vibration_enabled: false,
      }

      const { data: newSettings, error: createError } = await supabase
        .from("user_settings")
        .insert({
          ...defaultSettings,
          user_id: user.id,
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating settings:", createError)
      } else {
        setUserSettings(newSettings)
      }
    }
  }

  const handlePomodoroComplete = () => {
    // Refresh the task list when a pomodoro is completed
    setSelectedTask(undefined)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Pomodoro Task Planner</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {userSettings && (
          <PomodoroTimer currentTask={selectedTask} userSettings={userSettings} onComplete={handlePomodoroComplete} />
        )}

        <TodoList onSelectTask={setSelectedTask} />
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stats" className="mt-6">
          <StatsView />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsForm />
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  )
}


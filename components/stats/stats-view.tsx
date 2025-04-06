"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Clock, Calendar, BarChart3, Target } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import anime from "animejs"

export default function StatsView() {
  const [isLoading, setIsLoading] = useState(true)
  const [totalPomodoros, setTotalPomodoros] = useState(0)
  const [totalHours, setTotalHours] = useState(0)
  const [todayPomodoros, setTodayPomodoros] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(0)
  const [weeklyData, setWeeklyData] = useState<{ date: string; count: number }[]>([])

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      // Animate stats numbers counting up
      anime({
        targets: ".stat-number",
        innerHTML: (el: Element) => [0, el.getAttribute("data-value")],
        round: 1,
        easing: "easeInOutExpo",
        duration: 1500,
      })

      // Animate bars
      anime({
        targets: ".stat-bar",
        height: (el: Element) => [0, el.getAttribute("data-height")],
        easing: "easeInOutExpo",
        delay: anime.stagger(100),
        duration: 1500,
      })
    }
  }, [isLoading])

  const fetchStats = async () => {
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      // Get total completed pomodoros
      const { count: totalCount } = await supabase
        .from("pomodoro_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true)

      setTotalPomodoros(totalCount || 0)

      // Get total hours
      const { data: sessions } = await supabase
        .from("pomodoro_sessions")
        .select("duration")
        .eq("user_id", user.id)
        .eq("completed", true)

      const hours = sessions ? sessions.reduce((acc, session) => acc + session.duration, 0) / 3600 : 0
      setTotalHours(Number.parseFloat(hours.toFixed(1)))

      // Get today's pomodoros
      const today = new Date()
      const startOfToday = startOfDay(today).toISOString()
      const endOfToday = endOfDay(today).toISOString()

      const { count: todayCount } = await supabase
        .from("pomodoro_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("started_at", startOfToday)
        .lte("started_at", endOfToday)

      setTodayPomodoros(todayCount || 0)

      // Get completed tasks
      const { count: tasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")

      setCompletedTasks(tasksCount || 0)

      // Get weekly data
      const weeklyStats = []
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i)
        const startOfDate = startOfDay(date).toISOString()
        const endOfDate = endOfDay(date).toISOString()

        const { count } = await supabase
          .from("pomodoro_sessions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("started_at", startOfDate)
          .lte("started_at", endOfDate)

        weeklyStats.push({
          date: format(date, "EEE"),
          count: count || 0,
        })
      }

      setWeeklyData(weeklyStats)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // Find max value for chart scaling
  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Productivity Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 mr-2 text-red-500" />
              <h3 className="text-sm font-medium">Total Pomodoros</h3>
            </div>
            <p className="text-2xl font-bold stat-number" data-value={totalPomodoros}>
              {totalPomodoros}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-sm font-medium">Today</h3>
            </div>
            <p className="text-2xl font-bold stat-number" data-value={todayPomodoros}>
              {todayPomodoros}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
              <h3 className="text-sm font-medium">Total Hours</h3>
            </div>
            <p className="text-2xl font-bold stat-number" data-value={totalHours}>
              {totalHours}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Target className="h-5 w-5 mr-2 text-green-500" />
              <h3 className="text-sm font-medium">Completed Tasks</h3>
            </div>
            <p className="text-2xl font-bold stat-number" data-value={completedTasks}>
              {completedTasks}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-4">Weekly Activity</h3>
          <div className="flex items-end justify-between h-40">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full flex justify-center mb-2">
                  <div
                    className="stat-bar w-8 bg-red-400 rounded-t-sm"
                    style={{ height: "0px" }}
                    data-height={`${(day.count / maxCount) * 120}px`}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{day.date}</span>
                <span className="text-xs font-medium mt-1">{day.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


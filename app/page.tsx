import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import AuthForm from "@/components/auth/auth-form"
import { Button } from "@/components/ui/button"
import { Clock, CheckSquare, BarChart2 } from "lucide-react"
import Link from "next/link"
import { HeroAnimation } from "@/components/hero-animation"

export default async function Home() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen items-center justify-between p-24">
      <div className="max-w-2xl">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
          Pomodoro Task Planner
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Boost your productivity with our AI-powered Pomodoro timer and task planner.
          Analyze tasks, track progress, and achieve more in less time.
        </p>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Get Started
          </button>
          <button className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
            Learn More
          </button>
        </div>
      </div>
      <div className="relative">
        <HeroAnimation />
      </div>
    </main>
  )
}


export interface User {
  id: string
  email: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  estimated_pomodoros: number
  completed_pomodoros: number
  status: "pending" | "in_progress" | "completed"
  created_at: string
  completed_at?: string
}

export interface PomodoroSession {
  id: string
  user_id: string
  task_id?: string
  duration: number
  completed: boolean
  started_at: string
  ended_at?: string
}

export interface UserSettings {
  user_id: string
  pomodoro_duration: number
  short_break_duration: number
  long_break_duration: number
  long_break_interval: number
  sound_enabled: boolean
  vibration_enabled: boolean
  updated_at: string
}

export interface OnboardingStep {
  title: string
  description: string
  image: string
}


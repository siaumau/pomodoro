"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Task } from "@/types"
import { supabase } from "@/lib/supabase/client"
import { Plus, Check, Clock, Trash2, Edit } from "lucide-react"
import { analyzeTask } from "@/lib/task-analyzer"
import anime from "animejs"

interface TodoListProps {
  onSelectTask: (task: Task) => void
}

export default function TodoList({ onSelectTask }: TodoListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tasks:", error)
    } else {
      setTasks(data || [])

      // Animate tasks appearing
      setTimeout(() => {
        anime({
          targets: ".task-item",
          translateY: [20, 0],
          opacity: [0, 1],
          delay: anime.stagger(100),
          easing: "easeOutQuad",
        })
      }, 100)
    }

    setIsLoading(false)
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Analyze task to estimate pomodoros
    const estimatedPomodoros = await analyzeTask(newTaskTitle, newTaskDescription)

    const newTask = {
      title: newTaskTitle,
      description: newTaskDescription,
      estimated_pomodoros: estimatedPomodoros,
      user_id: user.id,
    }

    const { data, error } = await supabase.from("tasks").insert(newTask).select().single()

    if (error) {
      console.error("Error adding task:", error)
    } else {
      setTasks([data, ...tasks])
      setNewTaskTitle("")
      setNewTaskDescription("")
      setIsAddingTask(false)

      // Animate new task
      setTimeout(() => {
        anime({
          targets: ".task-item:first-child",
          translateY: [20, 0],
          opacity: [0, 1],
          easing: "easeOutQuad",
        })
      }, 100)
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !editingTask.title.trim()) return

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: editingTask.title,
        description: editingTask.description,
      })
      .eq("id", editingTask.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating task:", error)
    } else {
      setTasks(tasks.map((task) => (task.id === data.id ? data : task)))
      setEditingTask(null)
    }
  }

  const handleDeleteTask = async (id: string) => {
    // Animate task removal
    anime({
      targets: `.task-item[data-id="${id}"]`,
      translateX: [0, -20],
      opacity: [1, 0],
      duration: 300,
      easing: "easeOutQuad",
      complete: async () => {
        const { error } = await supabase.from("tasks").delete().eq("id", id)

        if (error) {
          console.error("Error deleting task:", error)
        } else {
          setTasks(tasks.filter((task) => task.id !== id))
        }
      },
    })
  }

  const handleSelectTask = (task: Task) => {
    onSelectTask(task)

    // Animate selected task
    anime({
      targets: `.task-item[data-id="${task.id}"]`,
      scale: [1, 1.05, 1],
      duration: 400,
      easing: "easeOutElastic(1, .8)",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Tasks</span>
          {!isAddingTask ? (
            <Button onClick={() => setIsAddingTask(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Task
            </Button>
          ) : (
            <Button onClick={() => setIsAddingTask(false)} variant="outline" size="sm">
              Cancel
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAddingTask && (
          <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-5">
            <Input placeholder="Task title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
            <Textarea
              placeholder="Task description (optional)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAddTask} className="w-full">
              Add Task
            </Button>
          </div>
        )}

        {editingTask && (
          <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-5">
            <Input
              placeholder="Task title"
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
            />
            <Textarea
              placeholder="Task description (optional)"
              value={editingTask.description || ""}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              rows={3}
            />
            <div className="flex space-x-2">
              <Button onClick={handleUpdateTask} className="flex-1">
                Update Task
              </Button>
              <Button onClick={() => setEditingTask(null)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No tasks yet. Add your first task to get started!</div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="task-item p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors"
                data-id={task.id}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium">{task.title}</h3>
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.status === "completed" ? (
                        <Check className="h-3 w-3 inline mr-1" />
                      ) : task.status === "in_progress" ? (
                        <Clock className="h-3 w-3 inline mr-1" />
                      ) : (
                        "Pending"
                      )}
                    </span>
                  </div>
                  {task.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>}
                  <div className="text-xs text-gray-500 mt-1">
                    {task.completed_pomodoros} / {task.estimated_pomodoros} Pomodoros
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectTask(task)}
                    disabled={task.status === "completed"}
                  >
                    Start
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditingTask(task)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


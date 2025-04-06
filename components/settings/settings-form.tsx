"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { UserSettings } from "@/types"
import { supabase } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function SettingsForm() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } else if (data) {
      setSettings(data)
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
        toast({
          title: "Error",
          description: "Failed to create default settings",
          variant: "destructive",
        })
      } else {
        setSettings(newSettings)
      }
    }

    setLoading(false)
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    setSaving(true)

    const { error } = await supabase
      .from("user_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", settings.user_id)

    if (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    }

    setSaving(false)
  }

  const handleInputChange = (field: keyof UserSettings, value: number | boolean) => {
    if (!settings) return

    setSettings({
      ...settings,
      [field]: value,
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-red-500">Failed to load settings</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timer Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pomodoro">Pomodoro Duration (minutes)</Label>
            <Input
              id="pomodoro"
              type="number"
              min="1"
              max="60"
              value={settings.pomodoro_duration / 60}
              onChange={(e) => handleInputChange("pomodoro_duration", Number.parseInt(e.target.value) * 60)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortBreak">Short Break Duration (minutes)</Label>
            <Input
              id="shortBreak"
              type="number"
              min="1"
              max="30"
              value={settings.short_break_duration / 60}
              onChange={(e) => handleInputChange("short_break_duration", Number.parseInt(e.target.value) * 60)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longBreak">Long Break Duration (minutes)</Label>
            <Input
              id="longBreak"
              type="number"
              min="1"
              max="60"
              value={settings.long_break_duration / 60}
              onChange={(e) => handleInputChange("long_break_duration", Number.parseInt(e.target.value) * 60)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Long Break Interval (pomodoros)</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              max="10"
              value={settings.long_break_interval}
              onChange={(e) => handleInputChange("long_break_interval", Number.parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound">Sound Notification</Label>
            <Switch
              id="sound"
              checked={settings.sound_enabled}
              onCheckedChange={(checked) => handleInputChange("sound_enabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="vibration">Vibration (if supported)</Label>
            <Switch
              id="vibration"
              checked={settings.vibration_enabled}
              onCheckedChange={(checked) => handleInputChange("vibration_enabled", checked)}
            />
          </div>
        </div>

        <Button onClick={handleSaveSettings} className="w-full" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}


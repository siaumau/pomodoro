"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { OnboardingStep } from "@/types"
import { useRouter } from "next/navigation"
import anime from "animejs"

const onboardingSteps: OnboardingStep[] = [
  {
    title: "Welcome to Pomodoro Planner",
    description: "Boost your productivity with our AI-powered Pomodoro timer and task planner.",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    title: "Smart Task Analysis",
    description: "Our AI analyzes your tasks and suggests the optimal number of Pomodoro sessions needed.",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    title: "Track Your Progress",
    description: "Monitor your productivity with detailed statistics and insights.",
    image: "/placeholder.svg?height=200&width=200",
  },
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem("onboardingCompleted")
    if (onboardingCompleted === "true") {
      router.push("/dashboard")
    }
  }, [router])

  useEffect(() => {
    if (cardRef.current && contentRef.current) {
      // Reset opacity
      anime.set(contentRef.current, { opacity: 0 })

      // Animate card
      anime({
        targets: cardRef.current,
        translateX: [currentStep === 0 ? -50 : 50, 0],
        opacity: [0, 1],
        duration: 800,
        easing: "easeOutExpo",
      })

      // Animate content
      anime({
        targets: contentRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        delay: 300,
        duration: 800,
        easing: "easeOutExpo",
      })
    }
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = () => {
    localStorage.setItem("onboardingCompleted", "true")
    setHasCompletedOnboarding(true)

    // Animate exit
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        translateY: [0, -50],
        opacity: [1, 0],
        duration: 800,
        easing: "easeOutExpo",
        complete: () => {
          router.push("/dashboard")
        },
      })
    } else {
      router.push("/dashboard")
    }
  }

  const skipOnboarding = () => {
    localStorage.setItem("onboardingCompleted", "true")
    router.push("/dashboard")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <Card className="w-full max-w-md overflow-hidden shadow-xl" ref={cardRef}>
        <CardContent className="p-0">
          <div ref={contentRef} className="p-6">
            <div className="flex justify-center mb-6">
              <img
                src={onboardingSteps[currentStep].image || "/placeholder.svg"}
                alt={onboardingSteps[currentStep].title}
                className="h-48 w-auto object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">{onboardingSteps[currentStep].title}</h2>
            <p className="text-center text-gray-600 mb-6">{onboardingSteps[currentStep].description}</p>
            <div className="flex justify-center space-x-2 mb-4">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${index === currentStep ? "bg-purple-600" : "bg-gray-300"}`}
                />
              ))}
            </div>
            <div className="flex justify-between">
              {currentStep > 0 ? (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              ) : (
                <Button variant="outline" onClick={skipOnboarding}>
                  Skip
                </Button>
              )}
              <Button onClick={handleNext}>{currentStep < onboardingSteps.length - 1 ? "Next" : "Get Started"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


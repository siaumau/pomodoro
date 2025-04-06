// Simple AI task analyzer to estimate pomodoros needed
export async function analyzeTask(title: string, description?: string): Promise<number> {
  // This is a simple heuristic-based approach
  // In a real app, you might want to use a more sophisticated AI model

  const combinedText = `${title} ${description || ""}`.toLowerCase()

  // Count words as a basic complexity measure
  const wordCount = combinedText.split(/\s+/).filter(Boolean).length

  // Look for complexity indicators
  const complexityFactors = [
    { keywords: ["complex", "difficult", "challenging", "hard", "complicated"], weight: 1.5 },
    { keywords: ["research", "analyze", "investigate", "study"], weight: 1.3 },
    { keywords: ["create", "develop", "build", "implement"], weight: 1.2 },
    { keywords: ["review", "check", "test", "verify"], weight: 0.8 },
    { keywords: ["quick", "simple", "easy", "small"], weight: 0.6 },
  ]

  // Calculate complexity multiplier
  let complexityMultiplier = 1.0
  for (const factor of complexityFactors) {
    if (factor.keywords.some((keyword) => combinedText.includes(keyword))) {
      complexityMultiplier *= factor.weight
    }
  }

  // Base estimate on word count and complexity
  let estimatedPomodoros = Math.ceil((wordCount / 20) * complexityMultiplier)

  // Ensure at least 1 pomodoro and cap at a reasonable maximum
  estimatedPomodoros = Math.max(1, Math.min(estimatedPomodoros, 8))

  return estimatedPomodoros
}


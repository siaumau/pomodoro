'use client'

import { useEffect, useRef } from 'react'

export function HeroAnimation() {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    // 動態導入 anime.js
    import('animejs').then((anime) => {
      // 創建時鐘圓圈
      const clockSize = 200
      const clockCenter = clockSize / 2
      const clockRadius = clockSize * 0.4

      // 創建時鐘刻度
      const ticks = 12
      const tickElements: HTMLDivElement[] = []

      for (let i = 0; i < ticks; i++) {
        const tick = document.createElement('div')
        const angle = (i / ticks) * Math.PI * 2
        const x = Math.cos(angle) * clockRadius + clockCenter
        const y = Math.sin(angle) * clockRadius + clockCenter

        tick.style.position = 'absolute'
        tick.style.width = '4px'
        tick.style.height = '12px'
        tick.style.backgroundColor = '#7c3aed'
        tick.style.borderRadius = '2px'
        tick.style.left = `${x}px`
        tick.style.top = `${y}px`
        tick.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`

        el.appendChild(tick)
        tickElements.push(tick)
      }

      // 創建 AI 圓點
      const aiDot = document.createElement('div')
      aiDot.style.position = 'absolute'
      aiDot.style.width = '20px'
      aiDot.style.height = '20px'
      aiDot.style.backgroundColor = '#7c3aed'
      aiDot.style.borderRadius = '50%'
      aiDot.style.left = `${clockCenter}px`
      aiDot.style.top = `${clockCenter - clockRadius}px`
      aiDot.style.transform = 'translate(-50%, -50%)'
      el.appendChild(aiDot)

      // 動畫效果
      const timeline = anime.default.timeline({
        loop: true,
        direction: 'alternate',
      })

      // AI 圓點移動動畫
      timeline.add({
        targets: aiDot,
        rotate: [
          { value: 360, duration: 8000, easing: 'easeInOutQuad' }
        ],
        translateX: [
          { value: -clockRadius, duration: 2000, delay: 500 },
          { value: 0, duration: 2000, delay: 500 }
        ],
        translateY: [
          { value: 0, duration: 2000, delay: 1000 },
          { value: clockRadius, duration: 2000, delay: 500 }
        ],
        backgroundColor: [
          { value: '#7c3aed', duration: 500 },
          { value: '#4f46e5', duration: 500, delay: 1000 },
          { value: '#7c3aed', duration: 500, delay: 1000 }
        ],
        scale: [
          { value: 1.2, duration: 500, delay: 1000 },
          { value: 1, duration: 500, delay: 1000 }
        ]
      })

      // 時鐘刻度動畫
      timeline.add({
        targets: tickElements,
        scale: [
          { value: 1.2, duration: 200, delay: anime.default.stagger(100) },
          { value: 1, duration: 200, delay: anime.default.stagger(100) }
        ],
        opacity: [
          { value: 0.5, duration: 200, delay: anime.default.stagger(100) },
          { value: 1, duration: 200, delay: anime.default.stagger(100) }
        ]
      }, '-=1000')

      return () => {
        timeline.pause()
        el.innerHTML = ''
      }
    })
  }, [])

  return (
    <div
      ref={elementRef}
      className="relative w-[400px] h-[400px] bg-white/5 rounded-full backdrop-blur-sm"
      style={{
        boxShadow: '0 0 40px rgba(124, 58, 237, 0.1)',
      }}
    />
  )
}

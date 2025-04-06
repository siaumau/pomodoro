'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

export function HeroAnimation() {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    // 等待 anime.js 載入完成
    const loadAnime = async () => {
      try {
        // 確保 anime 已經載入
        if (typeof window.anime === 'undefined') {
          console.error('anime.js not loaded')
          return
        }

        const anime = window.anime

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

        // AI 圓點動畫
        const dotAnimation = anime({
          targets: aiDot,
          rotate: [0, 360],
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
          ],
          duration: 8000,
          easing: 'easeInOutQuad',
          loop: true,
          direction: 'alternate'
        })

        // 時鐘刻度動畫
        const ticksAnimation = anime({
          targets: tickElements,
          scale: [
            { value: 1.2, duration: 200 },
            { value: 1, duration: 200 }
          ],
          opacity: [
            { value: 0.5, duration: 200 },
            { value: 1, duration: 200 }
          ],
          delay: anime.stagger(100),
          loop: true,
          direction: 'alternate',
          easing: 'easeInOutQuad'
        })

        return () => {
          dotAnimation.pause()
          ticksAnimation.pause()
          el.innerHTML = ''
        }
      } catch (error) {
        console.error('Failed to load anime.js:', error)
      }
    }

    // 檢查 anime.js 是否已載入
    if (typeof window.anime !== 'undefined') {
      loadAnime()
    } else {
      // 如果還沒載入，等待載入完成
      const checkAnime = setInterval(() => {
        if (typeof window.anime !== 'undefined') {
          clearInterval(checkAnime)
          loadAnime()
        }
      }, 100)
    }
  }, [])

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"
        strategy="beforeInteractive"
      />
      <div
        ref={elementRef}
        className="relative w-[400px] h-[400px] bg-white/5 rounded-full backdrop-blur-sm"
        style={{
          boxShadow: '0 0 40px rgba(124, 58, 237, 0.1)',
        }}
      />
    </>
  )
}

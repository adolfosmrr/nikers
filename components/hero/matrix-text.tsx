"use client"

import { useEffect, useRef, useState } from "react"

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const STEPS = 14
const FRAME_MS = 32

interface MatrixTextProps {
  text: string
}

export function MatrixText({ text }: MatrixTextProps) {
  const [display, setDisplay] = useState(text)
  const previousText = useRef(text)

  useEffect(() => {
    if (previousText.current === text) return
    previousText.current = text

    const letters = text.split("")
    let step = 0

    const id = window.setInterval(() => {
      step += 1
      const progress = step / STEPS
      setDisplay(
        letters
          .map((letter, index) => {
            if (!/[A-Za-z0-9]/.test(letter)) return letter
            if (progress >= (index + 1) / letters.length) return letter
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          })
          .join(""),
      )
      if (step >= STEPS) window.clearInterval(id)
    }, FRAME_MS)

    return () => window.clearInterval(id)
  }, [text])

  return <>{display}</>
}

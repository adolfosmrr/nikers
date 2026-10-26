"use client"

import { useEffect, useRef, useState } from "react"

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const STEPS = 14
const FRAME_MS = 32

interface MatrixTextProps {
  text: string
}

// Muestra un texto y, cada vez que cambia, lo "descifra" con letras al azar
// que se van fijando de izquierda a derecha (efecto matrix).
export function MatrixText({ text }: MatrixTextProps) {
  // Lo que se ve en pantalla en cada cuadro de la animación.
  const [display, setDisplay] = useState(text)
  // Último texto animado: evita animar al montar (y el doble efecto de StrictMode).
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
            // Espacios y símbolos quedan igual; las letras ya "resueltas" también.
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

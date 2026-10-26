"use client"

import { useLayoutEffect, useRef, type ReactNode } from "react"
import gsap from "gsap"

import { clearPendingProduct } from "@/lib/transition/pending-product"

interface RevealProps {
  children: ReactNode
  className?: string
}

export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    clearPendingProduct()
    if (!el) return
    gsap.set(el, { visibility: "visible" })
    const tween = gsap.from(el.querySelectorAll(":scope > * > *"), {
      autoAlpha: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.08,
      ease: "power3.out",
      delay: 0.1,
    })
    return () => {
      tween.revert()
    }
  }, [])

  return (
    <div ref={ref} className={`invisible ${className ?? ""}`}>
      {children}
    </div>
  )
}

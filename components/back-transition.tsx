"use client"

import gsap from "gsap"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

const OVERLAY_ID = "page-fade"

function createOverlay() {
  document.getElementById(OVERLAY_ID)?.remove()
  const overlay = document.createElement("div")
  overlay.id = OVERLAY_ID
  overlay.style.cssText = "position:fixed;inset:0;z-index:200;overflow:hidden;pointer-events:none;"
  const black = document.createElement("div")
  black.style.cssText = "position:absolute;inset:0;background:#000;opacity:0;"
  overlay.append(black)
  document.body.append(overlay)
  return { black, overlay }
}

export function BackTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const pendingFade = useRef<{ black: HTMLElement; overlay: HTMLElement } | null>(null)

  useEffect(() => {
    const fadeFromSnapshot = () => {
      const main = document.getElementById("main-content")
      if (!main) return
      pendingFade.current = null

      const rect = main.getBoundingClientRect()
      const { black, overlay } = createOverlay()

      const snapshot = main.cloneNode(true) as HTMLElement
      snapshot.removeAttribute("id")
      snapshot.style.cssText = `position:absolute;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;margin:0;`
      overlay.prepend(snapshot)

      gsap
        .timeline({ onComplete: () => overlay.remove() })
        .to(black, { opacity: 1, duration: 0.4, ease: "power2.in" })
        .add(() => snapshot.remove())
        .to(black, { opacity: 0, duration: 0.5, ease: "power2.out" }, "+=0.1")
    }

    const navigation = (window as Window & { navigation?: EventTarget }).navigation
    if (navigation) {
      const onNavigate = (event: Event) => {
        if ((event as Event & { navigationType?: string }).navigationType === "traverse") fadeFromSnapshot()
      }
      navigation.addEventListener("navigate", onNavigate)
      return () => navigation.removeEventListener("navigate", onNavigate)
    }

    window.addEventListener("popstate", fadeFromSnapshot, { capture: true })
    return () => window.removeEventListener("popstate", fadeFromSnapshot, { capture: true })
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-fade-link]")
      if (!link) return
      const href = link.getAttribute("href") ?? "/"
      if (href === window.location.pathname) return

      event.preventDefault()
      event.stopPropagation()
      router.prefetch(href)

      const fade = createOverlay()
      pendingFade.current = fade
      gsap.to(fade.black, { opacity: 1, duration: 0.4, ease: "power2.in", onComplete: () => router.push(href) })
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [router])

  useEffect(() => {
    const fade = pendingFade.current
    if (!fade) return
    pendingFade.current = null
    gsap.to(fade.black, { opacity: 0, duration: 0.5, delay: 0.1, ease: "power2.out", onComplete: () => fade.overlay.remove() })
  }, [pathname])

  return null
}

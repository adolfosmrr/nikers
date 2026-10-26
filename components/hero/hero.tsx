"use client"

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types"
import gsap from "gsap"
import { Flip } from "gsap/Flip"

import type { ProductCard } from "@/lib/product/types"
import { setPendingProduct } from "@/lib/transition/pending-product"

import { HeroCard } from "./hero-card"
import { HeroCounter } from "./hero-counter"
import { HeroFeatured } from "./hero-featured"

gsap.registerPlugin(Flip)

interface HeroProps {
  products: ProductCard[]
}

type FlipState = ReturnType<typeof Flip.getState>

interface LeavingShoe {
  alt: string
  direction: 1 | -1
  rect: { height: number; left: number; top: number; width: number }
  src: string
}

export function Hero({ products }: HeroProps) {
  const [index, setIndex] = useState(0)
  const [backdrop, setBackdrop] = useState<string | null>(null)
  const [leaving, setLeaving] = useState<LeavingShoe | null>(null)

  const rootRef = useRef<HTMLElement>(null)
  const flipState = useRef<FlipState | null>(null)
  const animating = useRef(false)
  const exitTimeline = useRef<gsap.core.Timeline | null>(null)
  const pendingHref = useRef<string | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    return () => {
      exitTimeline.current?.revert()
      exitTimeline.current = null
      animating.current = false
      pendingHref.current = null
      setExiting(false)
    }
  }, [])

  const total = products.length
  const router = useRouter()

  const handleLinkClick = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-hero-link]")
    const root = rootRef.current
    if (!link || !root) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    if (animating.current) return
    animating.current = true

    const href = link.getAttribute("href") ?? "/"

    const target = products.find((p) => href === `/products/${p.handle}`)
    if (target) {
      setPendingProduct({
        shoeAlt: target.featuredImage?.altText || target.title,
        shoeUrl: target.featuredImage?.url,
        wallpaperAlt: target.wallpaper?.altText || target.title,
        wallpaperUrl: target.wallpaper?.url,
      })
    }
    router.prefetch(href, { kind: PrefetchKind.FULL })
    const ease = "power2.in"

    const card = link.closest<HTMLElement>("[data-hero-card]")
    if (card) {
      const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-card]"))
      const step = cards.indexOf(card) + 1
      pendingHref.current = href

      const shoe = root.querySelector<HTMLImageElement>("[data-featured-shoe]")
      let clone: HTMLImageElement | null = null
      if (shoe) {
        const rect = shoe.getBoundingClientRect()
        const rootRect = root.getBoundingClientRect()
        clone = shoe.cloneNode(true) as HTMLImageElement
        for (const attr of ["data-featured", "data-featured-shoe", "data-flip-id"]) clone.removeAttribute(attr)
        Object.assign(clone.style, {
          position: "absolute",
          top: `${rect.top - rootRect.top}px`,
          left: `${rect.left - rootRect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          pointerEvents: "none",
          zIndex: "20",
        })
        root.appendChild(clone)
        gsap.set(shoe, { visibility: "hidden" })
        gsap.to(clone, {
          x: -window.innerWidth,
          duration: 1.2,
          ease: "power3.inOut",
          onComplete: () => clone?.remove(),
        })
      }

      exitTimeline.current = gsap
        .timeline({ onComplete: () => jump(step) })
        .to(root.querySelectorAll('[data-exit="up"]'), { y: -40, autoAlpha: 0, duration: 0.35, ease }, 0)
        .to(root.querySelectorAll('[data-exit="down"]'), { y: 40, autoAlpha: 0, duration: 0.35, ease }, 0)
        .to(cards.filter((c) => c !== card), { x: 80, autoAlpha: 0, duration: 0.3, stagger: 0.03, ease }, 0)
        .to(card.querySelectorAll("[data-card-chrome]"), { autoAlpha: 0, duration: 0.25 }, 0)
      return
    }

    exitTimeline.current = gsap
      .timeline({ onComplete: () => router.push(href) })
      .to(root.querySelectorAll('[data-exit="up"]'), { y: -40, autoAlpha: 0, duration: 0.5, ease }, 0)
      .to(root.querySelectorAll('[data-exit="down"]'), { y: 40, autoAlpha: 0, duration: 0.5, ease }, 0)
      .to(root.querySelectorAll('[data-exit="right"]'), { x: 80, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease }, 0)
  }

  useLayoutEffect(() => {
    const root = rootRef.current
    const state = flipState.current
    if (!root || !state) return
    flipState.current = null

    const direction = Number(root.dataset.direction) || 1
    const ease = "power3.inOut"
    const duration = 1

    const tl = gsap.timeline({
      onComplete: () => {
        if (pendingHref.current) {
          const href = pendingHref.current
          pendingHref.current = null
          router.push(href)
          return
        }
        animating.current = false
        setBackdrop(null)
        setLeaving(null)
      },
    })

    const clip = (shoeEl: HTMLElement | null, bgEl: HTMLElement | null) => {
      if (!shoeEl || !bgEl) return
      const bg = bgEl.getBoundingClientRect()
      const shoe = shoeEl.getBoundingClientRect()
      const top = Math.max(0, bg.top - shoe.top)
      const right = Math.max(0, shoe.right - bg.right)
      const bottom = Math.max(0, shoe.bottom - bg.bottom)
      const left = Math.max(0, bg.left - shoe.left)
      const radius = getComputedStyle(bgEl).borderRadius
      shoeEl.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius})`
    }

    const featuredShoe = root.querySelector<HTMLElement>("[data-featured-shoe]")
    if (featuredShoe) gsap.set(featuredShoe, { clearProps: "visibility" })

    if (direction === 1) {
      const featuredBg = root.querySelector<HTMLElement>("[data-featured-bg]")
      const clipNew = () => clip(featuredShoe, featuredBg)

      tl.add(
        Flip.from(state, {
          targets: root.querySelectorAll("[data-flip-id]"),
          duration,
          ease,
          absolute: true,
          nested: true,
          props: "borderRadius",
          onStart: clipNew,
          onUpdate: clipNew,
          onComplete: () => {
            if (featuredShoe) featuredShoe.style.clipPath = ""
          },
          onEnter: (elements) => gsap.fromTo(elements, { opacity: 0 }, { opacity: 1, duration: 0.4 }),
        }),
      )

      const leavingShoe = root.querySelector("[data-leaving-shoe]")
      if (leavingShoe) tl.to(leavingShoe, { x: -window.innerWidth, duration, ease }, 0)
    } else {
      const firstCard = root.querySelector<HTMLElement>("[data-hero-card]")
      const cardBg = firstCard?.querySelector<HTMLElement>("[data-card-bg]") ?? null
      const cardShoe = firstCard?.querySelector<HTMLElement>("[data-card-shoe]") ?? null
      const chrome = firstCard?.querySelectorAll("[data-card-chrome]") ?? []
      const clipBack = () => clip(cardShoe, cardBg)

      if (firstCard) gsap.set(firstCard, { overflow: "visible" })
      gsap.set(chrome, { opacity: 0 })

      tl.add(
        Flip.from(state, {
          targets: root.querySelectorAll("[data-flip-id]:not([data-featured])"),
          duration,
          ease,
          absolute: true,
          nested: true,
          props: "borderRadius",
          onStart: clipBack,
          onUpdate: clipBack,
          onComplete: () => {
            if (cardShoe) cardShoe.style.clipPath = ""
            if (firstCard) gsap.set(firstCard, { clearProps: "overflow" })
          },
        }),
      )
      tl.to(chrome, { opacity: 1, duration: 0.4, ease: "power1.out" }, 0)

      if (featuredShoe) tl.fromTo(featuredShoe, { x: -window.innerWidth }, { x: 0, duration, ease, clearProps: "x" }, 0)
    }

    return () => {
      tl.kill()
    }
  }, [index])

  if (total === 0) return null

  const current = products[index]
  const nextProducts = Array.from({ length: total - 1 }, (_, i) => products[(index + 1 + i) % total])

  const go = (step: 1 | -1) => {
    if (animating.current || !rootRef.current) return
    animating.current = true
    const root = rootRef.current
    root.dataset.direction = String(step)

    const cards = root.querySelectorAll<HTMLElement>("[data-hero-card]")
    const outgoingCard = step === 1 ? cards[0] : cards[cards.length - 1]
    const rootRect = root.getBoundingClientRect()
    const ghosts = Array.from(outgoingCard?.querySelectorAll<HTMLElement>("[data-card-chrome]") ?? []).map((el) => {
      const rect = el.getBoundingClientRect()
      const ghost = el.cloneNode(true) as HTMLElement
      ghost.removeAttribute("data-card-chrome")
      Object.assign(ghost.style, {
        position: "absolute",
        top: `${rect.top - rootRect.top}px`,
        left: `${rect.left - rootRect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        pointerEvents: "none",
        zIndex: "20",
      })
      root.appendChild(ghost)
      return ghost
    })
    gsap.to(ghosts, { opacity: 0, duration: 0.4, ease: "power1.out", onComplete: () => ghosts.forEach((g) => g.remove()) })

    swap(step)
  }

  const jump = (step: number) => {
    const root = rootRef.current
    if (!root) return
    root.dataset.direction = "1"
    setExiting(true)
    swap(step, false)
  }

  const swap = (step: number, withLeaving = true) => {
    const root = rootRef.current
    if (!root) return

    if (step > 0) {
      flipState.current = Flip.getState(root.querySelectorAll("[data-flip-id]:not([data-featured])"), {
        props: "borderRadius",
      })

      const shoe = root.querySelector<HTMLImageElement>("[data-featured-shoe]")
      if (shoe && withLeaving) {
        const shoeRect = shoe.getBoundingClientRect()
        const rootRect = root.getBoundingClientRect()
        setLeaving({
          alt: shoe.alt,
          direction: 1,
          rect: {
            height: shoeRect.height,
            left: shoeRect.left - rootRect.left,
            top: shoeRect.top - rootRect.top,
            width: shoeRect.width,
          },
          src: shoe.currentSrc || shoe.src,
        })
      }
      setBackdrop(current.wallpaper?.url ?? null)
    } else {
      const lastCard = root.querySelector("[data-hero-card]:last-of-type")
      const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-flip-id]")).filter(
        (el) => !lastCard || (el !== lastCard && !lastCard.contains(el)),
      )
      flipState.current = Flip.getState(targets, { props: "borderRadius" })
    }

    setIndex((i) => (i + step + total) % total)
  }

  return (
    <section ref={rootRef} onClickCapture={handleLinkClick} className="relative isolate h-dvh w-full overflow-hidden bg-black data-exiting:[&_[data-exit]]:invisible" data-exiting={exiting || undefined}>
      {backdrop && (
        <div className="absolute inset-0 -z-20">
          <img alt="" className="h-full w-full object-cover" src={backdrop} />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </div>
      )}

      <div
        className="absolute inset-0 -z-10 overflow-hidden rounded-none"
        data-featured
        data-featured-bg
        data-flip-id={`bg-${current.id}`}
      >
        {current.wallpaper?.url && (
          <img
            alt={current.wallpaper.altText || current.title}
            className="h-full w-full object-cover"
            src={current.wallpaper.url}
          />
        )}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <div className="flex h-full items-center gap-8 pt-16">
        <div className="relative z-10 h-full w-1/2 shrink-0">
          <HeroFeatured product={current} />
        </div>

        <div className="flex gap-6">
          {nextProducts.map((product) => (
            <HeroCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {leaving && (
        <img
          alt={leaving.alt}
          className="pointer-events-none absolute object-contain"
          data-leaving-shoe
          src={leaving.src}
          style={leaving.rect}
        />
      )}

      <HeroCounter current={index + 1} total={total} onNext={() => go(1)} onPrev={() => go(-1)} />
    </section>
  )
}

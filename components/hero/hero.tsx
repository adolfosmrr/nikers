"use client"

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
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

// Copia de la zapatilla que sale del destacado: misma posición y tamaño que tenía.
interface LeavingShoe {
  alt: string
  direction: 1 | -1
  rect: { height: number; left: number; top: number; width: number }
  src: string
}

export function Hero({ products }: HeroProps) {
  // Único estado del hero: qué producto está destacado.
  const [index, setIndex] = useState(0)
  // Wallpaper anterior: queda quieto atrás mientras el nuevo se expande encima.
  const [backdrop, setBackdrop] = useState<string | null>(null)
  const [leaving, setLeaving] = useState<LeavingShoe | null>(null)

  const rootRef = useRef<HTMLElement>(null)
  const flipState = useRef<FlipState | null>(null)
  const animating = useRef(false)
  const exitTimeline = useRef<gsap.core.Timeline | null>(null)
  // Si hay un href acá, al terminar el Flip navegamos a ese producto.
  const pendingHref = useRef<string | null>(null)
  // Mientras sale hacia un producto, escondemos todo lo que tiene data-exit (título, precio, cards...).
  const [exiting, setExiting] = useState(false)

  // Next.js guarda la página anterior "escondida" para poder volver rápido, con el DOM tal cual quedó
  // (o sea, con los elementos invisibles por la animación de salida). React corre este cleanup
  // cuando la página se esconde, así que ahí deshacemos la salida para que al volver esté todo.
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

  // Transición de página: antes de navegar al producto, el Hero "sale".
  // Título hacia arriba; precio, botones y Prev/Next hacia abajo; cards a la derecha.
  // La zapatilla y el fondo quedan quietos: en la página del producto están en el mismo lugar.
  const handleLinkClick = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-hero-link]")
    const root = rootRef.current
    if (!link || !root) return
    // Cmd/Ctrl-click (abrir en otra pestaña) funciona normal.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    if (animating.current) return
    animating.current = true

    const href = link.getAttribute("href") ?? "/"

    // Le avisamos a la página del producto qué fondo y zapatilla mostrar mientras carga.
    const target = products.find((p) => href === `/products/${p.handle}`)
    if (target) {
      setPendingProduct({
        shoeAlt: target.featuredImage?.altText || target.title,
        shoeUrl: target.featuredImage?.url,
        wallpaperAlt: target.wallpaper?.altText || target.title,
        wallpaperUrl: target.wallpaper?.url,
      })
    }
    // Empezamos a pedir la página ya, mientras corre la animación de salida.
    router.prefetch(href)
    const ease = "power2.in"

    // Flecha de una card: primero se va todo lo demás y después esa card crece hasta ser
    // el destacado (como Next), la zapatilla activa sale a la izquierda y recién ahí navegamos.
    const card = link.closest<HTMLElement>("[data-hero-card]")
    if (card) {
      const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-card]"))
      const step = cards.indexOf(card) + 1
      pendingHref.current = href

      // La zapatilla activa empieza a irse ya: dejamos una copia en su lugar que se desliza
      // a la izquierda y escondemos la original (React la va a reusar para el producto nuevo).
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
        .timeline()
        .to(root.querySelectorAll('[data-exit="up"]'), { y: -40, autoAlpha: 0, duration: 0.5, ease }, 0)
        .to(root.querySelectorAll('[data-exit="down"]'), { y: 40, autoAlpha: 0, duration: 0.5, ease }, 0)
        .to(cards.filter((c) => c !== card), { x: 80, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease }, 0)
        .to(card.querySelectorAll("[data-card-chrome]"), { autoAlpha: 0, duration: 0.3 }, 0)
        // La expansión del fondo y el reposicionamiento arrancan 150ms antes de que termine la salida.
        .call(() => jump(step), [], 0.35)
      return
    }

    exitTimeline.current = gsap
      .timeline({ onComplete: () => router.push(href) })
      .to(root.querySelectorAll('[data-exit="up"]'), { y: -40, autoAlpha: 0, duration: 0.5, ease }, 0)
      .to(root.querySelectorAll('[data-exit="down"]'), { y: 40, autoAlpha: 0, duration: 0.5, ease }, 0)
      .to(root.querySelectorAll('[data-exit="right"]'), { x: 80, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease }, 0)
  }

  // 3) Después de que React movió todo, Flip anima desde la foto vieja a la nueva.
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
          router.push(pendingHref.current)
          return
        }
        animating.current = false
        setBackdrop(null)
        setLeaving(null)
      },
    })

    // Recorta una zapatilla con el rectángulo (y el redondeado) de un fondo que se está moviendo.
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
    // Si la escondimos al tocar la flecha de una card, la mostramos recién acá:
    // React ya le puso la imagen nueva y todavía no se pintó, así que no se ve la vieja.
    if (featuredShoe) gsap.set(featuredShoe, { clearProps: "visibility" })

    if (direction === 1) {
      // NEXT: la primera card crece hasta ser el destacado.
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

      // La zapatilla vieja se desliza fuera hacia la izquierda.
      const leavingShoe = root.querySelector("[data-leaving-shoe]")
      if (leavingShoe) tl.to(leavingShoe, { x: -window.innerWidth, duration, ease }, 0)
    } else {
      // PREV: el destacado actual se achica y vuelve a ser la primera card.
      const firstCard = root.querySelector<HTMLElement>("[data-hero-card]")
      const cardBg = firstCard?.querySelector<HTMLElement>("[data-card-bg]") ?? null
      const cardShoe = firstCard?.querySelector<HTMLElement>("[data-card-shoe]") ?? null
      const chrome = firstCard?.querySelectorAll("[data-card-chrome]") ?? []
      const clipBack = () => clip(cardShoe, cardBg)

      // Mientras se achica, la card no recorta: el fondo arranca a pantalla completa.
      if (firstCard) gsap.set(firstCard, { overflow: "visible" })
      // Overlay, título y flecha de la card aparecen recién al final.
      gsap.set(chrome, { opacity: 0 })

      tl.add(
        Flip.from(state, {
          // El nuevo destacado no se "flipea": entra deslizándose.
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

      // La zapatilla anterior entra deslizándose desde la izquierda.
      if (featuredShoe) tl.fromTo(featuredShoe, { x: -window.innerWidth }, { x: 0, duration, ease, clearProps: "x" }, 0)
    }


    return () => {
      tl.kill()
    }
  }, [index])

  if (total === 0) return null

  const current = products[index]
  // Las cards muestran los productos que vienen después del actual.
  const nextProducts = Array.from({ length: total - 1 }, (_, i) => products[(index + 1 + i) % total])

  const go = (step: 1 | -1) => {
    if (animating.current || !rootRef.current) return
    animating.current = true
    const root = rootRef.current
    root.dataset.direction = String(step)

    // 0) La card que se va (la primera en Next, la última en Prev) desaparece del DOM
    //    al cambiar el índice. Dejamos una copia de su título y su flecha en el mismo
    //    lugar y la desvanecemos al mismo tiempo que arranca la zapatilla.
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

  // Salta directo a la card número `step` (1 = la primera) con la animación de Next.
  const jump = (step: number) => {
    const root = rootRef.current
    if (!root) return
    root.dataset.direction = "1"
    setExiting(true)
    swap(step, false)
  }

  // step > 0: avanza `step` productos (Next o salto a una card). step -1: Prev.
  const swap = (step: number, withLeaving = true) => {
    const root = rootRef.current
    if (!root) return

    if (step > 0) {
      // 1) Foto de dónde está cada elemento con data-flip-id ahora mismo.
      //    El fondo y la zapatilla del destacado actual no entran: esos salen de otra forma.
      flipState.current = Flip.getState(root.querySelectorAll("[data-flip-id]:not([data-featured])"), {
        // Flip solo puede animar el redondeado si lo guarda también en la "foto" inicial.
        props: "borderRadius",
      })

      // Guardamos dónde está la zapatilla actual para dejar una copia que se deslice.
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
      // En Prev sí guardamos el destacado actual (va a volver a la card),
      // pero no la última card: ese producto pasa a ser el destacado.
      const lastCard = root.querySelector("[data-hero-card]:last-of-type")
      const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-flip-id]")).filter(
        (el) => !lastCard || (el !== lastCard && !lastCard.contains(el)),
      )
      flipState.current = Flip.getState(targets, { props: "borderRadius" })
    }

    // 2) Cambiamos el índice y React re-ordena el DOM.
    setIndex((i) => (i + step + total) % total)
  }

  return (
    <section ref={rootRef} onClickCapture={handleLinkClick} className="relative isolate h-dvh w-full overflow-hidden bg-black data-exiting:[&_[data-exit]]:invisible" data-exiting={exiting || undefined}>
      {/* Wallpaper anterior quieto atrás (con su overlay) mientras el nuevo se expande */}
      {backdrop && (
        <div className="absolute inset-0 -z-20">
          <img alt="" className="h-full w-full object-cover" src={backdrop} />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        </div>
      )}

      {/* Fondo a pantalla completa + overlay: mismo data-flip-id que el fondo de su card */}
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
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

"use client"

import { useState, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import gsap from 'gsap'

import { formatPrice } from "@/lib/money"
import { ProductCard } from "@/lib/product/types"

interface HeroProps {
    products: ProductCard[]
}

type Direction = "next" | "prev";

const BAR_GAP = 0.1
const BAR_SHRINK = 0.4
const FILL_CATCH_UP = 0.22
const HOLD_MS = 300
const SLIDE_DURATION = 5

const MATRIX_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

function neighbor(index: number, direction: Direction, total: number): number {
    const step = direction === "next" ? 1 : -1;
    return (index + step + total) % total;
}

function writeGlyphs(nodes: Array<HTMLElement | null>, value: string) {
    for (const node of nodes) {
        if (node) node.textContent = value
    }
}

function playMatrix(nodes: Array<HTMLElement | null>, target: string, uppercase = true): () => void {
    const letters = (uppercase ? target.toUpperCase() : target).split("")
    const glyphs = uppercase ? MATRIX_GLYPHS : `${MATRIX_GLYPHS}abcdefghijklmnopqrstuvwxyz`
    const steps = 14
    let step = 0

    const frame = () => {
        step += 1
        const progress = step / steps
        const value = letters
            .map((letter, index) => {
                if (!/[A-Za-z0-9]/.test(letter)) return letter
                if (progress >= (index + 1) / letters.length) return letter
                return glyphs[Math.floor(Math.random() * glyphs.length)] ?? letter
            })
            .join("")
        writeGlyphs(nodes, value)
    }

    frame()
    const id = window.setInterval(() => {
        frame()
        if (step >= steps) window.clearInterval(id)
    }, 32)

    return () => window.clearInterval(id)
}

function Wallpaper({
    frameRef,
    priority = false,
    product,
}: {
    frameRef: RefObject<HTMLDivElement | null>
    priority?: boolean
    product: ProductCard
}) {
    return (
        <div className="absolute inset-0 z-0 bg-neutral-950">
            {
                product.wallpaper?.url ? (
                    <div ref={frameRef} className="absolute inset-0 z-1 origin-center">
                        <Image
                            alt={product.wallpaper.altText || product.title}
                            className="object-cover"
                            fill
                            priority={priority}
                            sizes="100vw"
                            src={product.wallpaper.url}
                        />
                    </div>
                ) : null
            }
            <div className="absolute inset-0 z-2 bg-black/50 backdrop-blur-xs" />
        </div>
    )
}

function TitlePriceButton({
    hidden = false,
    priceRef,
    product,
    titleRef,
}: {
    hidden?: boolean
    priceRef: RefObject<HTMLParagraphElement | null>
    product: ProductCard
    titleRef: RefObject<HTMLHeadingElement | null>
}) {
    return (
        <div
            className="absolute bottom-40 left-0 w-full data-[hidden=true]:pointer-events-none data-[hidden=true]:opacity-0"
            data-hidden={hidden ? "true" : "false"}
        >
            <h1
                className="text-center font-mono text-2xl font-bold text-white"
                ref={titleRef}
            >
                {product.title}
            </h1>
            <div className="absolute inset-x-0 top-full z-30 mt-2.5 flex flex-col items-center gap-4">
                <p
                    className="text-center font-mono font-bold text-xl text-white"
                    ref={priceRef}
                >
                    {formatPrice(product.price)}
                </p>
                <button
                    className="cursor-pointer px-5 py-2 font-mono text-sm font-semibold bg-black/70 text-white"
                    onPointerDown={(event) => event.stopPropagation()}
                    type="button"
                >
                    Buy it now
                </button>
            </div>
        </div>
    )
}

function StoryBars({
    barsRef,
    products,
}: {
    barsRef: RefObject<Array<HTMLSpanElement | null>>
    products: ProductCard[]
}) {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-20 z-10 mx-auto flex max-w-90 gap-1 px-5"
        >
            {products.map((product, productIndex) => (
                <span
                    key={product.id}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                >
                    <span
                        ref={(node) => {
                            if (node) barsRef.current[productIndex] = node
                        }}
                        className="block h-full w-full origin-left scale-x-0 bg-white"
                    />
                </span>
            ))}
        </div>
    )
}

function Shoe({
    frameRef,
    hidden = false,
    priority = false,
    product,
}: {
    frameRef: RefObject<HTMLDivElement | null>
    hidden?: boolean
    priority?: boolean
    product: ProductCard
}) {
    const image = product.featuredImage
    const canSize = Boolean(image && image.width > 0 && image.height > 0)

    if (!image || !canSize) return null

    return (
        <div
            ref={frameRef}
            className="absolute top-[50%] left-1/2 z-10 w-2/5 -translate-x-1/2 -translate-y-1/2 data-[hidden=true]:opacity-0"
            data-hidden={hidden ? "true" : "false"}
        >
            <Image
                alt={image.altText || product.title}
                className="h-auto w-full max-w-150 mx-auto"
                height={image.height}
                priority={priority}
                sizes="100vw"
                src={image.url}
                width={image.width}
            />
        </div>
    )
}



export default function Hero({ products }: HeroProps) {
    const total = products.length
    const [index, setIndex] = useState(0)
    const [incomingIndex, setIncomingIndex] = useState(total > 1 ? 1 : 0)
    const [side, setSide] = useState<Direction | null>(null)
    const [word, setWord] = useState("next")

    const curtainRef = useRef<HTMLDivElement>(null)
    const currentWallpaperRef = useRef<HTMLDivElement>(null)
    const incomingWallpaperRef = useRef<HTMLDivElement>(null)
    const currentTitleRef = useRef<HTMLHeadingElement>(null)
    const incomingTitleRef = useRef<HTMLHeadingElement>(null)
    const currentPriceRef = useRef<HTMLParagraphElement>(null)
    const incomingPriceRef = useRef<HTMLParagraphElement>(null)
    const currentShoeRef = useRef<HTMLDivElement>(null)
    const incomingShoeRef = useRef<HTMLDivElement>(null)
    const busyRef = useRef(false)
    const sideRef = useRef<Direction>("next")
    const timelineRef = useRef<gsap.core.Timeline | null>(null)
    const labelRef = useRef<HTMLDivElement>(null)
    const mainWordRef = useRef<HTMLSpanElement>(null)
    const cyanWordRef = useRef<HTMLSpanElement>(null)
    const magentaWordRef = useRef<HTMLSpanElement>(null)
    const moveXRef = useRef<gsap.QuickToFunc | null>(null)
    const moveYRef = useRef<gsap.QuickToFunc | null>(null)
    const labelPlacedRef = useRef(false)
    const redShiftRef = useRef<SVGFEOffsetElement>(null)
    const blueShiftRef = useRef<SVGFEOffsetElement>(null)
    const titleMatrixRef = useRef<(() => void) | null>(null)
    const barsRef = useRef<Array<HTMLSpanElement | null>>([])
    const fillTweenRef = useRef<gsap.core.Tween | null>(null)
    const shrinkTweenRef = useRef<gsap.core.Tween | null>(null)
    const delayRef = useRef<gsap.core.Tween | null>(null)
    const catchUpRef = useRef<gsap.core.Tween | null>(null)
    const handoffRef = useRef<(direction: Direction) => void>(() => {})
    const startLoadingRef = useRef<(barIndex: number) => void>(() => {})
    const heldRef = useRef(false)
    const pressStartRef = useRef(0)
    const suppressClickRef = useRef(false)
    const switchingRef = useRef(false)

    useEffect(() => {
        return () => {
            timelineRef.current?.kill();
            titleMatrixRef.current?.()
            fillTweenRef.current?.kill()
            shrinkTweenRef.current?.kill()
            delayRef.current?.kill()
            catchUpRef.current?.kill()
        }
    }, [])

    useLayoutEffect(() => {
        if (total < 2) return
        startLoadingRef.current(0)
    }, [total])

    useLayoutEffect(() => {
        const label = labelRef.current
        if (!label) return

        gsap.set(label, { xPercent: -50, yPercent: -50 })
        moveXRef.current = gsap.quickTo(label, "x", { duration: 0.28, ease: "power3.out" })
        moveYRef.current = gsap.quickTo(label, "y", { duration: 0.28, ease: "power3.out" })
    }, [])

    useLayoutEffect(() => {
        if (!side) return

        const main = mainWordRef.current
        const cyan = cyanWordRef.current
        const magenta = magentaWordRef.current
        if (!main || !cyan || !magenta) return

        const glitch = gsap.timeline({ defaults: { ease: "none" } })
        glitch
            .set(cyan, { opacity: 0.9, x: -5 })
            .set(magenta, { opacity: 0.9, x: 5 })
            .to(main, { clipPath: "inset(65% 0% 45% 0%)", duration: 0.06 })
            .to(main, { clipPath: "inset(28% 0% 80% 0%)", duration: 0.06 })
            .to(main, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.07 })
            .set(cyan, { opacity: 0, x: 0 })
            .set(magenta, { opacity: 0, x: 0 })

        const stopMatrix = playMatrix([main, cyan, magenta], word)

        return () => {
            stopMatrix()
            glitch.kill()
            gsap.set(main, { clipPath: "inset(0% 0% 0% 0%)" })
            gsap.set([cyan, magenta], { opacity: 0, x: 0 })
            writeGlyphs([main, cyan, magenta], word.toUpperCase())
        }
    }, [side, word])

    useLayoutEffect(() => {
        if (!busyRef.current) return;

        gsap.set(curtainRef.current, { clipPath: "inset(0% 0% 0% 0%)" });
        const wallpaperFrames = [currentWallpaperRef.current, incomingWallpaperRef.current].filter(
            (frame) => frame !== null
        )
        if (wallpaperFrames.length) {
            gsap.set(wallpaperFrames, { rotation: 0, scale: 1 })
        }
        redShiftRef.current?.setAttribute("dx", "0")
        blueShiftRef.current?.setAttribute("dx", "0")
        gsap.set(
            [
                currentTitleRef.current,
                incomingTitleRef.current,
                currentShoeRef.current,
                incomingShoeRef.current
            ],
            { clearProps: "all" }
        )

        busyRef.current = false;
        switchingRef.current = false;
        if (total < 2) return;
        setIncomingIndex(neighbor(index, sideRef.current, total));
    }, [index, total])

    if (total === 0) return null;

    const current = products[index];
    const incoming = products[incomingIndex]
    if (!current || !incoming) return null;

    function onMouseMove(event: React.MouseEvent<HTMLElement>) {
        const bounds = event.currentTarget.getBoundingClientRect();
        const localX = event.clientX - bounds.left
        const localY = event.clientY - bounds.top

        if (labelPlacedRef.current) {
            gsap.set(labelRef.current, { x: localX, y: localY })
            labelPlacedRef.current = true
        } else {
            moveXRef.current?.(localX)
            moveYRef.current?.(localY)
        }

        const direction: Direction = localX < bounds.width / 2 ? "prev" : "next"

        sideRef.current = direction
        if (direction === side) return
        setSide(direction)
        setWord(direction === "prev" ? "Prev" : "Next")
        if (busyRef.current || switchingRef.current || total < 2) return
        setIncomingIndex(neighbor(index, direction, total))
    }

    function startLoading(barIndex: number) {
        const fill = barsRef.current[barIndex]
        if (!fill || total < 2) return

        fillTweenRef.current?.kill()
        gsap.set(fill, { scaleX: 0, transformOrigin: "left center" })
        fillTweenRef.current = gsap.to(fill, {
            scaleX: 1,
            duration: SLIDE_DURATION,
            ease: "none",
            onComplete: () => handoffRef.current("next"),
        })
        if (heldRef.current) fillTweenRef.current.pause()
    }

    function shrinkBar(barIndex: number, direction: Direction) {
        const fill = barsRef.current[barIndex]
        if (!fill) return

        shrinkTweenRef.current?.kill()
        if (direction === "next") {
            gsap.set(fill, { scaleX: 1, transformOrigin: "right center" })
        } else {
            gsap.set(fill, { transformOrigin: "left center" })
        }
        shrinkTweenRef.current = gsap.to(fill, {
            scaleX: 0,
            duration: BAR_SHRINK,
            ease: "power2.in",
        })
    }

    function beginChange(direction: Direction) {
        const target = neighbor(index, direction, total)
        shrinkBar(index, direction)
        startLoading(target)
        go(direction)
    }

    function handoff(direction: Direction) {
        if (busyRef.current || switchingRef.current || total < 2) return

        switchingRef.current = true
        const running = fillTweenRef.current
        fillTweenRef.current = null
        if (running && running.progress() < 1) running.kill()
        delayRef.current?.kill()
        catchUpRef.current?.kill()
        const target = neighbor(index, direction, total)
        flushSync(() => setIncomingIndex(target))

        const fill = barsRef.current[index]
        const scale = fill ? Number(gsap.getProperty(fill, "scaleX")) : 1
        const leave = () => beginChange(direction)

        if (direction === "prev" || scale >= 0.995 || !fill) {
            leave()
            return
        }

        catchUpRef.current = gsap.to(fill, {
            scaleX: 1,
            duration: FILL_CATCH_UP,
            ease: "power1.out",
            onComplete: () => {
                delayRef.current = gsap.delayedCall(BAR_GAP, leave)
            },
        })
    }

    function onPointerDown(event: React.PointerEvent<HTMLElement>) {
        if (event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        heldRef.current = true
        pressStartRef.current = performance.now()
        suppressClickRef.current = false
        fillTweenRef.current?.pause()
    }

    function onPointerUp(event: React.PointerEvent<HTMLElement>) {
        if (!heldRef.current) return
        heldRef.current = false
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
        const held = performance.now() - pressStartRef.current >= HOLD_MS
        suppressClickRef.current = true
        if (held) {
            if (!switchingRef.current && !busyRef.current) fillTweenRef.current?.resume()
            return
        }
        if (switchingRef.current || busyRef.current) {
            fillTweenRef.current?.resume()
            return
        }
        const bounds = event.currentTarget.getBoundingClientRect()
        const direction: Direction = event.clientX - bounds.left < bounds.width / 2 ? "prev" : "next"
        handoff(direction)
    }

    function onSlideClick(direction: Direction) {
        if (suppressClickRef.current) {
            suppressClickRef.current = false
            return
        }
        handoff(direction)
    }

    function go(direction: Direction) {
        if (busyRef.current || total < 2) return;

        const target = neighbor(index, direction, total)
        const revealFromRight = direction === "next"
        const travel = window.innerWidth * 0.75
        const leaveX = revealFromRight ? -travel : travel
        const enterX = -leaveX
        const smearX = revealFromRight ? 48 : -48
        const rotationCurrent = direction === "next" ? -20 : 20
        const rotationIncoming = direction === "next" ? 20 : -20

        busyRef.current = true;
        if (currentShoeRef.current) currentShoeRef.current.style.filter = "url(#shoe-smear)"
        if (incomingShoeRef.current) incomingShoeRef.current.style.filter = "url(#shoe-smear)"
        sideRef.current = direction;

        const arriving = products[target] ?? incoming
        titleMatrixRef.current?.()
        const stopTitle = playMatrix([currentTitleRef.current], arriving.title, false)
        const stopPrice = playMatrix([currentPriceRef.current], formatPrice(arriving.price), false)
        titleMatrixRef.current = () => {
            stopTitle()
            stopPrice()
        }

        const currentWallpaper = currentWallpaperRef.current
        const incomingWallpaper = incomingWallpaperRef.current

        timelineRef.current?.kill()
        timelineRef.current = gsap.timeline({
            defaults: { duration: 0.8, ease: "power3.inOut" },
            onComplete: () => setIndex(target)
        })
            .to(curtainRef.current, {
                clipPath: revealFromRight ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)",
            }, 0)

        if (currentWallpaper) {
            timelineRef.current.fromTo(currentWallpaper, {
                rotation: 0,
                scale: 1,
            }, {
                rotate: rotationCurrent,
                scale: 1.4,
            }, 0)
        }

        if (incomingWallpaper) {
            timelineRef.current.fromTo(incomingWallpaper, {
                rotate: rotationIncoming,
                scale: 1.4,
            }, {
                rotation: 0,
                scale: 1,
            }, 0)
        }

        timelineRef.current
            .fromTo(currentShoeRef.current, {
                opacity: 1, x: 0, xPercent: -50
            }, {
                opacity: 0, x: leaveX, xPercent: -50
            }, 0)
            .fromTo(incomingShoeRef.current, {
                opacity: 0, x: enterX, xPercent: -50
            }, {
                opacity: 1, x: 0, xPercent: -50
            }, 0)
            .fromTo(redShiftRef.current, {
                attr: { dx: 0 }
            }, {
                attr: { dx: smearX }, duration: 0.35, ease: "power2.out"
            }, 0)
            .to(redShiftRef.current, {
                attr: { dx: 0 }, duration: 0.45, ease: "power2.in"
            }, 0.35)
            .fromTo(blueShiftRef.current, {
                attr: { dx: 0 }
            }, {
                attr: { dx: smearX * 0.60 }, duration: 0.35, ease: "power2.out"
            }, 0)
            .to(blueShiftRef.current, {
                attr: { dx: 0 }, duration: 0.45, ease: "power2.in"
            },             0.35)
    }

    handoffRef.current = handoff
    startLoadingRef.current = startLoading

    return (
        <section
            className="relative h-screen max-h-150 w-full cursor-none! overflow-hidden bg-neutral-950 **:cursor-none!"
            onMouseLeave={() => setSide(null)}
            onMouseMove={onMouseMove}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
        >
            <svg aria-hidden="true" className="absolute h-0 w-0">
                <filter id="shoe-smear" x="-20%" y="0%" width="140%" height="100%">
                    <feColorMatrix
                        in="SourceGraphic"
                        result="red"
                        type="matrix"
                        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    />
                    <feOffset ref={redShiftRef} in="red" dx="0" dy="0" result="redMoved" />
                    <feColorMatrix
                        in="SourceGraphic"
                        result="green"
                        type="matrix"
                        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    />
                    <feColorMatrix
                        in="SourceGraphic"
                        result="blue"
                        type="matrix"
                        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                    />
                    <feOffset ref={blueShiftRef} in="blue" dx="0" dy="0" result="blueMoved" />
                    <feComposite in="redMoved" in2="green" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="redGreen" />
                    <feComposite in="redGreen" in2="blueMoved" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                </filter>
            </svg>
            <Wallpaper frameRef={incomingWallpaperRef} product={incoming} />
            <div
                ref={curtainRef}
                className="absolute inset-0"
            >
                <Wallpaper frameRef={currentWallpaperRef} priority product={current} />
            </div>

            <StoryBars barsRef={barsRef} products={products} />

            <Shoe frameRef={incomingShoeRef} hidden product={incoming} />
            <Shoe frameRef={currentShoeRef} priority product={current} />

            <TitlePriceButton hidden priceRef={incomingPriceRef} product={incoming} titleRef={incomingTitleRef} />
            <TitlePriceButton priceRef={currentPriceRef} product={current} titleRef={currentTitleRef} />

            <button
                aria-label="prev"
                className="absolute inset-y-0 left-0 z-20 w-1/2"
                onClick={() => onSlideClick("prev")}
                type="button"
            >
            </button>
            <button
                aria-label="next"
                className="absolute inset-y-0 right-0 z-20 w-1/2"
                onClick={() => onSlideClick("next")}
                type="button"
            >
            </button>
            <div
                ref={labelRef}
                aria-hidden="true"
                data-visible={side ? "true" : "false"}
                className="pointer-events-none absolute top-0 left-0 z-30 opacity-0 select-none data-[visible=true]:opacity-100 mix-blend-difference"
            >
                <span
                    ref={cyanWordRef}
                    className="absolute top-0 left-0 text-3xl font-semibold tracking-widest text-cyan-400 uppercase opacity-0 mix-blend-screen"
                >
                    {word}
                </span>
                <span
                    ref={magentaWordRef}
                    className="absolute top-0 left-0 text-3xl font-semibold tracking-widest text-fuchsia-400 uppercase opacity-0 mix-blend-screen"
                >
                    {word}
                </span>
                <span
                    ref={mainWordRef}
                    className="relative text-3xl font-semibold tracking-widest text-white uppercase"
                >
                    {word}
                </span>
            </div>
        </section>
    )
}
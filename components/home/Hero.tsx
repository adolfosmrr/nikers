"use client"

import { useState, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import gsap from 'gsap'
import * as THREE from "three"

import { ProductCard } from "@/lib/product/types"

interface HeroProps {
    products: ProductCard[]
}

type Direction = "next" | "prev";

function neighbor(index: number, direction: Direction, total: number): number {
    const step = direction === "next" ? 1 : -1;
    return (index + step + total) % total;
}

function Wallpaper({ priority = false, product }: { priority?: boolean, product: ProductCard }) {
    return (
        <div className="absolute inset-0 bg-neutral-950 z-0">
            {
                product.wallpaper?.url ? (
                    <Image
                        alt={product.wallpaper?.altText || product.title}
                        className="object-cover relative z-1"
                        fill
                        priority={priority}
                        sizes="100vw"
                        src={product.wallpaper.url}
                    />
                ) : null
            }
            {/* Overlay Background */} <div className="absolute inset-0 z-2"></div>
        </div>
    )
}

function Title({ hidden = false, product, titleRef }: { hidden?: boolean, product: ProductCard, titleRef: RefObject<HTMLHeadingElement | null> }) {
    return (
        <h1
            className="absolute bottom-[30%] left-1/2 transform -translate-x-1/2 font-mono text-4xl text-white data-[hidden=true]:opacity-0"
            ref={titleRef}
            data-hidden={hidden ? 'true' : 'false'}
        >
            {
                product.title
            }
        </h1>
    )
}

function Shoe({
    frameRef,
    hidden = false,
    product,
    smearRef,
}: {
    frameRef: RefObject<HTMLDivElement | null>
    hidden?: boolean
    product: ProductCard
    smearRef: RefObject<{ value: number }>
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const image = product.featuredImage
    const canSize = Boolean(image && image.width > 0 && image.height > 0)

    useEffect(() => {
        const canvas = canvasRef.current
        const frame = frameRef.current
        if (!canvas || !frame || !image || !canSize) return

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.setClearColor(0x000000, 0)

        const scene = new THREE.Scene()
        const pad = 1.8
        const camera = new THREE.OrthographicCamera(-0.5 * pad, 0.5 * pad, 0.5 * pad, -0.5 * pad, 0.1, 10)
        camera.position.z = 1

        const uniforms = {
            uHover: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uSmear: { value: 0 },
            uTexture: { value: new THREE.Texture() },
        }

        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin("anonymous")
        loader.load(image.url, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            uniforms.uTexture.value = texture
        })

        const material = new THREE.ShaderMaterial({
            transparent: true,
            uniforms,
            vertexShader: `
                uniform float uHover;
                uniform float uSmear;
                uniform vec2 uMouse;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    pos.x += uSmear * mix(1.0, 0.15, uv.y);
                    float dist = distance(uv, uMouse);
                    float pull = exp(-dist * dist * 12.0) * uHover;
                    pos.x += (uMouse.x - 0.5) * pull * 0.35;
                    pos.y += (uMouse.y - 0.5) * pull * 0.35;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(uTexture, vUv);
                }
            `,
        })

        const geometry = new THREE.PlaneGeometry(1, 1, 40, 40)
        scene.add(new THREE.Mesh(geometry, material))

        const resize = () => {
            const width = frame.clientWidth
            const height = frame.clientHeight
            if (width === 0 || height === 0) return
            renderer.setSize(width, height, false)
        }
        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(frame)

        let hovering = false
        const onPointerMove = (event: PointerEvent) => {
            const bounds = frame.getBoundingClientRect()
            const inside =
                event.clientX >= bounds.left &&
                event.clientX <= bounds.right &&
                event.clientY >= bounds.top &&
                event.clientY <= bounds.bottom

            if (inside) {
                uniforms.uMouse.value.set(
                    (event.clientX - bounds.left) / bounds.width,
                    1 - (event.clientY - bounds.top) / bounds.height,
                )
            }
            if (inside === hovering) return
            hovering = inside
            gsap.to(uniforms.uHover, { duration: 0.35, ease: "power2.out", value: inside ? 1 : 0 })
        }
        window.addEventListener("pointermove", onPointerMove)

        let raf = 0
        const tick = () => {
            uniforms.uSmear.value = smearRef.current?.value ?? 0
            renderer.render(scene, camera)
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(raf)
            observer.disconnect()
            window.removeEventListener("pointermove", onPointerMove)
            geometry.dispose()
            material.dispose()
            uniforms.uTexture.value.dispose()
            renderer.dispose()
        }
    }, [canSize, frameRef, image, smearRef])

    if (!image || !canSize) return null

    return (
        <div
            ref={frameRef}
            className="absolute top-1/2 left-1/2 z-10 w-3/5 -translate-x-1/2 -translate-y-1/2 data-[hidden=true]:opacity-0"
            data-hidden={hidden ? "true" : "false"}
            style={{ aspectRatio: `${image.width} / ${image.height}` }}
        >
            <canvas ref={canvasRef} className="h-full w-full" />
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
    const currentTitleRef = useRef<HTMLHeadingElement>(null)
    const incomingTitleRef = useRef<HTMLHeadingElement>(null)
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
    const currentBend = useRef({ value: 0})
    const incomingBend = useRef({ value: 0})

    useEffect(() => {
        return () => {
            timelineRef.current?.kill();
        }
    }, [])

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

        const glitch = gsap.timeline({ default: { ease: "none" } })
        glitch
            .set(cyan, { opacity: 0.9, x: -5 })
            .set(magenta, { opacity: 0.9, x: 5 })
            .to(main, { clipPath: "inset(65% 0% 45% 0%)", duration: 0.06 })
            .to(main, { clipPath: "inset(28% 0% 80% 0%)", duration: 0.06 })
            .to(main, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.07 })
            .set(cyan, { opacity: 0, x: 0 })
            .set(magenta, { opacity: 0, x: 0 })

        return () => {
            glitch.kill()
            gsap.set(main, { clipPath: "inset(0% 0% 0% 0%)" })
            gsap.set([cyan, magenta], { opacity: 0, x: 0 })
        }
    }, [side])

    useLayoutEffect(() => {
        if (!busyRef.current) return;

        gsap.set(curtainRef.current, { clipPath: "inset(0% 0% 0% 0%)" });
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
        if (busyRef.current || total < 2) return
        setIncomingIndex(neighbor(index, direction, total))
    }

    function go(direction: Direction) {
        if (busyRef.current || total < 2) return;

        const target = neighbor(index, direction, total)
        const revealFromRight = direction === "next"
        const travel = window.innerWidth * 0.75
        const leaveX = revealFromRight ? -travel : travel
        const enterX = -leaveX
        const smearX = revealFromRight ? 48 : -48
        const bend = revealFromRight ? 0.28 : -0.28

        busyRef.current = true;
        if (currentShoeRef.current) currentShoeRef.current.style.filter = "url(#shoe-smear)"
        if (incomingShoeRef.current) incomingShoeRef.current.style.filter = "url(#shoe-smear)"
        sideRef.current = direction;

        timelineRef.current?.kill()
        timelineRef.current = gsap.timeline({
            defaults: { duration: 0.8, ease: "power3.inOut" },
            onComplete: () => setIndex(target)
        })
            .to(curtainRef.current, {
                clipPath: revealFromRight ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)",
            }, 0)
            .to(currentTitleRef.current, { opacity: 0, y: revealFromRight ? -48 : 48 }, 0)
            .to(incomingTitleRef.current, { opacity: 0, y: revealFromRight ? -48 : 48 }, 0)
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
            }, 0.35)
            .fromTo(currentBend.current, { value: 0 }, {
                value: bend, duration: 0.35, ease: "power2.out"
            }, 0)
            .to(currentBend.current, {
                value: 0, duration: 0.45, ease: "power2.in"
            }, 0.35)
            .fromTo(incomingBend.current, { value: 0 }, {
                value: bend, duration: 0.35, ease: "power2.out"
            }, 0)
            .to(incomingBend.current, {
                value: 0, duration: 0.45, ease: "power2.in"
            }, 0.35)
    }

    return (
        <section
            className="relative h-screen min-h-200 w-full overflow-hidden bg-neutral-950"
            onMouseLeave={() => setSide(null)}
            onMouseMove={onMouseMove}
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
            <Wallpaper product={incoming} />
            <div
                ref={curtainRef}
                className="absolute inset-0"
            >
                <Wallpaper priority product={current} />
            </div>

            <Shoe frameRef={incomingShoeRef} hidden product={incoming} smearRef={incomingBend} />
            <Shoe frameRef={currentShoeRef} product={current} smearRef={currentBend} />

            <Title hidden product={incoming} titleRef={incomingTitleRef} />
            <Title product={current} titleRef={currentTitleRef} />

            <button
                aria-label="prev"
                className="absolute inset-y-0 left-0 z-20 w-1/2 cursor-pointer"
                onClick={() => go("prev")}
                type="button"
            >
            </button>
            <button
                aria-label="next"
                className="absolute inset-y-0 right-0 z-20 w-1/2 cursor-pointer"
                onClick={() => go("next")}
                type="button"
            >
            </button>
            <div
                ref={labelRef}
                aria-hidden="true"
                data-visible={side ? "true" : "false"}
                className="pointer-events-none absolute top-0 left-0 z-30 opacity-0 select-none data-[visible=true]:opacity-100"
            >
                <span
                    ref={cyanWordRef}
                    className="absolute top-0 left-0 text-5xl font-semibold tracking-widest text-cyan-400 uppercase opacity-0 mix-blend-screen"
                >
                    {word}
                </span>
                <span
                    ref={magentaWordRef}
                    className="absolute top-0 left-0 text-5xl font-semibold tracking-widest text-fuchsia-400 uppercase opacity-0 mix-blend-screen"
                >
                    {word}
                </span>
                <span
                    ref={mainWordRef}
                    className="relative text-5xl font-semibold tracking-widest text-white uppercase"
                >
                    {word}
                </span>
            </div>
        </section>
    )
}
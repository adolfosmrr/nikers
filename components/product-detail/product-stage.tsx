import type { ReactNode } from "react"

interface ProductStageProps {
  children?: ReactNode
  shoeAlt: string
  shoeUrl?: string
  wallpaperAlt: string
  wallpaperUrl?: string
}

// Esqueleto visual de la página de producto (igual al Hero): fondo + overlay,
// zapatilla a la izquierda y un lugar a la derecha para la info.
// Lo usan la página real y el "fallback" de carga, así las dos se ven idénticas.
export function ProductStage({ children, shoeAlt, shoeUrl, wallpaperAlt, wallpaperUrl }: ProductStageProps) {
  return (
    <section className="relative isolate -mt-16 flex h-dvh w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0 -z-10">
        {wallpaperUrl && <img alt={wallpaperAlt} className="h-full w-full object-cover" src={wallpaperUrl} />}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      </div>

      <div className="flex h-full w-full items-center gap-8 pt-16">
        {/* Izquierda: solo la zapatilla, en la misma posición que en el Hero */}
        <div className="flex h-full w-1/2 shrink-0 flex-col items-center justify-center px-10">
          {/* Espacio del título del Hero (invisible) para que la zapatilla quede a la misma altura */}
          <div aria-hidden className="h-[2lh] font-mono text-[48px] leading-tight" />
          <div className="relative my-8 h-[40vh] w-full max-w-xl">
            {shoeUrl && <img alt={shoeAlt} className="h-full w-full object-contain" src={shoeUrl} />}
          </div>
        </div>

        {children}
      </div>
    </section>
  )
}

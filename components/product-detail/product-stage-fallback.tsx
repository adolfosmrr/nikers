"use client"

import { useState, type ReactNode } from "react"

import { getPendingProduct } from "@/lib/transition/pending-product"

import { ProductStage } from "./product-stage"

// Mientras carga la página del producto:
// - si venimos del Hero, mostramos el mismo fondo y zapatilla (no hay pantalla en blanco);
// - si no (por ejemplo, entrando directo por URL), el skeleton de siempre.
export function ProductStageFallback({ skeleton }: { skeleton: ReactNode }) {
  const [pending] = useState(getPendingProduct)
  if (!pending) return <>{skeleton}</>
  return <ProductStage {...pending} />
}

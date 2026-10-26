"use client"

import { useState, type ReactNode } from "react"

import { getPendingProduct } from "@/lib/transition/pending-product"

import { ProductStage } from "./product-stage"

export function ProductStageFallback({ skeleton }: { skeleton: ReactNode }) {
  const [pending] = useState(getPendingProduct)
  if (!pending) return <>{skeleton}</>
  return <ProductStage {...pending} />
}

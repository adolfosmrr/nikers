"use client"

import Link from "next/link"

import { useCartDrawer } from "@/components/cart/context"
import { addToCart } from "@/lib/cart/add-to-cart"

import type { ProductCard } from "@/lib/product/types"

import { MatrixText } from "./matrix-text"

interface HeroFeaturedProps {
  product: ProductCard
}

export function HeroFeatured({ product }: HeroFeaturedProps) {
  const { openOverlay } = useCartDrawer()
  const variantId = product.defaultVariantId

  const handleAdd = () => {
    if (!variantId) return
    addToCart(variantId)
    openOverlay()
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-10 text-white">
      <div className="flex h-[2lh] items-end font-mono text-[48px] leading-tight" data-exit="up">
        <h1 className="line-clamp-2 text-balance text-center"><MatrixText text={product.title} /></h1>
      </div>

      <div className="relative my-8 h-[40vh] w-full max-w-xl">
        {product.featuredImage && (
          <img
            alt={product.featuredImage.altText || product.title}
            className="h-full w-full object-contain"
            data-featured
            data-featured-shoe
            data-flip-id={`shoe-${product.id}`}
            src={product.featuredImage.url}
          />
        )}
      </div>

      <div className="absolute right-10 bottom-8 left-10 flex h-9 items-center justify-between">
        <p className="max-w-xs text-2xl" data-exit="down">
          <MatrixText text={`${product.price.amount} ${product.price.currencyCode}`} />
        </p>

        <div className="flex items-center gap-3" data-exit="down">
          <button
            aria-label="Add to cart"
            className="size-9 cursor-pointer rounded-full bg-white text-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!variantId || !product.availableForSale}
            onClick={handleAdd}
            type="button"
          >
            +
          </button>
          <Link className="rounded-full bg-white px-4 py-1 text-black" data-hero-link href={`/products/${product.handle}`}>
            See more
          </Link>
        </div>
      </div>
    </div>
  )
}

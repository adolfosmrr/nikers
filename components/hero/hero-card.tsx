import Link from "next/link"

import type { ProductCard } from "@/lib/product/types"

interface HeroCardProps {
  product: ProductCard
}

export function HeroCard({ product }: HeroCardProps) {
  return (
    <article
      className="relative h-80 w-52 shrink-0 overflow-hidden rounded-2xl bg-neutral-800"
      data-flip-id={`card-${product.id}`}
      data-exit="right"
      data-hero-card
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-2xl"
        data-card-bg
        data-flip-id={`bg-${product.id}`}
      >
        {product.wallpaper?.url && (
          <img
            alt={product.wallpaper.altText || product.title}
            className="h-full w-full object-cover"
            src={product.wallpaper.url}
          />
        )}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <div className="relative flex items-center gap-2 p-3 text-white" data-card-chrome>
        <h2 className="truncate font-mono text-sm font-bold">{product.title}</h2>
      </div>

      {product.featuredImage && (
        <img
          alt={product.featuredImage.altText || product.title}
          className="absolute inset-y-0 left-[10%] my-auto w-[140%] max-w-none object-contain"
          data-card-shoe
          data-flip-id={`shoe-${product.id}`}
          src={product.featuredImage.url}
        />
      )}

      <Link
        aria-label={`View ${product.title}`}
        data-card-chrome
        data-hero-link
        className="absolute bottom-3 left-3 flex size-8 items-center justify-center rounded-full bg-white text-black"
        href={`/products/${product.handle}`}
      >
        →
      </Link>
    </article>
  )
}

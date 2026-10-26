import { cn } from "cn";
import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";

import { DiscountBadge } from "@/components/product/discount-badge";
import { Price } from "@/components/product/price";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

function ProductCard({ className, children, ...props }: ComponentProps<"article">) {
  return (
    <article
      data-slot="product-card"
      className={cn("relative flex flex-col h-full overflow-hidden", className)}
      {...props}
    >
      {children}
    </article>
  );
}

function ProductCardImageContainer({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="product-card-image-container"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface ProductCardImageProps {
  alt: string;
  children?: ReactNode;
  className?: string;
  height?: number;
  loading?: "eager" | "lazy";
  outOfStock?: boolean;
  outOfStockText?: string;
  src?: string | null;
  wallpaperAlt?: string;
  wallpaperSrc?: string | null;
  width?: number;
}

interface ProductWallpaperProps {
  alt: string;
  src?: string | null;
}

function ProductWallpaper({ alt, src }: ProductWallpaperProps) {
  if (!src) return null;

  return (
    <div className="absolute inset-0 z-1">
      <Image alt={alt} className="object-cover relative z-1" fill sizes="100vw" src={src} />
      <div className="absolute inset-0 z-2 bg-black/50 backdrop-blur-[1px]" />
    </div>
  );
}

function ProductCardImage({
  alt,
  children,
  className,
  height,
  loading = "lazy",
  outOfStock = false,
  outOfStockText,
  src,
  wallpaperAlt,
  wallpaperSrc,
  width,
}: ProductCardImageProps) {
  return (
    <div
      data-slot="product-card-image"
      className={cn(
        "relative flex aspect-square h-auto items-center justify-center overflow-hidden",
        className,
      )}
    >
      
      {src ? (
        <div className="relative size-full flex justify-center items-center">
          <Image
            src={src}
            alt={alt}
            {...(width && height ? { height, width } : { fill: true })}
            className="relative z-2 mx-auto block w-4/5 object-cover"
            loading={loading}
            sizes="100vw"
          />
          <ProductWallpaper alt={wallpaperAlt ?? alt} src={wallpaperSrc} />
        </div>
      ) : (
        <ImagePlaceholder className="relative z-1 size-full" />
      )}
      {children}
    </div>
  );
}

function ProductCardContent({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="product-card-content"
      className={cn("flex flex-col flex-1 py-2.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ProductCardTitle({ className, children, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="product-card-title"
      className={cn("text-sm font-medium text-foreground line-clamp-1", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

interface ProductCardPriceProps {
  amount: string;
  currencyCode: string;
  maxAmount?: string;
  compareAtAmount?: string;
  compareAtCurrencyCode?: string;
  className?: string;
}

function getDiscountPercent(price: number, compareAtPrice: number | undefined): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function ProductCardPrice({
  amount,
  currencyCode,
  maxAmount,
  compareAtAmount,
  compareAtCurrencyCode,
  className,
}: ProductCardPriceProps) {
  const priceNum = parseFloat(amount);
  const compareAtNum = compareAtAmount ? parseFloat(compareAtAmount) : undefined;
  const isRange = maxAmount != null && maxAmount !== amount;
  const discountPercent = isRange ? null : getDiscountPercent(priceNum, compareAtNum);
  return (
    <div data-slot="product-card-price" className={cn(className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-baseline gap-x-1 text-sm text-foreground">
          <Price amount={amount} currencyCode={currencyCode} className="text-sm text-foreground" />
          {isRange && (
            <>
              <span>–</span>
              <Price
                amount={maxAmount}
                currencyCode={currencyCode}
                className="text-sm text-foreground"
              />
            </>
          )}
        </span>
        {discountPercent && compareAtAmount && compareAtCurrencyCode && (
          <>
            <Price
              amount={compareAtAmount}
              currencyCode={compareAtCurrencyCode}
              className="text-xs text-muted-foreground line-through"
            />
            <DiscountBadge percent={discountPercent} />
          </>
        )}
      </div>
    </div>
  );
}

function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="product-card-skeleton"
      className={cn("flex flex-col overflow-hidden", className)}
    >
      <ImagePlaceholder className="aspect-square animate-pulse" />
      <div className="py-2.5 h-12 box-content grid gap-2">
        <div className="h-4 w-full bg-accent animate-pulse" />
        <div className="h-4 w-12 bg-accent animate-pulse" />
      </div>
    </div>
  );
}

export {
  ProductCard,
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCardSkeleton,
  ProductCardTitle,
};

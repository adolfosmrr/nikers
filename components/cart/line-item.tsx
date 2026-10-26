"use client";

import type { CartLine as HydrogenCartLine } from "@shopify/hydrogen";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Link } from "@/components/ui/link";
import { useCart } from "@/lib/cart/client";
import type { CartLine } from "@/lib/cart/types";
import { formatPrice } from "@/lib/money";

import { CartLineForm } from "./line-form";
import { CartWarnings } from "./warnings";

interface CartLineItemsProps {
  lines: CartLine[];
}

export function CartLineItems({ lines }: CartLineItemsProps) {
  const keys = getLineRowKeys(lines);
  return (
    <ul className="grid gap-5" aria-label="Cart items">
      {lines.map((line, index) => (
        <CartLineItem key={keys[index]} item={line} />
      ))}
    </ul>
  );
}

// Shopify replaces a new line's `optimistic:` ID on confirmation, so rows key by the identity Hydrogen matches lines on.
function getLineRowKeys(lines: CartLine[]) {
  const keys = lines.map((line) =>
    JSON.stringify([
      line.merchandise?.id ?? line.id,
      line.sellingPlanAllocation?.sellingPlan.id ?? null,
      (line.attributes ?? []).map(({ key, value }) => JSON.stringify([key, value])).sort(),
    ]),
  );
  return keys.map((key, index) =>
    keys.indexOf(key) === keys.lastIndexOf(key) ? key : lines[index].id,
  );
}

interface CartLineItemProps {
  item: CartLine;
}

function CartLineItem({ item }: CartLineItemProps) {
  const isPending = useCart((state) => state.pending.lines.has(item.id));
  const isCostPending = useCart((state) =>
    Boolean(state.pending.cost || state.revalidating || state.pending.lines.has(item.id)),
  );
  const { cost, merchandise, quantity } = item;
  const instructions = "instructions" in item ? item.instructions : undefined;
  const canUpdateQuantity = !(
    instructions &&
    typeof instructions === "object" &&
    "canUpdateQuantity" in instructions &&
    instructions.canUpdateQuantity === false
  );
  const canRemove = !(
    instructions &&
    typeof instructions === "object" &&
    "canRemove" in instructions &&
    instructions.canRemove === false
  );
  const components = (item as HydrogenCartLine).lineComponents ?? [];
  const isOptimistic = item.id.startsWith("optimistic:");
  const currencyCode = cost.totalAmount.currencyCode;
  const finalUnitPrice = quantity > 0 ? Number(cost.totalAmount.amount) / quantity : 0;
  const sellingUnitPrice = Number(cost.amountPerQuantity.amount);
  const compareAtUnitPrice = Number(cost.compareAtAmountPerQuantity?.amount ?? 0);
  const originalUnitPrice =
    finalUnitPrice < sellingUnitPrice ? sellingUnitPrice : compareAtUnitPrice;
  const title = merchandise?.product.title || "Cart item";
  const href = merchandise?.product.handle ? `/products/${merchandise.product.handle}` : undefined;
  const image = merchandise?.image;
  const wallpaperRef = merchandise?.product.wallpaper?.reference;
  const wallpaper = wallpaperRef && "image" in wallpaperRef ? wallpaperRef.image?.url : undefined;
  // Igual que las cards del Hero: wallpaper + overlay de fondo y la zapatilla cortada por el borde
  const imageContent = (
    <>
      {wallpaper && <img alt="" className="absolute inset-0 h-full w-full object-cover" src={wallpaper} />}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      {image?.url ? (
        <img
          alt={image.altText || title}
          className="absolute inset-y-0 left-[15%] my-auto w-[140%] max-w-none object-contain"
          src={image.url}
        />
      ) : (
        <ImagePlaceholder className="relative size-full" />
      )}
    </>
  );
  const price = (amount: number) => formatPrice({ amount: String(amount), currencyCode });

  return (
    <li className="flex gap-3 rounded-2xl bg-black p-3 text-white" aria-busy={isPending || undefined} aria-label={title}>
      {href ? (
        <Link
          href={href}
          className="relative size-24 shrink-0 cursor-pointer self-start overflow-hidden rounded-[calc(var(--radius-2xl)---spacing(3))] bg-neutral-800 transition-opacity hover:opacity-80"
        >
          {imageContent}
        </Link>
      ) : (
        <div className="relative size-24 shrink-0 self-start overflow-hidden rounded-[calc(var(--radius-2xl)---spacing(3))] bg-neutral-800">{imageContent}</div>
      )}
      <div className="grid min-h-24 min-w-0 flex-1 gap-2.5 pt-0.5">
        <div className="grid gap-2.5">
          <div className="grid gap-1">
            {href ? (
              <Link href={href} className="cursor-pointer transition-opacity hover:opacity-70">
                <h3 className="line-clamp-1 font-mono text-sm font-bold text-white">{title}</h3>
              </Link>
            ) : (
              <h3 className="line-clamp-1 font-mono text-sm font-bold text-white">{title}</h3>
            )}
            {/* "Default Title" es lo que Shopify pone cuando el producto no tiene variantes: lo ocultamos */}
            {merchandise?.selectedOptions?.some((option) => option.value !== "Default Title") ? (
              <p className="text-xs text-white/60">
                {merchandise.selectedOptions.map((option) => option.value).join(" / ")}
              </p>
            ) : null}
            {item.sellingPlanAllocation ? (
              <p className="text-xs text-white/60">
                {item.sellingPlanAllocation.sellingPlan.name || "Subscription"}
              </p>
            ) : null}
          </div>
          {components.length ? (
            <div className="grid gap-1">
              <p className="text-xs font-medium text-white/60">Bundle Includes</p>
              <ul className="grid gap-0.5">
                {components.map((component) => (
                  <li
                    key={component.id}
                    className="flex items-center gap-1.5 text-xs text-white/60"
                  >
                    <span className="truncate">
                      {component.merchandise?.product.title || "Bundle item"}
                    </span>
                    {component.quantity > 1 ? <span>×{component.quantity}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <CartLineForm
          className="flex items-center gap-1.5 self-end"
          lineId={item.id}
          minQuantity={canRemove ? 0 : 1}
        >
          {(register) => (
            <>
              <div
                aria-label="Item quantity"
                className="grid h-6 grid-cols-[1.75rem_1.5rem_1.75rem] rounded-full ring-1 ring-white/30 ring-inset"
                role="group"
              >
                <button
                  {...register("decrease")}
                  type="submit"
                  aria-label="Decrease quantity"
                  className="flex h-6 cursor-pointer items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isOptimistic || !canUpdateQuantity || quantity <= 1}
                >
                  <MinusIcon className="size-3 shrink-0" />
                </button>
                <input
                  key={quantity}
                  {...register("quantity", { interactive: true, value: quantity })}
                  aria-label="Item quantity"
                  className="h-6 w-6 rounded-full bg-transparent text-center text-xs font-medium tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
                  disabled={isOptimistic || !canUpdateQuantity}
                  max={99}
                  min={canRemove ? 0 : 1}
                />
                <button
                  {...register("increase")}
                  type="submit"
                  aria-label="Increase quantity"
                  className="flex h-6 cursor-pointer items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isOptimistic || !canUpdateQuantity || quantity >= 99}
                >
                  <PlusIcon className="size-3 shrink-0" />
                </button>
              </div>
              <button
                {...register("remove")}
                type="submit"
                className="flex cursor-pointer items-center justify-center text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isOptimistic || !canRemove}
                aria-label="Remove item"
              >
                <Trash2Icon className="size-4" />
              </button>
            </>
          )}
        </CartLineForm>
        <CartWarnings lineId={item.id} />
      </div>
      <div className="grid gap-0.5 self-start py-0.5 text-right font-mono text-sm tabular-nums tracking-tight">
        <span
          className="font-medium text-white data-[pending=true]:text-white/60"
          data-pending={isCostPending || !currencyCode}
        >
          {isCostPending || !currencyCode ? "Updating…" : price(finalUnitPrice)}
        </span>
        {!isCostPending && currencyCode && originalUnitPrice > finalUnitPrice ? (
          <span className="text-xs text-white/60 line-through">
            {price(originalUnitPrice)}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export interface PendingProduct {
  shoeAlt: string
  shoeUrl?: string
  wallpaperAlt: string
  wallpaperUrl?: string
}

let pending: PendingProduct | null = null

export function setPendingProduct(product: PendingProduct) {
  pending = product
}

export function getPendingProduct(): PendingProduct | null {
  return pending
}

export function clearPendingProduct() {
  pending = null
}

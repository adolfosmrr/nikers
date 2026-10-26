// Guarda en memoria (del navegador) qué producto se está abriendo desde el Hero,
// para que la página del producto pueda mostrar su fondo y su zapatilla mientras carga.
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

// Se limpia cuando la página real ya se mostró, para que no quede "pegado" para otra navegación.
export function clearPendingProduct() {
  pending = null
}

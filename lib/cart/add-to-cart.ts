// Hydrogen deja sus "Standard Actions" en window.Shopify.actions. updateCart es la forma
// oficial de cambiar el carrito desde código: el CartProvider lo escucha, así que el
// carrito se actualiza al toque (optimista) igual que cuando se envía un formulario.
type UpdateCart = (payload: { lines: Array<{ merchandiseId: string; quantity: number }> }) => Promise<unknown>;
type ShopifyWindow = Window & { Shopify?: { actions?: { updateCart?: UpdateCart } } };

export function addToCart(merchandiseId: string, quantity = 1) {
  const updateCart = (window as ShopifyWindow).Shopify?.actions?.updateCart;
  if (!updateCart) return Promise.resolve(null);
  return updateCart({ lines: [{ merchandiseId, quantity }] });
}

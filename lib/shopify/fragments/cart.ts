import { gql } from "@shopify/hydrogen";

export const CART_FRAGMENT = gql(/* GraphQL */ `
  fragment CartFragment on Cart {
    updatedAt
    lines(first: 250) {
      nodes {
        sellingPlanAllocation {
          sellingPlan {
            name
          }
        }
        # Wallpaper del producto, para el fondo de la card en el carrito
        merchandise {
          ... on ProductVariant {
            product {
              wallpaper: metafield(namespace: "custom", key: "product_wallpaper") {
                reference {
                  ... on MediaImage {
                    image {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);

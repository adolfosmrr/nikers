import { gql } from "@shopify/hydrogen";

import { BUNDLE_RELATIONSHIPS_FRAGMENT } from "@/lib/shopify/fragments/bundle";

export const PRODUCT_VARIANT_FRAGMENT = gql(
  `#graphql
  fragment ProductVariantFields on ProductVariant {
    id
    title
    availableForSale
    price {
      amount
        currencyCode
    }
    compareAtPrice {
      amount
        currencyCode
    }
    selectedOptions {
      name
      value
    }
    image {
      url
        altText
        width
        height
    }
    product {
      handle
      requiresSellingPlan
      title
    }
    sellingPlanAllocations(first: 100) {
      nodes {
        priceAdjustments {
          compareAtPrice {
            amount
            currencyCode
          }
          price {
            amount
            currencyCode
          }
        }
        sellingPlan {
          description
          id
          name
          recurringDeliveries
        }
      }
    }
  }
`,
);
export const PURCHASABLE_PRODUCT_VARIANT_FRAGMENT = gql(
  `#graphql
  fragment PurchasableProductVariantFields on ProductVariant {
    ...BundleRelationshipFields
    ...ProductVariantFields
  }
`,
  [BUNDLE_RELATIONSHIPS_FRAGMENT, PRODUCT_VARIANT_FRAGMENT],
);

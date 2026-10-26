import type { ProductInput } from "@shopify/hydrogen";

import type { Image, Video } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";
import type { PageInfo } from "@/lib/pagination/types";
import type { SEO } from "@/lib/seo/types";

export type SelectedOptions = Record<string, string>;

export type ProductFormVariant = Pick<
  ProductVariant,
  | "availableForSale"
  | "compareAtPrice"
  | "id"
  | "image"
  | "price"
  | "requiresSellingPlan"
  | "selectedOptions"
  | "sellingPlanAllocations"
  | "title"
> & {
  product: { handle: string; title: string };
  requiresBundleConfiguration: boolean;
};

export interface ProductFormSwatch extends OptionValueSwatch {
  variantImage?: string;
}

export type ProductFormInput = ProductInput<ProductFormVariant> & {
  options: Array<{
    name: string;
    optionValues: Array<{
      firstSelectableVariant: ProductFormVariant | null;
      name: string;
      swatch?: ProductFormSwatch;
    }>;
  }>;
};

interface OptionValueState {
  available: boolean;
  crossProduct: boolean;
  exists: boolean;
  href: string;
  image?: string;
  name: string;
  selected: boolean;
  swatch?: OptionValueSwatch;
}

export interface OptionGroupState {
  name: string;
  values: OptionValueState[];
}

export interface ProductCard {
  availableForSale: boolean;
  compareAtPrice?: Money;
  defaultVariantSelectedOptions?: SelectedOption[];
  defaultVariantId?: string;
  featuredImage: Image | null;
  wallpaper?: { url: string; altText?: string | null };
  handle: string;
  id: string;
  isGiftCard: boolean;
  maxPrice: Money;
  price: Money;
  title: string;
  vendor?: string;
}

export interface QuickShopProduct {
  availableForSale: boolean;
  form: ProductFormInput;
  hasOptions: boolean;
  image: string | null;
  title: string;
}

export interface RecentlyViewedProduct {
  featuredImage: Image | null;
  handle: string;
  id: string;
  price: Money;
  title: string;
}

export interface ProductPage {
  pageInfo: PageInfo;
  products: ProductCard[];
}

export interface ProductDetails extends ProductCard {
  adjacentVariants: ProductVariant[];
  allVariantsInStock: boolean;
  category?: Category | null;
  compareAtPriceRange?: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  currencyCode: string;
  defaultVariant?: ProductVariant;
  defaultVariantSku?: string;
  description: string;
  descriptionHtml: string;
  encodedVariantAvailability?: string;
  encodedVariantExistence?: string;
  hasUniformPricing: boolean;
  images: Image[];
  options: ProductOption[];
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  seo: SEO;
  updatedAt: string;
  variants?: ProductVariant[];
  variantsCount: number;
  videos: Video[];
}

export interface ProductVariant {
  availableForSale: boolean;
  bundleParents: ProductVariantReference[];
  compareAtPrice?: Money;
  components: ProductVariantComponent[];
  id: string;
  image: Image | null;
  price: Money;
  productHandle: string;
  productTitle: string;
  requiresComponents: boolean;
  requiresSellingPlan: boolean;
  selectedOptions: SelectedOption[];
  sellingPlanAllocations: SellingPlanAllocation[];
  title: string;
}

export interface SellingPlanAllocation {
  compareAtPrice: Money;
  price: Money;
  sellingPlan: {
    description?: string | null;
    id: string;
    name: string;
    recurringDeliveries: boolean;
  };
}

export interface ProductVariantComponent {
  quantity: number;
  variant: ProductVariantReference;
}

export interface ProductVariantReference {
  id: string;
  image: Image | null;
  product: {
    featuredImage: Image | null;
    handle: string;
    id: string;
    title: string;
  };
  title: string;
}

export interface ProductOption {
  id: string;
  name: string;
  values: OptionValue[];
}

export interface OptionValueSwatch {
  color?: string;
  image?: string;
}

export interface OptionValue {
  firstSelectableVariant?: ProductVariant;
  id: string;
  image?: string;
  name: string;
  swatch?: OptionValueSwatch;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface Category {
  ancestors: Category[];
  id: string;
  name: string;
}

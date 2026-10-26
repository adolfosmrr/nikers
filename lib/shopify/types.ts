import type { GraphQLFormattedError } from "@shopify/hydrogen";
import type { CustomerAccountDocument } from "@shopify/hydrogen/customer-account";

export type ResultOf<Doc> = Doc extends { __apiType?: (variables: never) => infer Result }
  ? Result
  : never;
export interface StorefrontResponse<T> {
  data?: T | null;
  errors?: GraphQLFormattedError[];
}
export type CustomerAccountResultOf<Doc> =
  Doc extends CustomerAccountDocument<infer Result, never, string> ? Result : never;
